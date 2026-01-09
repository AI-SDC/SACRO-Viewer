import getpass
import hashlib
import html
import json
import logging
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.http import (
    FileResponse,
    Http404,
    HttpResponse,
    HttpResponseBadRequest,
    JsonResponse,
)
from django.shortcuts import redirect
from django.template.loader import render_to_string
from django.template.response import TemplateResponse
from django.urls import reverse
from django.views.decorators.http import require_GET, require_POST

from sacro import errors, models, utils
from sacro.adapters import local_audit, zipfile


logger = logging.getLogger(__name__)


REVIEWS = {}


RESEARCHER_SESSIONS = {}


def format_mime_type(mime_type):
    """
    Convert MIME types to user-friendly display names.

    Args:
        mime_type: The MIME type string

    Returns:
        A user-friendly string representation
    """
    if not mime_type:
        return ""

    mime_map = {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word Document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "Excel Spreadsheet",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PowerPoint",
        "application/msword": "Word Document",
        "application/vnd.ms-excel": "Excel Spreadsheet",
        "application/vnd.ms-powerpoint": "PowerPoint",
        "application/pdf": "PDF",
        "text/plain": "Text",
        "text/csv": "CSV",
        "image/png": "PNG Image",
        "image/jpeg": "JPEG Image",
        "image/jpg": "JPG Image",
        "image/gif": "GIF Image",
        "application/json": "JSON",
    }

    return mime_map.get(mime_type, mime_type)


def get_filepath_from_request(data, name):
    param_path = data.get(name)
    if param_path is None:
        raise Http404

    path = Path(param_path)

    if not path.exists():  # pragma: no cover
        raise Http404

    return path


def get_outputs_from_request(data):
    """Use outputs path from request and load it"""
    path = get_filepath_from_request(data, "path")
    return models.load_from_path(path)


@require_GET
def load(request):
    dirpath = get_filepath_from_request(request.GET, "dirpath")
    try:
        path = models.find_acro_metadata(dirpath)
    except models.MultipleACROFiles as exc:
        return errors.error(request, status=500, message=str(exc))
    return redirect(utils.reverse_with_params({"path": str(path)}, "index"))


@require_GET
def index(request):
    """Render the template with all details"""
    data = request.GET
    if "path" not in request.GET and settings.DEBUG:
        data = {"path": "outputs/results.json"}

    outputs = get_outputs_from_request(data)
    create_url = utils.reverse_with_params({"path": str(outputs.path)}, "review-create")

    return TemplateResponse(
        request,
        "index.html",
        context={
            "outputs": dict(outputs),
            "config": outputs.config,
            "version": outputs.version,
            "create_url": create_url,
        },
    )


@require_GET
def contents(request):
    """Return file contents.

    We also require the json file and check that the requested file is present
    in the json.  This prevents loading arbitrary user files over http.
    """
    outputs = get_outputs_from_request(request.GET)
    output = request.GET.get("output")
    filename = request.GET.get("filename")

    file_path = None
    try:
        file_path = outputs.get_file_path(output, filename)
    except KeyError:
        pass

    if file_path is None:
        logger.info(
            f"output file {filename} for output {output} not found in {outputs.path}"
        )
        raise Http404

    try:
        import mimetypes

        content_type, _ = mimetypes.guess_type(file_path)
        is_pdf = content_type == "application/pdf"

        response = FileResponse(
            open(file_path, "rb"), as_attachment=not is_pdf, filename=filename
        )
    except FileNotFoundError:  # pragma: no cover
        raise Http404

    # enable electron opening this file with native app
    response["Content-Disposition"] += "; native=true"
    return response


@require_POST
def approved_outputs(request, pk):
    if not (review := REVIEWS.get(pk)):
        raise Http404

    outputs = models.ACROOutputs(review["path"])

    approved_outputs = [k for k, v in review["decisions"].items() if v["state"] is True]
    in_memory_zf = zipfile.create(outputs, review, approved_outputs)

    # use the directory name as the files might all just be results.json
    filename = f"{outputs.path.parent.stem}_{outputs.path.stem}.zip"

    username = getpass.getuser()
    local_audit.log_release(review["decisions"], username)

    return FileResponse(in_memory_zf, as_attachment=True, filename=filename)


@require_POST
def review_create(request):
    if not (comment := html.unescape(request.POST.get("comment", ""))):
        return HttpResponseBadRequest("no comment data submitted")

    if not (raw_review := html.unescape(request.POST.get("review", ""))):
        return HttpResponseBadRequest("no review data submitted")

    review = json.loads(html.unescape(raw_review))

    # we load the path from the querystring, even though this is a post request
    # check the reviewed outputs are valid
    outputs = get_outputs_from_request(request.GET)
    approved_outputs = [k for k, v in review.items() if v["state"] is True]
    unrecognized_outputs = [o for o in approved_outputs if o not in outputs]
    if unrecognized_outputs:
        return HttpResponseBadRequest(f"invalid output names: {unrecognized_outputs}")

    REVIEWS["current"] = {
        "comment": comment,
        "decisions": review,
        "path": outputs.path,
    }

    return redirect("review-detail", pk="current")


@require_GET
def review_detail(request, pk):
    if not (review := REVIEWS.get(pk)):
        raise Http404

    approved_outputs_url = reverse("approved-outputs", kwargs={"pk": "current"})
    summary_url = reverse("summary", kwargs={"pk": "current"})

    approved = sum(1 for o in review["decisions"].values() if o["state"])
    total = len(review["decisions"])
    counts = {
        "total": total,
        "approved": approved,
        "rejected": total - approved,
    }

    context = {
        "approved_outputs_url": approved_outputs_url,
        "counts": counts,
        "review": review,
        "summary_url": summary_url,
    }

    return TemplateResponse(request, "review.html", context=context)


@require_POST
def summary(request, pk):
    if not (review := REVIEWS.get(pk)):
        raise Http404

    outputs = models.ACROOutputs(review["path"])
    content = zipfile.get_summary(review, outputs)

    # Use an HttpResponse because FileResponse is for file handles which we
    # don't have here
    return HttpResponse(
        content,
        content_type="text/plain",
        headers={"Content-Disposition": "attachment;filename=summary.txt"},
    )


@require_GET
def role_selection(request):
    """
    Landing page that shows two buttons:
    - Researcher: for researchers to build ACRO metadata via GUI
    - Output Checker: for output checkers to review and approve outputs
    """
    return TemplateResponse(request, "role_selection.html")


@require_GET
def researcher_index(request):
    """
    Main researcher interface - similar to output checker index but with
    researcher-specific actions (add comments, add exceptions, save draft, finalize).

    This view loads existing ACRO metadata or creates scaffold metadata if none exists.
    Researchers can then add comments and exceptions via the GUI instead of writing code.
    """

    data = request.GET
    if "path" not in request.GET and settings.DEBUG:
        data = {"path": "outputs/results.json"}

    outputs = get_outputs_from_request(data)

    draft_path = outputs.path.parent / "results.json"
    if draft_path.exists():
        outputs = models.load_from_path(draft_path)

    return TemplateResponse(
        request,
        "researcher_index.html",
        context={
            "outputs": dict(outputs),
            "config": outputs.config,
            "version": outputs.version,
            "path": str(outputs.path),
            "username": getpass.getuser(),
        },
    )


@require_GET
def researcher_load(request):
    """
    Load a directory for researcher to work on.
    Finds ACRO metadata in the directory or scaffolds new metadata if none exists.
    """
    dirpath = get_filepath_from_request(request.GET, "dirpath")
    try:
        path = models.find_acro_metadata(dirpath)
    except models.MultipleACROFiles as exc:
        return errors.error(request, status=500, message=str(exc))
    return redirect(utils.reverse_with_params({"path": str(path)}, "researcher-index"))


@require_POST
def researcher_save_session(request):
    """
    Save researcher's current work as a draft session.
    Saves to results.json file in the outputs directory.
    """
    try:
        outputs = get_outputs_from_request(request.GET)
        session_data = json.loads(request.POST.get("session_data", "{}"))

        # Ensure proper structure
        if "version" not in session_data:
            session_data["version"] = outputs.version
        if "results" not in session_data:
            session_data["results"] = {}

        draft_path = outputs.path.parent / "results.json"
        with open(draft_path, "w") as f:
            json.dump(session_data, f, indent=2)

        logger.info(f"Saved draft session to {draft_path}")

        return JsonResponse(
            {
                "success": True,
                "message": "Draft saved successfully",
                "saved_at": datetime.now().isoformat(),
            }
        )

    except Exception as e:
        logger.error(f"Error saving session: {e}")
        return JsonResponse(
            {
                "success": False,
                "message": str(e),
            },
            status=500,
        )


@require_GET
def researcher_load_session(request):
    """
    Load a previously saved draft session from results.json.
    """
    try:
        outputs = get_outputs_from_request(request.GET)
        draft_path = outputs.path.parent / "results.json"

        if not draft_path.exists():
            return JsonResponse(
                {
                    "success": False,
                    "message": "No draft session found",
                },
                status=404,
            )

        with open(draft_path) as f:
            session_data = json.load(f)

        return JsonResponse(
            {
                "success": True,
                "data": session_data,
                "saved_at": draft_path.stat().st_mtime,
            }
        )

    except Exception as e:
        logger.error(f"Error loading session: {e}")
        return JsonResponse(
            {
                "success": False,
                "message": str(e),
            },
            status=500,
        )


@require_POST
def researcher_finalize(request):
    """
    Finalize researcher's work and create final results.json.
    This is the GUI equivalent of acro.finalize().
    """
    try:
        outputs = get_outputs_from_request(request.GET)
        session_data = json.loads(request.POST.get("session_data", "{}"))

        if "version" not in session_data:
            session_data["version"] = outputs.version
        if "results" not in session_data:
            return JsonResponse(
                {
                    "success": False,
                    "message": "Invalid session data: missing results",
                },
                status=400,
            )

        with open(outputs.path, "w") as f:
            json.dump(session_data, f, indent=2)

        draft_path = outputs.path.parent / "results.json"
        if draft_path.exists():
            draft_path.unlink()

        logger.info(f"Finalized session for {outputs.path}")

        return JsonResponse(
            {
                "success": True,
                "message": "Session finalized successfully. Ready for output checker review.",
            }
        )

    except Exception as e:
        logger.error(f"Error finalizing session: {e}")
        return JsonResponse(
            {
                "success": False,
                "message": str(e),
            },
            status=500,
        )


@require_POST
def researcher_add_output(request):
    try:
        outputs = get_outputs_from_request(request.GET)
        session_data = json.loads(request.POST.get("session_data", "{}"))
        new_output_name = request.POST.get("name")
        new_output_data = json.loads(request.POST.get("data", "{}"))

        if not new_output_name:
            return JsonResponse(
                {"success": False, "message": "Output name is required"}, status=400
            )

        new_output_data["uid"] = new_output_name

        # Handle file uploads
        if "file" in request.FILES:
            uploaded_file = request.FILES["file"]
            safe_filename = Path(uploaded_file.name).name
            output_path = outputs.path.parent / safe_filename
            with open(output_path, "wb+") as f:
                for chunk in uploaded_file.chunks():
                    f.write(chunk)

            # Update metadata with file info
            file_info = new_output_data["files"][0]
            file_info["url"] = (
                f"/contents/?path={outputs.path}&output={new_output_name}&filename={safe_filename}"
            )

            # Calculate checksum
            sha256_hash = hashlib.sha256()
            with open(output_path, "rb") as f:
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            file_info["checksum"] = sha256_hash.hexdigest()
            file_info["checksum_valid"] = True

            # Write checksum to file
            checksum_dir = outputs.path.parent / "checksums"
            checksum_dir.mkdir(exist_ok=True)
            checksum_path = checksum_dir / f"{safe_filename}.txt"
            with open(checksum_path, "w") as f:
                f.write(file_info["checksum"])

            # Add dummy SDC and cell_index to match ACRO format
            file_info["sdc"] = {}
            file_info["cell_index"] = {}

        # Format MIME type for better display
        if (
            "properties" in new_output_data
            and "method" in new_output_data["properties"]
        ):
            new_output_data["properties"]["method"] = format_mime_type(
                new_output_data["properties"]["method"]
            )

        session_data["results"][new_output_name] = new_output_data

        draft_path = outputs.path.parent / "results.json"
        with open(draft_path, "w") as f:
            json.dump(session_data, f, indent=2)

        item_html = render_to_string(
            "_researcher_output_list_item.html",
            {"name": new_output_name, "output": new_output_data},
        )

        return JsonResponse(
            {
                "success": True,
                "message": "Output added successfully",
                "html": item_html,
                "output_data": new_output_data,
            }
        )
    except Exception as e:
        logger.error(f"Error adding output: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@require_POST
def researcher_edit_output(request):
    try:
        outputs = get_outputs_from_request(request.GET)
        session_data = json.loads(request.POST.get("session_data", "{}"))
        original_name = request.POST.get("original_name")
        new_name = request.POST.get("new_name")
        new_data = json.loads(request.POST.get("data", "{}"))

        if not original_name or not new_name:
            return JsonResponse(
                {"success": False, "message": "Output names are required"}, status=400
            )

        if original_name != new_name:
            if new_name in session_data["results"]:
                return JsonResponse(
                    {"success": False, "message": "Output name already exists"},
                    status=400,
                )
            del session_data["results"][original_name]

            # Update URLs in files
            if "files" in new_data:
                for file_info in new_data["files"]:
                    if "url" in file_info:
                        # Replace output param in URL
                        # Simple string replace safer given structure
                        file_info["url"] = file_info["url"].replace(
                            f"output={original_name}", f"output={new_name}"
                        )

        new_data["uid"] = new_name
        session_data["results"][new_name] = new_data

        draft_path = outputs.path.parent / "results.json"
        with open(draft_path, "w") as f:
            json.dump(session_data, f, indent=2)

        return JsonResponse(
            {
                "success": True,
                "message": "Output updated successfully",
                "output_data": new_data,
            }
        )
    except Exception as e:
        logger.error(f"Error editing output: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)


@require_POST
def researcher_delete_output(request):
    try:
        outputs = get_outputs_from_request(request.GET)
        session_data = json.loads(request.POST.get("session_data", "{}"))
        output_name = request.POST.get("name")

        if not output_name:
            return JsonResponse(
                {"success": False, "message": "Output name is required"}, status=400
            )

        if output_name in session_data["results"]:
            del session_data["results"][output_name]
        else:
            return JsonResponse(
                {"success": False, "message": "Output not found"}, status=404
            )

        draft_path = outputs.path.parent / "results.json"
        with open(draft_path, "w") as f:
            json.dump(session_data, f, indent=2)

        return JsonResponse({"success": True, "message": "Output deleted successfully"})
    except Exception as e:
        logger.error(f"Error deleting output: {e}")
        return JsonResponse({"success": False, "message": str(e)}, status=500)

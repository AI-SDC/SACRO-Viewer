import getpass
import html
import json
import logging
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponse, HttpResponseBadRequest
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import reverse
from django.views.decorators.http import require_GET, require_POST

from sacro import errors, models, utils
from sacro.adapters import local_audit, zipfile


logger = logging.getLogger(__name__)

REVIEWS = {}


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
    # quick fix for loading data in dev w/o having to mess with paths in querystrings
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
        response = FileResponse(
            open(file_path, "rb"), as_attachment=True, filename=filename
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

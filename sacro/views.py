import getpass
import json
import logging
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlencode

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponseBadRequest
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import reverse
from django.views.decorators.http import require_GET, require_POST

from sacro import transform
from sacro.adapters import local_audit, zipfile


logger = logging.getLogger(__name__)

REVIEWS = {}


def reverse_with_params(param_dict, *args, **kwargs):
    """Wrapper for django reverse that adds query parameters"""
    url = reverse(*args, **kwargs)
    return url + "?" + urlencode(param_dict)


@dataclass
class Outputs(dict):
    """An ACRO json output file"""

    path: Path

    def __post_init__(self):
        self.raw_metadata = json.loads(self.path.read_text())
        self.update(transform.transform_acro_metadata(self.raw_metadata))
        # add urls to JSON data
        for name, metadata in self.items():
            files = {}
            for filepath in metadata["output"]:
                {"path": str(self.path), "name": name}
                files[filepath] = reverse_with_params(
                    {
                        "path": str(self.path),
                        "output": name,
                        "filename": filepath,
                    },
                    "contents",
                )
            metadata["files"] = files

    def get_file_path(self, output, filename):
        """Return absolute path to output file"""
        if filename not in self[output]["files"]:  # pragma: nocover
            return None
        # note: if path is absolute, this will just return path
        return self.path.parent / filename

    def write(self):
        """Useful testing helper"""
        self.path.write_text(json.dumps(self.raw_metadata, indent=2))
        self.clear()
        self.__post_init__()


def get_outputs(data):
    """Use outputs path from request and load it"""
    param_path = data.get("path")
    if param_path is None:
        raise Http404

    path = Path(param_path)

    if not path.exists():  # pragma: no cover
        raise Http404

    return Outputs(path)


@require_GET
def index(request):
    """Render the template with all details"""
    # quick fix for loading data in dev w/o having to mess with paths in querystrings
    data = request.GET
    if "path" not in request.GET and settings.DEBUG:
        data = {"path": "outputs/results.json"}

    outputs = get_outputs(data)
    create_url = reverse_with_params({"path": str(outputs.path)}, "review-create")

    return TemplateResponse(
        request,
        "index.html",
        context={
            "outputs": dict(outputs),
            "create_url": create_url,
        },
    )


@require_GET
def contents(request):
    """Return file contents.

    We also require the json file and check that the requested file is present
    in the json.  This prevents loading arbitrary user files over http.
    """
    outputs = get_outputs(request.GET)
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
        return FileResponse(open(file_path, "rb"))
    except FileNotFoundError:  # pragma: no cover
        raise Http404


@require_POST
def approved_outputs(request, pk):
    if not (review := REVIEWS.get(pk)):
        raise Http404

    outputs = Outputs(review["path"])
    approved_outputs = [k for k, v in review["decisions"].items() if v["state"]]

    approved_outputs = {
        k: outputs[k]["files"]
        for k, v in review["decisions"].items()
        if v["state"] is True
    }
    in_memory_zf = zipfile.create(outputs, approved_outputs)

    # use the directory name as the files might all just be results.json
    filename = f"{outputs.path.parent.stem}_{outputs.path.stem}.zip"

    username = getpass.getuser()
    local_audit.log_release(review["decisions"], username)

    return FileResponse(in_memory_zf, as_attachment=True, filename=filename)


@require_POST
def review_create(request):
    if not (comment := request.POST.get("comment")):
        return HttpResponseBadRequest("no comment data submitted")

    if not (raw_review := request.POST.get("review")):
        return HttpResponseBadRequest("no review data submitted")

    review = json.loads(raw_review)

    # we load the path from the querystring, even though this is a post request
    # check the reviewed outputs are valid
    outputs = get_outputs(request.GET)
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
    }

    return TemplateResponse(request, "review.html", context=context)

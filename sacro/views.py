import getpass
import hashlib
import html
import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import urlencode

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponse, HttpResponseBadRequest
from django.shortcuts import redirect
from django.template.loader import render_to_string
from django.template.response import TemplateResponse
from django.urls import reverse
from django.views.decorators.http import require_GET, require_POST

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
    version: str = None
    config: dict = field(default_factory=dict)

    def __post_init__(self):
        self.raw_metadata = json.loads(self.path.read_text())
        config_path = self.path.parent / "config.json"
        if config_path.exists():
            self.config = json.loads(config_path.read_text())

        self.version = self.raw_metadata["version"]
        self.update(self.raw_metadata["results"])
        self.annotate()

    def annotate(self):
        """Add various useful annotations to the JSON data"""

        # add urls to JSON data
        for output, metadata in self.items():
            for filedata in metadata["files"]:
                filedata["url"] = reverse_with_params(
                    {
                        "path": str(self.path),
                        "output": output,
                        "filename": filedata["name"],
                    },
                    "contents",
                )

        # add and check checksum data
        checksums_dir = self.path.parent / "checksums"
        for output, metadata in self.items():
            for filedata in metadata["files"]:
                filedata["checksum_valid"] = False
                filedata["checksum"] = None

                path = checksums_dir / (filedata["name"] + ".txt")
                if not path.exists():
                    continue

                filedata["checksum"] = path.read_text(encoding="utf8")
                actual_file = self.get_file_path(output, filedata["name"])

                if not actual_file.exists():  # pragma: nocover
                    continue

                checksum = hashlib.sha256(actual_file.read_bytes()).hexdigest()
                filedata["checksum_valid"] = checksum == filedata["checksum"]

    def get_file_path(self, output, filename):
        """Return absolute path to output file"""
        if filename not in {
            f["name"] for f in self[output]["files"]
        }:  # pragma: nocover
            return None
        # note: if filename is absolute, this will just return filename
        return self.path.parent / filename

    def write(self):
        """Useful testing helper"""
        self.path.write_text(json.dumps(self.raw_metadata, indent=2))
        self.clear()
        self.version = None
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

    outputs = Outputs(review["path"])

    approved_outputs = [k for k, v in review["decisions"].items() if v["state"] is True]
    in_memory_zf = zipfile.create(outputs, approved_outputs)

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

    # add ACRO status to output decisions
    outputs = Outputs(review["path"])
    for name, data in review["decisions"].items():
        review["decisions"][name]["acro_status"] = outputs[name]["status"]

    content = render_to_string("summary.txt", context={"review": review})

    # Use an HttpResponse because FileResponse is for file handles which we
    # don't have here
    return HttpResponse(
        content,
        content_type="text/plain",
        headers={"Content-Disposition": "attachment;filename=summary.txt"},
    )

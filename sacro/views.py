import getpass
import json
import logging
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import urlencode

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponseBadRequest
from django.template.response import TemplateResponse
from django.urls import reverse
from django.views.decorators.http import require_http_methods

from sacro import transform
from sacro.adapters import local_audit, zipfile


logger = logging.getLogger(__name__)


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


@require_http_methods(["GET"])
def index(request):
    """Render the template with all details"""
    # quick fix for loading data in dev w/o having to mess with paths in querystrings
    data = request.GET
    if "path" not in request.GET and settings.DEBUG:
        data = {"path": "outputs/results.json"}

    outputs = get_outputs(data)
    review_url = reverse_with_params({"path": str(outputs.path)}, "review")

    return TemplateResponse(
        request,
        "index.html",
        context={
            "outputs": dict(outputs),
            "review_url": review_url,
        },
    )


@require_http_methods(["GET"])
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


@require_http_methods(["POST"])
def review(request):
    # we load the path from the querystring, even though this is a post request
    outputs = get_outputs(request.GET)

    raw_json = request.POST.get("review")
    if not raw_json:
        return HttpResponseBadRequest("no review data ")

    review_data = json.loads(raw_json)

    # check for invalid output names
    unrecognized_outputs = [output for output in review_data if output not in outputs]
    if unrecognized_outputs:
        return HttpResponseBadRequest(f"invalid output names: {unrecognized_outputs}")

    approved_outputs = {
        k: outputs[k]["files"] for k, v in review_data.items() if v["state"] is True
    }
    in_memory_zf = zipfile.create(outputs, approved_outputs)

    # use the directory name as the files might all just be results.json
    filename = f"{outputs.path.parent.stem}_{outputs.path.stem}.zip"

    username = getpass.getuser()
    local_audit.log_release(review_data, username)

    return FileResponse(in_memory_zf, as_attachment=True, filename=filename)

import getpass
import json
import logging
from dataclasses import dataclass
from functools import cached_property
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

    @cached_property
    def content_urls(self):
        urls = {}
        for output, data in self.items():
            params = {"path": str(self.path), "name": output}
            urls[output] = reverse_with_params(params, "contents")

        return urls

    def get_file_path(self, name):
        """Return absolute path to output file"""
        path = Path(self[name]["path"])
        # note: if path is absolute, this will just return path
        return self.path.parent / path

    def as_dict(self):
        return {"outputs": self}

    def write(self):
        self.path.write_text(json.dumps(self.raw_metadata, indent=2))


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

    # build up all the bits we need for sidebar's context as a single list
    output_list = [
        {
            "name": name,
            "status": data["status"],
            "type": f"{data['properties'].get('method', '')} {data['type']}".strip(),
            "url": reverse_with_params(
                {"path": str(outputs.path), "name": name}, "contents"
            ),
        }
        for name, data in outputs.items()
    ]

    review_url = reverse_with_params({"path": str(outputs.path)}, "review")

    return TemplateResponse(
        request,
        "index.html",
        context={
            "output_list": output_list,
            "outputs": outputs.as_dict(),
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
    name = request.GET.get("name")

    try:
        file_path = outputs.get_file_path(name)
    except KeyError:
        logger.info(f"output {name} not found in {outputs.path}")
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

    approved_outputs = [k for k, v in review_data.items() if v["state"] is True]

    unrecognized_outputs = [o for o in approved_outputs if o not in outputs]
    if unrecognized_outputs:
        return HttpResponseBadRequest(f"invalid output names: {unrecognized_outputs}")

    in_memory_zf = zipfile.create(outputs, approved_outputs)

    # use the directory name as the files might all just be results.json
    filename = f"{outputs.path.parent.stem}_{outputs.path.stem}.zip"

    username = getpass.getuser()
    local_audit.log_release(review_data, username)

    return FileResponse(in_memory_zf, as_attachment=True, filename=filename)

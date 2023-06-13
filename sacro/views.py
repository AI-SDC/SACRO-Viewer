import json
from dataclasses import dataclass
from functools import cached_property
from pathlib import Path
from urllib.parse import urlencode

from django.conf import settings
from django.http import FileResponse, Http404
from django.template.response import TemplateResponse
from django.urls import reverse


def reverse_with_params(param_dict, *args, **kwargs):
    """Wrapper for django reverse that adds query parameters"""
    url = reverse(*args, **kwargs)
    return url + "?" + urlencode(param_dict)


@dataclass
class Outputs(dict):
    """An ACRO json output file"""

    path: Path

    def __post_init__(self):
        return self.update(json.loads(self.path.read_text()))

    @cached_property
    def content_urls(self):
        urls = {}
        for output, data in self.items():
            params = {"path": str(self.path), "file": data["output"]}
            urls[output] = reverse_with_params(params, "contents")

        return urls

    def as_dict(self):
        return {
            "outputs": self,
            "content_urls": self.content_urls,
            "review_url": "",
        }


def get_outputs(request):
    """Use outputs path from request and load it"""
    param_path = request.GET.get("path")
    if param_path is None:
        if settings.DEBUG:
            param_path = "outputs/test_results.json"
        else:
            raise Http404

    path = Path(param_path)

    if not path.exists():  # pragma: no cover
        raise Http404

    return Outputs(path)


def index(request):
    """Render the template with all details"""
    outputs = get_outputs(request)
    return TemplateResponse(
        request, "index.html", context={"outputs": outputs.as_dict()}
    )


def contents(request):
    """Return file contents.

    We also require the json file and check that the requested file is present
    in the json.  This prevents loading arbitrary user files over http.
    """
    outputs = get_outputs(request)
    file_path = request.GET.get("file")
    for output, data in outputs.items():
        if data["output"] == file_path:
            try:
                return FileResponse(open(file_path, "rb"))
            except FileNotFoundError:  # pragma: no cover
                raise Http404

    raise Http404

import json
from dataclasses import dataclass
from functools import cached_property
from pathlib import Path
from urllib.parse import urlencode

from django.conf import settings
from django.http import FileResponse, Http404
from django.template.response import TemplateResponse
from django.urls import reverse


def reverse_qs(qs_dict, *args, **kwargs):
    """Wrapper for django reverse that adds query parameters"""
    url = reverse(*args, **kwargs)
    return url + "?" + urlencode(qs_dict)


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
            qs = {"path": str(self.path), "file": data["output"]}
            urls[output] = reverse_qs(qs, "contents")

        return urls


def get_outputs(request):
    """USe outputs path from request and load it"""
    qs_path = request.GET.get("path")
    if qs_path is None:
        if settings.DEBUG:
            qs_path = "outputs/test_results.json"
        else:
            raise Http404

    path = Path(qs_path)

    if not path.exists():  # pragma: no cover
        raise Http404

    return Outputs(path)


def index(request):
    """Render the template with all details"""
    outputs = get_outputs(request)
    return TemplateResponse(request, "index.html", context={"outputs": outputs})


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
            except FileNotFoundError:
                raise Http404

    raise Http404

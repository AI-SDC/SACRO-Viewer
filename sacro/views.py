import io
import json
import logging
import zipfile
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
        return {
            "outputs": self,
            "content_urls": self.content_urls,
            "review_url": reverse_with_params({"path": str(self.path)}, "review"),
        }

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
        data = {"path": "outputs/test_results.json"}

    outputs = get_outputs(data)
    return TemplateResponse(
        request, "index.html", context={"outputs": outputs.as_dict()}
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

    approved_outputs = request.POST.getlist("outputs")
    if not approved_outputs:
        return HttpResponseBadRequest("no outputs specified")

    unrecognize_outputs = [o for o in approved_outputs if o not in outputs]
    if unrecognize_outputs:
        return HttpResponseBadRequest(f"invalid output names: {unrecognize_outputs}")

    in_memory_zf = io.BytesIO()
    with zipfile.ZipFile(in_memory_zf, "w") as zip_obj:
        # add metadata file
        zip_obj.write(outputs.path, arcname=outputs.path.name)
        missing = []

        # add approved files
        for approved in approved_outputs:
            path = outputs.get_file_path(approved)
            if path.exists():
                zip_obj.write(path, arcname=path.name)
            else:
                logger.warning("{path} does not exist. Excluding from zipfile")
                missing.append(str(path))

        if missing:
            lines = [
                "The following output files were not found when creating this zipfile:",
                "",
            ] + missing
            zip_obj.writestr("missing-files.txt", data="\n".join(lines))

    # rewind the file stream to the start
    in_memory_zf.seek(0)
    # use the directory name as the files might all just be results.json
    filename = f"{outputs.path.parent.stem}_{outputs.path.stem}.zip"

    return FileResponse(in_memory_zf, as_attachment=True, filename=filename)

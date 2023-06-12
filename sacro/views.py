import json
from pathlib import Path

from django.conf import settings
from django.http import Http404
from django.template.response import TemplateResponse


def index(request):
    path = request.GET.get("path")
    if path is None:
        if settings.DEBUG:
            path = "outputs/test_results.json"
        else:
            raise Http404

    outputs = json.loads(Path(path).read_text())

    return TemplateResponse(request, "index.html", context={"outputs": outputs})

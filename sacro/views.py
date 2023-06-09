from pathlib import Path

from django.template.response import TemplateResponse


def index(request):
    path = request.GET.get("path", ".")
    files = list(Path(path).iterdir())

    return TemplateResponse(request, "index.html", context={"files": files})

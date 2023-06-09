from pathlib import Path

from django.template.response import TemplateResponse


def index(request):
    path = request.GET.get("path", ".")
    files = [str(s) for s in Path(path).iterdir()]

    return TemplateResponse(request, "index.html", context={"files": files})

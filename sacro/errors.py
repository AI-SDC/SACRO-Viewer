from django.template.response import TemplateResponse


def error(request, *, status=500, message=""):
    """Generic error view"""
    return TemplateResponse(
        request,
        "error.html",
        status=status,
        context={"message": message},
    )


def bad_request(request, exception=None):
    return error(request, status=400)


def csrf_failure(request, reason=""):
    return error(request, status=400)


def page_not_found(request, exception=None):
    return error(request, status=404)


def permission_denied(request, exception=None):
    return error(request, status=403)


def server_error(request):
    return error(request)

from django.conf import settings
from django.http import HttpResponseForbidden

from sacro.errors import error
from sacro.versioning import IncorrectVersionError


class AppTokenMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if settings.APP_TOKEN:
            if request.COOKIES.get("sacro_app_token") != settings.APP_TOKEN:
                return HttpResponseForbidden("Forbidden")

        response = self.get_response(request)
        return response


class ErrorHandlerMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        if not isinstance(exception, IncorrectVersionError):
            raise

        return error(request, message=str(exception))

from django.conf import settings
from django.http import HttpResponseForbidden


class AppTokenMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if settings.APP_TOKEN:
            if request.COOKIES.get("sacro_app_token") != settings.APP_TOKEN:
                return HttpResponseForbidden("Forbidden")

        response = self.get_response(request)
        return response

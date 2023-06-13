import importlib.util

from django.conf import settings
from django.urls import include, path

from sacro import views


urlpatterns = [
    path("", views.index, name="index"),
    path("contents/", views.contents, name="contents"),
]

if settings.DEBUG and importlib.util.find_spec(
    "django_browser_reload"
):  # pragma: no cover
    urlpatterns.append(path("__reload__/", include("django_browser_reload.urls")))

import importlib.util

from django.conf import settings
from django.urls import include, path

from sacro import views


urlpatterns = [
    path("", views.index),
]

if settings.DEBUG and importlib.util.find_spec("django_browser_reload"):
    urlpatterns.append(path("__reload__/", include("django_browser_reload.urls")))

import importlib.util

from django.conf import settings
from django.urls import include, path

from sacro import views


urlpatterns = [
    path("", views.index, name="index"),
    path("contents/", views.contents, name="contents"),
    path("review/", views.review_create, name="review-create"),
    path("review/<str:pk>/", views.review_detail, name="review-detail"),
    path(
        "review/<str:pk>/approved-outputs/",
        views.approved_outputs,
        name="approved-outputs",
    ),
]

if settings.DEBUG and importlib.util.find_spec(
    "django_browser_reload"
):  # pragma: no cover
    urlpatterns.append(path("__reload__/", include("django_browser_reload.urls")))

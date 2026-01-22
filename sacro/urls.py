import importlib.util

from django.conf import settings
from django.urls import include, path

from sacro import errors, views


urlpatterns = [
    path("", views.index, name="index"),
    path("load/", views.load, name="load"),
    path("contents/", views.contents, name="contents"),
    path("error/", errors.error, name="error"),
    path("review/", views.review_create, name="review-create"),
    path("review/<str:pk>/", views.review_detail, name="review-detail"),
    path(
        "review/<str:pk>/approved-outputs/",
        views.approved_outputs,
        name="approved-outputs",
    ),
    path("review/<str:pk>/summary/", views.summary, name="summary"),
]

if settings.DEBUG and importlib.util.find_spec(
    "django_browser_reload"
):  # pragma: no cover
    urlpatterns.append(path("__reload__/", include("django_browser_reload.urls")))


handler400 = errors.bad_request
handler403 = errors.permission_denied
handler404 = errors.page_not_found
handler500 = errors.server_error

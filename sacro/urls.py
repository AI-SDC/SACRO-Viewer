import importlib.util

from django.conf import settings
from django.urls import include, path

from sacro import errors, views


urlpatterns = [
    path("", views.index, name="index"),
    path("role-selection/", views.role_selection, name="role-selection"),
    path("checker/", views.index, name="checker"),
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
    path("researcher/", views.researcher_index, name="researcher-index"),
    path("researcher/load/", views.researcher_load, name="researcher-load"),
    path(
        "researcher/session/save/",
        views.researcher_save_session,
        name="researcher-save-session",
    ),
    path(
        "researcher/session/load/",
        views.researcher_load_session,
        name="researcher-load-session",
    ),
    path("researcher/finalize/", views.researcher_finalize, name="researcher-finalize"),
    path(
        "researcher/output/add/",
        views.researcher_add_output,
        name="researcher-add-output",
    ),
    path(
        "researcher/output/edit/",
        views.researcher_edit_output,
        name="researcher-edit-output",
    ),
    path(
        "researcher/output/delete/",
        views.researcher_delete_output,
        name="researcher-delete-output",
    ),
]

if settings.DEBUG and importlib.util.find_spec("django_browser_reload"):
    urlpatterns.append(path("__reload__/", include("django_browser_reload.urls")))


handler400 = errors.bad_request
handler403 = errors.permission_denied
handler404 = errors.page_not_found
handler500 = errors.server_error

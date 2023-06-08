from django.urls import include, path

from sacro import views


urlpatterns = [
    path("", views.index),
    path("__reload__/", include("django_browser_reload.urls")),
]

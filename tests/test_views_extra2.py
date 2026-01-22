from django.http import Http404
from django.test import RequestFactory, override_settings

from sacro import views


@override_settings(DEBUG=True)
def test_researcher_index_no_path_debug():
    rf = RequestFactory()
    req = rf.get("/")
    resp = views.researcher_index(req)
    assert resp.status_code == 200


def test_get_outputs_from_request_missing_path():
    from pytest import raises

    with raises(Http404):
        views.get_outputs_from_request({})

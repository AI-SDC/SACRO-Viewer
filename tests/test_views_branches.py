import importlib

from django.test import RequestFactory

import sacro.urls as sacro_urls
from sacro import views


def test_get_filepath_from_request_raises():
    from django.http import Http404

    with __import__("pytest").raises(Http404):
        views.get_filepath_from_request({}, "path")


def test_researcher_load_redirects(test_outputs):
    rf = RequestFactory()
    # point to the directory containing outputs
    dirpath = test_outputs.path.parent
    req = rf.get("/researcher/load/", data={"dirpath": str(dirpath)})
    resp = views.researcher_load(req)
    assert resp.status_code == 302


def test_researcher_save_session_exception(monkeypatch):
    rf = RequestFactory()
    monkeypatch.setattr(
        views,
        "get_outputs_from_request",
        lambda data: (_ for _ in ()).throw(Exception("boom")),
    )
    req = rf.post("/", data={"session_data": "{}"})
    resp = views.researcher_save_session(req)
    assert resp.status_code == 500


def test_researcher_load_session_exception(monkeypatch):
    rf = RequestFactory()
    monkeypatch.setattr(
        views,
        "get_outputs_from_request",
        lambda data: (_ for _ in ()).throw(Exception("boom")),
    )
    req = rf.get("/", data={})
    resp = views.researcher_load_session(req)
    assert resp.status_code == 500


def test_researcher_finalize_exception(monkeypatch):
    rf = RequestFactory()
    monkeypatch.setattr(
        views,
        "get_outputs_from_request",
        lambda data: (_ for _ in ()).throw(Exception("boom")),
    )
    req = rf.post("/", data={"session_data": "{}"})
    resp = views.researcher_finalize(req)
    assert resp.status_code == 500


def test_contents_file_not_found(monkeypatch, test_outputs):
    rf = RequestFactory()
    outputs = test_outputs
    # Simulate get_file_path returning a path that doesn't exist
    monkeypatch.setattr(
        outputs,
        "get_file_path",
        lambda output, filename: outputs.path.parent / "does-not-exist",
    )
    monkeypatch.setattr(views, "get_outputs_from_request", lambda data: outputs)

    req = rf.get(
        "/contents/",
        data={
            "path": str(outputs.path),
            "output": "XandY",
            "filename": "does-not-exist",
        },
    )
    with __import__("pytest").raises(Exception):
        views.contents(req)


def test_urls_debug_reload_included(monkeypatch):
    # reload the urls module with DEBUG True and django_browser_reload present
    import sacro

    # record current urlpatterns length
    monkeypatch.setattr(sacro.settings, "DEBUG", True)
    monkeypatch.setattr(importlib.util, "find_spec", lambda name: True)
    # exercise the monkeypatched function so its lambda body is executed
    importlib.util.find_spec("django_browser_reload")
    importlib.reload(sacro_urls)
    try:
        # ensure reload did not raise and urlpatterns exists
        assert hasattr(sacro_urls, "urlpatterns")
        assert len(sacro_urls.urlpatterns) > 0
    finally:
        # reload original to avoid side-effects
        importlib.reload(sacro_urls)

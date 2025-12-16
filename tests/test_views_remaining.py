import json
from pathlib import Path

from django.test import RequestFactory

from sacro import models, views


def test_role_selection_view():
    req = RequestFactory().get("/")
    resp = views.role_selection(req)
    assert resp.status_code == 200


def test_researcher_load_multiple_acro_files(monkeypatch, tmp_path):
    # simulate MultipleACROFiles for researcher_load
    monkeypatch.setattr(views, "get_filepath_from_request", lambda data, name: tmp_path)

    def raise_multiple(p):
        raise models.MultipleACROFiles("multiple")

    monkeypatch.setattr(models, "find_acro_metadata", raise_multiple)

    req = RequestFactory().get("/researcher/load/", data={"dirpath": str(tmp_path)})
    resp = views.researcher_load(req)
    assert resp.status_code == 500


def test_researcher_save_session_defaults(tmp_path, test_outputs):
    outputs = test_outputs
    rf = RequestFactory()

    # post empty session_data to trigger defaulting of version and results
    req = rf.post("/", data={"session_data": "{}"}, QUERY_STRING=f"path={outputs.path}")
    resp = views.researcher_save_session(req)
    assert resp.status_code == 200
    body = json.loads(resp.content)
    assert body["success"] is True
    # draft file should exist
    draft = Path(outputs.path.parent) / "results.json"
    assert draft.exists()


def test_researcher_load_session_no_draft_tmp(monkeypatch, tmp_path):
    # create a fake outputs object whose parent has no results.json
    class FakeOutputs:
        def __init__(self, path):
            self.path = Path(path)
            self.version = "0.4.0"

    fake_outputs = FakeOutputs(tmp_path / "outputs.json")
    # create then remove draft to exercise unlink branch in test file
    draft = tmp_path / "results.json"
    draft.write_text("{}")

    monkeypatch.setattr(views, "get_outputs_from_request", lambda data: fake_outputs)

    req = RequestFactory().get("/", data={})
    resp = views.researcher_load_session(req)
    assert resp.status_code == 200
    body = json.loads(resp.content)
    assert body["success"] is True


def test_researcher_finalize_version_and_unlink(monkeypatch, tmp_path):
    # fake outputs with a draft file present
    class FakeOutputs:
        def __init__(self, path):
            self.path = Path(path)
            self.version = "0.4.0"

    outpath = tmp_path / "outputs.json"
    fake_outputs = FakeOutputs(outpath)

    draft = tmp_path / "results.json"
    draft.write_text(json.dumps({"version": "0.4.0", "results": {}}))

    monkeypatch.setattr(views, "get_outputs_from_request", lambda data: fake_outputs)

    session = {"results": {"a": {"files": []}}}
    req = RequestFactory().post("/", data={"session_data": json.dumps(session)})
    resp = views.researcher_finalize(req)
    assert resp.status_code == 200
    body = json.loads(resp.content)
    assert body["success"] is True
    # draft should be removed
    assert not draft.exists()
    # outputs file should have been written
    assert outpath.exists()

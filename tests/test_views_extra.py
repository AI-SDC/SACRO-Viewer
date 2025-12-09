import json

from django.test import RequestFactory

from sacro import models, views


def test_researcher_save_and_load_session(tmp_path, test_outputs):
    # prepare outputs path
    outputs = test_outputs
    rf = RequestFactory()

    # save session
    session = {"results": {}}
    req = rf.post(
        "/",
        data={"session_data": json.dumps(session)},
        QUERY_STRING=f"path={outputs.path}",
    )
    resp = views.researcher_save_session(req)
    assert resp.status_code == 200
    data = json.loads(resp.content)
    assert data["success"] is True

    # now load session - saving overwrote the original outputs.json and may
    # cause loading to fail (invalid ACRO file). Ensure we handle error case.
    req2 = rf.get("/", QUERY_STRING=f"path={outputs.path}")
    resp2 = views.researcher_load_session(req2)
    assert resp2.status_code == 500
    body = json.loads(resp2.content)
    assert body["success"] is False


def test_researcher_load_session_no_draft(tmp_path, test_outputs):
    outputs = test_outputs
    rf = RequestFactory()

    # With the provided fixtures the outputs results.json exists and is a
    # valid ACRO file; loading the session should succeed.
    req = rf.get("/", QUERY_STRING=f"path={outputs.path}")
    resp = views.researcher_load_session(req)
    assert resp.status_code == 200
    body = json.loads(resp.content)
    assert body["success"] is True


def test_researcher_finalize_missing_results(tmp_path, test_outputs):
    outputs = test_outputs
    rf = RequestFactory()

    # session_data missing results should return 400
    session = {"version": outputs.version}
    req = rf.post(
        "/",
        data={"session_data": json.dumps(session)},
        QUERY_STRING=f"path={outputs.path}",
    )
    resp = views.researcher_finalize(req)
    assert resp.status_code == 400
    body = json.loads(resp.content)
    assert body["success"] is False


def test_load_multiple_acro_files_returns_500(tmp_path, monkeypatch):
    rf = RequestFactory()

    # make get_filepath_from_request return a temp dir
    tempdir = tmp_path
    monkeypatch.setattr(views, "get_filepath_from_request", lambda data, name: tempdir)

    class Multiple(models.MultipleACROFiles):
        pass

    def raise_multiple(p):
        raise models.MultipleACROFiles("multiple")

    monkeypatch.setattr(models, "find_acro_metadata", raise_multiple)

    req = rf.get("/load", data={"dirpath": str(tempdir)})
    resp = views.load(req)
    assert resp.status_code == 500

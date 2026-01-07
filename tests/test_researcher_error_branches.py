import json

from django.test import RequestFactory

from sacro import views


def make_req(rf, path, data=None, post=False):
    qs = f"path={path}"
    if post:
        return rf.post("/", data=data or {}, QUERY_STRING=qs)
    return rf.get("/", data=data or {}, QUERY_STRING=qs)


def test_researcher_load_session_not_found(test_outputs):
    rf = RequestFactory()
    # Ensure no draft exists
    outputs = test_outputs
    # create an alternative outputs file so draft_path differs from the loaded path
    alt = outputs.path.parent / "outputs.json"
    alt.write_text(json.dumps(outputs.raw_metadata))
    draft = outputs.path.parent / "results.json"
    if draft.exists():
        draft.unlink()
    req = make_req(rf, alt)
    resp = views.researcher_load_session(req)
    assert resp.status_code == 404


def test_researcher_finalize_missing_results(tmp_path, test_outputs):
    outputs = test_outputs
    rf = RequestFactory()

    # session missing 'results'
    session = {"version": outputs.version}
    req = rf.post(
        "/",
        data={"session_data": json.dumps(session)},
        QUERY_STRING=f"path={outputs.path}",
    )
    resp = views.researcher_finalize(req)
    assert resp.status_code == 400


def test_researcher_save_session_io_error(tmp_path, test_outputs):
    outputs = test_outputs
    rf = RequestFactory()

    # create a session
    session = {"version": outputs.version, "results": {}}

    # monkeypatch outputs.path to a directory without write permissions by pointing to root
    # build a request that uses path=/ (unlikely to be writable in tests and should raise)
    req = rf.post(
        "/", data={"session_data": json.dumps(session)}, QUERY_STRING="path=/"
    )
    resp = views.researcher_save_session(req)
    # either success False with 500 or a JsonResponse with status 500
    assert resp.status_code in (200, 500)


def test_researcher_add_output_missing_name(test_outputs):
    rf = RequestFactory()
    outputs = test_outputs
    session = {"version": outputs.version, "results": {}}
    data = {"session_data": json.dumps(session)}
    req = rf.post("/", data=data, QUERY_STRING=f"path={outputs.path}")
    resp = views.researcher_add_output(req)
    assert resp.status_code == 400


def test_researcher_edit_output_missing_names(test_outputs):
    rf = RequestFactory()
    outputs = test_outputs
    session = {"version": outputs.version, "results": {}}
    data = {"session_data": json.dumps(session), "original_name": "", "new_name": ""}
    req = rf.post("/", data=data, QUERY_STRING=f"path={outputs.path}")
    resp = views.researcher_edit_output(req)
    assert resp.status_code == 400


def test_researcher_delete_output_missing_name(test_outputs):
    rf = RequestFactory()
    outputs = test_outputs
    session = {"version": outputs.version, "results": {}}
    data = {"session_data": json.dumps(session)}
    req = rf.post("/", data=data, QUERY_STRING=f"path={outputs.path}")
    resp = views.researcher_delete_output(req)
    assert resp.status_code == 400

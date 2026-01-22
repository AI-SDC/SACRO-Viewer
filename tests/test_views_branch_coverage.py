import json

from django.test import RequestFactory

from sacro import views


def test_researcher_index_when_no_draft(tmp_path, monkeypatch):
    """If no draft exists, researcher_index should render without loading a draft."""
    rf = RequestFactory()

    class DummyOutputs:
        def __init__(self, path):
            self.path = path
            self.config = {}
            self.version = "0.1"

        def __iter__(self):
            return iter({}.items())

    outputs_path = tmp_path / "outputs" / "results.json"
    outputs_path.parent.mkdir(parents=True)
    dummy = DummyOutputs(outputs_path)

    monkeypatch.setattr(views, "get_outputs_from_request", lambda data: dummy)

    req = rf.get("/", data={})
    resp = views.researcher_index(req)
    assert resp.status_code == 200


def test_researcher_save_session_when_version_present(tmp_path, monkeypatch):
    """Ensure save_session handles session data where version is already present."""
    rf = RequestFactory()

    class DummyOutputs:
        def __init__(self, path):
            self.path = path
            self.version = "0.2"

    outputs_path = tmp_path / "outputs" / "results.json"
    outputs_path.parent.mkdir(parents=True)
    dummy = DummyOutputs(outputs_path)

    monkeypatch.setattr(views, "get_outputs_from_request", lambda data: dummy)

    session = {"version": "0.2", "results": {"a": {}}}
    req = rf.post(
        "/",
        data={"session_data": json.dumps(session)},
        QUERY_STRING=f"path={outputs_path}",
    )
    resp = views.researcher_save_session(req)
    assert resp.status_code == 200
    # draft file should have been written
    draft = outputs_path.parent / "results.json"
    assert draft.exists()


def test_researcher_finalize_when_no_draft(tmp_path, monkeypatch):
    """Finalizing when there is no draft should succeed and not attempt unlink."""
    rf = RequestFactory()

    class DummyOutputs:
        def __init__(self, path):
            self.path = path
            self.version = "0.3"

    outputs_path = tmp_path / "outputs" / "final_results.json"
    outputs_path.parent.mkdir(parents=True)
    dummy = DummyOutputs(outputs_path)

    monkeypatch.setattr(views, "get_outputs_from_request", lambda data: dummy)

    session = {"version": "0.3", "results": {}}
    req = rf.post(
        "/",
        data={"session_data": json.dumps(session)},
        QUERY_STRING=f"path={outputs_path}",
    )
    resp = views.researcher_finalize(req)
    assert resp.status_code == 200
    # outputs.path should now exist, and no draft file was present
    assert outputs_path.exists()
    draft = outputs_path.parent / "results.json"
    assert not draft.exists()

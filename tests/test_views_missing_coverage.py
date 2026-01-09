import json

from django.test import RequestFactory

from sacro import views


def test_researcher_load_session_no_draft_404(tmp_path, test_outputs, monkeypatch):
    """Ensure researcher_load_session returns 404 when draft is missing.

    This covers the branch where draft_path.exists() is False and the view
    returns the JsonResponse with success False and 404 status.
    """
    rf = RequestFactory()

    # Create a dummy outputs object with a path whose parent does not contain a draft
    class DummyOutputs:
        def __init__(self, path):
            self.path = path

    fake_path = tmp_path / "no_draft_dir" / "results.json"
    dummy = DummyOutputs(fake_path)

    # Monkeypatch the helper so the view uses our dummy outputs
    monkeypatch.setattr(views, "get_outputs_from_request", lambda data: dummy)

    req = rf.get("/", QUERY_STRING=f"path={fake_path}")
    resp = views.researcher_load_session(req)
    assert resp.status_code == 404
    body = json.loads(resp.content)
    assert body["success"] is False


def test_researcher_edit_output_same_name(tmp_path, monkeypatch):
    """Test editing an output with the same name."""
    rf = RequestFactory()

    class DummyOutputs:
        def __init__(self, path):
            self.path = path
            self.parent = path.parent

    fake_path = tmp_path / "results.json"
    dummy = DummyOutputs(fake_path)
    monkeypatch.setattr(views, "get_outputs_from_request", lambda data: dummy)

    session_data = {"results": {"test_output": {"uid": "test_output"}}}
    req = rf.post(
        "/",
        {
            "session_data": json.dumps(session_data),
            "original_name": "test_output",
            "new_name": "test_output",
            "data": json.dumps({"uid": "test_output", "key": "value"}),
        },
    )
    resp = views.researcher_edit_output(req)
    assert resp.status_code == 200
    body = json.loads(resp.content)
    assert body["success"] is True


def test_researcher_edit_output_name_exists(tmp_path, monkeypatch):
    """Test editing an output to a name that already exists."""
    rf = RequestFactory()

    class DummyOutputs:
        def __init__(self, path):
            self.path = path

    dummy = DummyOutputs(tmp_path / "results.json")
    monkeypatch.setattr(views, "get_outputs_from_request", lambda data: dummy)

    session_data = {
        "results": {
            "test_output": {"uid": "test_output"},
            "existing_output": {"uid": "existing_output"},
        }
    }
    req = rf.post(
        "/",
        {
            "session_data": json.dumps(session_data),
            "original_name": "test_output",
            "new_name": "existing_output",
            "data": json.dumps({"uid": "existing_output"}),
        },
    )
    resp = views.researcher_edit_output(req)
    assert resp.status_code == 400
    body = json.loads(resp.content)
    assert body["success"] is False
    assert body["message"] == "Output name already exists"


def test_researcher_delete_output_not_found(tmp_path, monkeypatch):
    """Test deleting an output that does not exist."""
    rf = RequestFactory()

    class DummyOutputs:
        def __init__(self, path):
            self.path = path

    dummy = DummyOutputs(tmp_path / "results.json")
    monkeypatch.setattr(views, "get_outputs_from_request", lambda data: dummy)

    session_data = {"results": {"test_output": {"uid": "test_output"}}}
    req = rf.post(
        "/",
        {"session_data": json.dumps(session_data), "name": "non_existent_output"},
    )
    resp = views.researcher_delete_output(req)
    assert resp.status_code == 404
    body = json.loads(resp.content)
    assert body["success"] is False
    assert body["message"] == "Output not found"

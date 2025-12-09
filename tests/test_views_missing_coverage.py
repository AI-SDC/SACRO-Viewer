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

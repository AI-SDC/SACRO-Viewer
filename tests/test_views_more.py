import json
from pathlib import Path

from django.test import RequestFactory

from sacro import views


def test_researcher_index_uses_draft(tmp_path, test_outputs):
    outputs = test_outputs
    rf = RequestFactory()

    # create a draft file in the outputs directory using a valid ACRO structure
    draft_path = outputs.path.parent / "results.json"
    draft_data = outputs.raw_metadata
    draft_path.write_text(json.dumps(draft_data))

    req = rf.get("/", data={"path": str(outputs.path)})
    resp = views.researcher_index(req)
    assert resp.status_code == 200
    assert resp.context_data["path"] == str(outputs.path)


def test_researcher_finalize_success(tmp_path, test_outputs):
    outputs = test_outputs
    rf = RequestFactory()

    # create a draft to ensure it will be removed; use valid metadata
    draft_path = outputs.path.parent / "results.json"
    draft_path.write_text(json.dumps(outputs.raw_metadata))

    # use a valid session payload (mirror existing metadata)
    session = outputs.raw_metadata
    req = rf.post(
        "/",
        data={"session_data": json.dumps(session)},
        QUERY_STRING=f"path={outputs.path}",
    )
    resp = views.researcher_finalize(req)
    assert resp.status_code == 200
    body = json.loads(resp.content)
    assert body["success"] is True
    # The implementation writes to outputs.path then removes the draft path
    # (which in our test is the same file), so the file may be removed.
    assert not Path(outputs.path).exists()
    assert not draft_path.exists()

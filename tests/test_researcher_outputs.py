import json

from django.test import RequestFactory

from sacro import views


def make_req(rf, path, data=None, post=False):
    qs = f"path={path}"
    if post:
        return rf.post("/", data=data or {}, QUERY_STRING=qs)
    return rf.get("/", data=data or {}, QUERY_STRING=qs)


def test_researcher_add_edit_delete_flow(tmp_path, test_outputs):
    outputs = test_outputs
    rf = RequestFactory()

    # start with an empty session structure
    session = {"version": outputs.version, "results": {}}

    # add a new output
    # include minimal valid ACRO file metadata so writing results.json remains valid
    file_entry = {"name": "file.txt"}
    add_data = {
        "session_data": json.dumps(session),
        "name": "new_out",
        "data": json.dumps({"files": [file_entry]}),
    }
    req = make_req(rf, outputs.path, data=add_data, post=True)
    resp = views.researcher_add_output(req)
    assert resp.status_code == 200
    body = json.loads(resp.content)
    assert body["success"] is True
    assert "html" in body

    # now edit that output (rename)
    session = {
        "version": outputs.version,
        "results": {"new_out": {"uid": "new_out", "files": [file_entry]}},
    }
    edit_data = {
        "session_data": json.dumps(session),
        "original_name": "new_out",
        "new_name": "renamed",
        "data": json.dumps({"uid": "renamed", "files": [file_entry]}),
    }
    req = make_req(rf, outputs.path, data=edit_data, post=True)
    resp = views.researcher_edit_output(req)
    assert resp.status_code == 200
    body = json.loads(resp.content)
    assert body["success"] is True

    # attempt to edit with conflicting name
    session = {
        "version": outputs.version,
        "results": {
            "renamed": {"uid": "renamed", "files": [file_entry]},
            "other": {"uid": "other", "files": [file_entry]},
        },
    }
    edit_conflict = {
        "session_data": json.dumps(session),
        "original_name": "other",
        "new_name": "renamed",
        "data": json.dumps({"files": [file_entry]}),
    }
    req = make_req(rf, outputs.path, data=edit_conflict, post=True)
    resp = views.researcher_edit_output(req)
    assert resp.status_code == 400
    # try deleting non-existing output (do this before removing last valid result)
    session = {
        "version": outputs.version,
        "results": {
            "renamed": {"uid": "renamed", "files": [file_entry]},
            "other": {"uid": "other", "files": [file_entry]},
        },
    }
    del_bad = {"session_data": json.dumps(session), "name": "nope"}
    req = make_req(rf, outputs.path, data=del_bad, post=True)
    resp = views.researcher_delete_output(req)
    assert resp.status_code == 404

    # delete the renamed output
    session = {
        "version": outputs.version,
        "results": {"renamed": {"uid": "renamed", "files": [file_entry]}},
    }
    del_data = {"session_data": json.dumps(session), "name": "renamed"}
    req = make_req(rf, outputs.path, data=del_data, post=True)
    resp = views.researcher_delete_output(req)
    assert resp.status_code == 200
    body = json.loads(resp.content)
    assert body["success"] is True

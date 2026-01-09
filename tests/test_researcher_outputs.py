import json

from django.test import RequestFactory

from sacro import views


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
    req = rf.post("/", data=add_data, QUERY_STRING=f"path={outputs.path}")
    resp = views.researcher_add_output(req)
    assert resp.status_code == 200
    body = json.loads(resp.content)
    assert body["success"] is True
    assert "html" in body

    # now edit that output (rename)
    file_entry = {
        "name": "file.txt",
        "url": "/contents/?path=p&output=new_out&filename=file.txt",
    }
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
    req = rf.post("/", data=edit_data, QUERY_STRING=f"path={outputs.path}")
    resp = views.researcher_edit_output(req)
    assert resp.status_code == 200
    body = json.loads(resp.content)
    assert body["success"] is True
    # Verify URL was updated
    assert "output_data" in body
    assert (
        body["output_data"]["files"][0]["url"]
        == "/contents/?path=p&output=renamed&filename=file.txt"
    )

    # test renaming an output without files (coverage for if "files" in new_data)
    session["results"]["no_files"] = {"uid": "no_files"}
    edit_no_files = {
        "session_data": json.dumps(session),
        "original_name": "no_files",
        "new_name": "no_files_renamed",
        "data": json.dumps({"uid": "no_files_renamed"}),
    }
    req = rf.post("/", data=edit_no_files, QUERY_STRING=f"path={outputs.path}")
    resp = views.researcher_edit_output(req)
    assert resp.status_code == 200

    # restore valid results.json for subsequent tests
    with open(outputs.path.parent / "results.json", "w") as f:
        json.dump(outputs.raw_metadata, f, default=str)

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
    req = rf.post("/", data=edit_conflict, QUERY_STRING=f"path={outputs.path}")
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
    req = rf.post("/", data=del_bad, QUERY_STRING=f"path={outputs.path}")
    resp = views.researcher_delete_output(req)
    assert resp.status_code == 404

    # delete the renamed output
    session = {
        "version": outputs.version,
        "results": {"renamed": {"uid": "renamed", "files": [file_entry]}},
    }
    del_data = {"session_data": json.dumps(session), "name": "renamed"}
    req = rf.post("/", data=del_data, QUERY_STRING=f"path={outputs.path}")
    resp = views.researcher_delete_output(req)
    assert resp.status_code == 200
    body = json.loads(resp.content)
    assert body["success"] is True

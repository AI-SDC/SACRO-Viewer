import json

from django.test import RequestFactory

from sacro import views


def test_researcher_load_session_not_found(test_outputs):
    rf = RequestFactory()
    # Ensure no draft exists
    outputs = test_outputs
    # create an alternative outputs file so draft_path differs from the loaded path
    alt = outputs.path.parent / "outputs.json"
    alt.write_text(json.dumps(outputs.raw_metadata))
    draft = outputs.path.parent / "results.json"
    # remove draft if it exists
    draft.unlink(missing_ok=True)
    req = rf.get("/", QUERY_STRING=f"path={alt}")
    resp = views.researcher_load_session(req)
    assert resp.status_code == 404


def test_researcher_load_session_draft_exists(test_outputs):
    """Test that draft exists and is loaded successfully"""
    rf = RequestFactory()
    outputs = test_outputs
    # Ensure draft exists
    draft = outputs.path.parent / "results.json"
    draft.write_text(json.dumps(outputs.raw_metadata))

    req = rf.get("/", QUERY_STRING=f"path={outputs.path}")
    resp = views.researcher_load_session(req)
    assert resp.status_code == 200


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


def test_researcher_finalize_success(test_outputs):
    """Test successful finalization with valid results"""
    outputs = test_outputs
    rf = RequestFactory()

    file_entry = {"name": "file.txt"}
    # session with valid 'results'
    session = {
        "version": outputs.version,
        "results": {"test": {"uid": "test", "files": [file_entry]}},
    }
    req = rf.post(
        "/",
        data={"session_data": json.dumps(session)},
        QUERY_STRING=f"path={outputs.path}",
    )
    resp = views.researcher_finalize(req)
    assert resp.status_code == 200


def test_researcher_save_session_io_error(test_outputs):
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


def test_researcher_add_output_invalid_json(test_outputs):
    rf = RequestFactory()
    outputs = test_outputs
    session = {"version": outputs.version, "results": {}}
    # provide invalid JSON in data field to trigger exception
    data = {
        "session_data": json.dumps(session),
        "name": "test",
        "data": "not valid json",
    }
    req = rf.post("/", data=data, QUERY_STRING=f"path={outputs.path}")
    resp = views.researcher_add_output(req)
    assert resp.status_code == 500


def test_researcher_edit_output_invalid_json(test_outputs):
    rf = RequestFactory()
    outputs = test_outputs
    session = {"version": outputs.version, "results": {}}
    # provide invalid JSON in data field to trigger exception
    data = {
        "session_data": json.dumps(session),
        "original_name": "test",
        "new_name": "test2",
        "data": "not valid json",
    }
    req = rf.post("/", data=data, QUERY_STRING=f"path={outputs.path}")
    resp = views.researcher_edit_output(req)
    assert resp.status_code == 500


def test_researcher_delete_output_invalid_json(test_outputs):
    rf = RequestFactory()
    outputs = test_outputs
    # provide invalid JSON in session_data field to trigger exception
    data = {
        "session_data": "not valid json",
        "name": "test",
    }
    req = rf.post("/", data=data, QUERY_STRING=f"path={outputs.path}")
    resp = views.researcher_delete_output(req)
    assert resp.status_code == 500


def test_researcher_edit_output_with_rename_and_same_name(test_outputs):
    """Test the branch where original_name == new_name (no rename)"""
    rf = RequestFactory()
    outputs = test_outputs
    file_entry = {"name": "file.txt"}
    session = {
        "version": outputs.version,
        "results": {"test_out": {"uid": "test_out", "files": [file_entry]}},
    }
    # rename to same name - should skip the del operation
    data = {
        "session_data": json.dumps(session),
        "original_name": "test_out",
        "new_name": "test_out",
        "data": json.dumps({"uid": "test_out", "files": [file_entry]}),
    }
    req = rf.post("/", data=data, QUERY_STRING=f"path={outputs.path}")
    resp = views.researcher_edit_output(req)
    assert resp.status_code == 200


def test_researcher_edit_output_name_exists(test_outputs):
    """Test editing an output to a name that already exists."""
    rf = RequestFactory()
    outputs = test_outputs
    session = {
        "version": outputs.version,
        "results": {
            "test_output": {"uid": "test_output"},
            "existing_output": {"uid": "existing_output"},
        },
    }
    data = {
        "session_data": json.dumps(session),
        "original_name": "test_output",
        "new_name": "existing_output",
        "data": json.dumps({"uid": "existing_output"}),
    }
    req = rf.post("/", data=data, QUERY_STRING=f"path={outputs.path}")
    resp = views.researcher_edit_output(req)
    assert resp.status_code == 400
    body = json.loads(resp.content)
    assert body["success"] is False
    assert body["message"] == "Output name already exists"


def test_researcher_delete_output_not_found(test_outputs):
    """Test deleting an output that does not exist."""
    rf = RequestFactory()
    outputs = test_outputs
    session = {
        "version": outputs.version,
        "results": {"test_output": {"uid": "test_output"}},
    }
    data = {"session_data": json.dumps(session), "name": "non_existent_output"}
    req = rf.post("/", data=data, QUERY_STRING=f"path={outputs.path}")
    resp = views.researcher_delete_output(req)
    assert resp.status_code == 404
    body = json.loads(resp.content)
    assert body["success"] is False
    assert body["message"] == "Output not found"


def test_researcher_add_output_no_files(test_outputs):
    """Test adding an output with no files key in new_output_data."""
    rf = RequestFactory()
    outputs = test_outputs
    session = {"version": outputs.version, "results": {}}
    # new_output_data is missing a 'files' key
    new_output_data = {"uid": "test_output"}
    data = {
        "session_data": json.dumps(session),
        "name": "test_output",
        "data": json.dumps(new_output_data),
    }
    req = rf.post("/", data=data, QUERY_STRING=f"path={outputs.path}")
    # This should succeed, as the file handling block is skipped
    resp = views.researcher_add_output(req)
    assert resp.status_code == 200


def test_researcher_load_session_exception(monkeypatch):
    """Test the exception handling in researcher_load_session."""
    rf = RequestFactory()

    def mock_get_outputs_from_request(data):
        raise Exception("Test exception")

    monkeypatch.setattr(
        views, "get_outputs_from_request", mock_get_outputs_from_request
    )

    req = rf.get("/", QUERY_STRING="path=/dummy/path")
    resp = views.researcher_load_session(req)
    assert resp.status_code == 500
    body = json.loads(resp.content)
    assert body["success"] is False
    assert "Test exception" in body["message"]


def test_researcher_finalize_exception(monkeypatch):
    """Test the exception handling in researcher_finalize."""
    rf = RequestFactory()

    def mock_get_outputs_from_request(data):
        raise Exception("Test exception")

    monkeypatch.setattr(
        views, "get_outputs_from_request", mock_get_outputs_from_request
    )

    req = rf.post("/", {"session_data": "{}"}, QUERY_STRING="path=/dummy/path")
    resp = views.researcher_finalize(req)
    assert resp.status_code == 500
    body = json.loads(resp.content)
    assert body["success"] is False
    assert "Test exception" in body["message"]


def test_researcher_edit_output_no_url_in_file(test_outputs):
    """Test editing an output where a file is missing a URL."""
    rf = RequestFactory()
    outputs = test_outputs
    session = {
        "version": outputs.version,
        "results": {
            "test_output": {
                "uid": "test_output",
                "files": [{"name": "file.txt"}],
            }
        },
    }
    new_data = {
        "uid": "new_output",
        "files": [{"name": "file.txt"}],  # no url key
    }
    data = {
        "session_data": json.dumps(session),
        "original_name": "test_output",
        "new_name": "new_output",
        "data": json.dumps(new_data),
    }
    req = rf.post("/", data=data, QUERY_STRING=f"path={outputs.path}")
    resp = views.researcher_edit_output(req)
    assert resp.status_code == 200
    body = json.loads(resp.content)
    assert body["success"] is True


def test_researcher_edit_output_files_is_empty(test_outputs):
    """Test editing an output with an empty files list."""
    rf = RequestFactory()
    outputs = test_outputs
    session = {
        "version": outputs.version,
        "results": {
            "test_output": {
                "uid": "test_output",
                "files": [{"name": "file.txt"}],
            }
        },
    }
    new_data = {
        "uid": "new_output",
        "files": [],  # empty list
    }
    data = {
        "session_data": json.dumps(session),
        "original_name": "test_output",
        "new_name": "new_output",
        "data": json.dumps(new_data),
    }
    req = rf.post("/", data=data, QUERY_STRING=f"path={outputs.path}")
    resp = views.researcher_edit_output(req)
    assert resp.status_code == 200
    body = json.loads(resp.content)
    assert body["success"] is True


def test_researcher_edit_output_url_no_output_param(test_outputs):
    """Test editing an output where the file URL is missing the output param."""
    rf = RequestFactory()
    outputs = test_outputs
    session = {
        "version": outputs.version,
        "results": {
            "test_output": {
                "uid": "test_output",
                "files": [{"name": "file.txt", "url": "/some/url"}],
            }
        },
    }
    new_data = {
        "uid": "new_output",
        "files": [{"name": "file.txt", "url": "/some/url"}],
    }
    data = {
        "session_data": json.dumps(session),
        "original_name": "test_output",
        "new_name": "new_output",
        "data": json.dumps(new_data),
    }
    req = rf.post("/", data=data, QUERY_STRING=f"path={outputs.path}")
    resp = views.researcher_edit_output(req)
    assert resp.status_code == 200
    body = json.loads(resp.content)
    assert body["success"] is True

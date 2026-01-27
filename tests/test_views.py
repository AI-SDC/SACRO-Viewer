import io
import json
import zipfile
from pathlib import Path
from urllib.parse import urlencode

import pytest
from django.http import Http404
from django.test import RequestFactory, override_settings
from django.urls import reverse

from sacro import models, views


def test_load(test_outputs):
    request = RequestFactory().get(
        path="/load", data={"dirpath": str(test_outputs.path.parent)}
    )
    response = views.load(request)
    assert response.status_code == 302
    assert (
        response.headers["Location"]
        == f"/role-selection/?{urlencode({'path': test_outputs.path})}"
    )


def test_load_multiple(test_outputs):
    (test_outputs.path.parent / "valid.json").write_text(
        json.dumps(test_outputs.raw_metadata)
    )
    request = RequestFactory().get(
        path="/load", data={"dirpath": str(test_outputs.path.parent)}
    )
    response = views.load(request)
    assert response.status_code == 500


def test_index(test_outputs):
    request = RequestFactory().get(path="/", data={"path": str(test_outputs.path)})

    response = views.index(request)
    assert response.context_data["outputs"] == dict(test_outputs)
    assert (
        response.context_data["create_url"]
        == f"/review/?{urlencode({'path': test_outputs.path})}"
    )


@override_settings(DEBUG=True)
def test_index_no_path(TEST_PATH):
    request = RequestFactory().get(path="/")

    response = views.index(request)
    assert response.context_data["outputs"] == dict(models.ACROOutputs(TEST_PATH))


@override_settings(DEBUG=False)
def test_index_no_path_no_debug():
    request = RequestFactory().get(path="/")
    with pytest.raises(Http404):
        views.index(request)


def test_contents_success(test_outputs):
    for metadata in test_outputs.values():
        for filedata in metadata["files"]:
            actual_file = test_outputs.path.parent / filedata["name"]
            request = RequestFactory().get(path=filedata["url"])
            response = views.contents(request)
            assert response.getvalue() == Path(actual_file).read_bytes()


def test_contents_absolute(test_outputs):
    # convert to absolute file paths
    for value in test_outputs.raw_metadata["results"].values():
        for filedata in value["files"]:
            filedata["name"] = str(test_outputs.path.parent / filedata["name"])
    test_outputs.write()

    for metadata in test_outputs.values():
        for filedata in metadata["files"]:
            actual_file = test_outputs.path.parent / filedata["name"]
            request = RequestFactory().get(path=filedata["url"])
            response = views.contents(request)
            assert response.getvalue() == Path(actual_file).read_bytes()


def test_contents_not_in_outputs(test_outputs):
    request = RequestFactory().get(
        path="/contents/",
        data={"path": str(test_outputs.path), "name": "does-not-exist"},
    )
    with pytest.raises(Http404):
        views.contents(request)


@pytest.fixture
def review_data(test_outputs):
    return {
        k: {"state": False, "comment": "comment with ' and 😀"}
        for k in test_outputs.keys()
    }


@pytest.fixture
def review_summary(review_data, test_outputs):
    return {
        "comment": "test comment with &",
        "decisions": review_data,
        "path": test_outputs.path,
    }


def test_approved_outputs_missing_metadata(tmp_path, monkeypatch):
    path = tmp_path / "results.json"
    path.write_text(
        json.dumps(
            {
                "version": "test",
                "results": {"test": {"files": [{"name": "does-not-exist"}]}},
            }
        )
    )

    review_data = {"decisions": {"test": {"state": True}}, "path": path}
    monkeypatch.setattr(views, "REVIEWS", {"current": review_data})

    request = RequestFactory().post("/")

    response = views.approved_outputs(request, pk="current")

    zf = io.BytesIO(response.getvalue())
    with zipfile.ZipFile(zf, "r") as zip_obj:
        assert zip_obj.testzip() is None
        assert zip_obj.namelist() == ["missing-files.txt", "summary.txt"]
        contents = zip_obj.open("missing-files.txt").read().decode("utf8")
        assert "were not found" in contents
        assert "does-not-exist" in contents


def test_approved_outputs_success_all_files(test_outputs, review_summary):
    # approve all files
    for k, v in review_summary["decisions"].items():
        v["state"] = True

    views.REVIEWS["current"] = review_summary

    path = urlencode({"path": test_outputs.path})
    request = RequestFactory().post(f"/?{path}")

    response = views.approved_outputs(request, pk="current")

    expected_namelist = []

    zf = io.BytesIO(response.getvalue())
    with zipfile.ZipFile(zf, "r") as zip_obj:
        assert zip_obj.testzip() is None
        for output, metadata in test_outputs.items():
            for filedata in metadata["files"]:
                filename = filedata["name"]
                expected_namelist.append(filename)
                zip_path = Path(filename).name
                actual_path = test_outputs.get_file_path(output, filename)
                assert actual_path.read_bytes() == zip_obj.open(zip_path).read()
        expected_namelist.append("summary.txt")
        assert zip_obj.namelist() == expected_namelist


def test_approved_outputs_success_logs_audit_trail(
    test_outputs, review_summary, mocker, monkeypatch
):
    monkeypatch.setattr(views, "REVIEWS", {"current": review_summary})
    mocked_local_audit = mocker.patch("sacro.views.local_audit")

    path = urlencode({"path": test_outputs.path})
    request = RequestFactory().post(f"/?{path}")

    response = views.approved_outputs(request, pk="current")

    assert response.status_code == 200
    mocked_local_audit.log_release.assert_called_once()


def test_approved_outputs_unknown_review(review_summary, monkeypatch):
    monkeypatch.setattr(views, "REVIEWS", {"current": review_summary})

    request = RequestFactory().post("/")

    with pytest.raises(Http404):
        views.approved_outputs(request, pk="test")


def test_review_create_no_comment(test_outputs, review_data):
    path = urlencode({"path": test_outputs.path})
    request = RequestFactory().post(f"/?{path}", data={"review": review_data})

    response = views.review_create(request)

    assert response.status_code == 400
    assert b"no comment data submitted" in response.content


def test_review_create_no_review_data(test_outputs):
    path = urlencode({"path": test_outputs.path})
    request = RequestFactory().post(f"/?{path}", data={"comment": "test"})

    response = views.review_create(request)

    assert response.status_code == 400
    assert b"no review data submitted" in response.content


def test_review_create_success(test_outputs, review_data):
    path = urlencode({"path": test_outputs.path})
    request = RequestFactory().post(
        f"/?{path}", data={"comment": "test", "review": json.dumps(review_data)}
    )

    response = views.review_create(request)

    assert response.status_code == 302, response.content
    assert response.url == reverse("review-detail", kwargs={"pk": "current"})
    assert views.REVIEWS["current"] == {
        "comment": "test",
        "decisions": review_data,
        "path": test_outputs.path,
    }
    # check comments
    review = views.REVIEWS["current"]["decisions"]
    first = list(review)[0]
    assert review[first]["comment"] == "comment with ' and 😀"


def test_review_create_html_entities(test_outputs, review_data):
    path = urlencode({"path": test_outputs.path})
    # just use the first comment of the test data to test
    first = list(review_data)[0]
    review_data[first]["comment"] = "&amp;"
    request = RequestFactory().post(
        f"/?{path}", data={"comment": "test", "review": json.dumps(review_data)}
    )

    views.review_create(request)

    assert views.REVIEWS["current"]["decisions"][first]["comment"] == "&"


def test_review_create_unrecognized_files(test_outputs):
    bad_data = {"output-does-not-exist": {"state": True}}
    path = urlencode({"path": test_outputs.path})
    request = RequestFactory().post(
        f"/?{path}",
        data={"comment": "test", "review": json.dumps(bad_data)},
    )

    response = views.review_create(request)

    assert response.status_code == 400, response.content
    assert b"invalid output names" in response.content


def test_review_detail_success(review_summary, monkeypatch):
    monkeypatch.setattr(views, "REVIEWS", {"current": review_summary})

    request = RequestFactory().get("/")

    response = views.review_detail(request, pk="current")

    assert response.status_code == 200
    assert response.context_data["review"] == review_summary


def test_review_detail_unknown_review(review_summary, monkeypatch):
    monkeypatch.setattr(views, "REVIEWS", {"current": review_summary})

    request = RequestFactory().get("/")

    with pytest.raises(Http404):
        views.review_detail(request, pk="test")


def test_summary_success(review_summary, monkeypatch):
    monkeypatch.setattr(views, "REVIEWS", {"current": review_summary})

    request = RequestFactory().post("/")

    response = views.summary(request, pk="current")

    assert response.status_code == 200

    content = response.getvalue().decode("utf-8")
    assert review_summary["comment"] in content
    for name, value in review_summary["decisions"].items():
        assert name in content
        assert value["comment"] in content


def test_summary_unknown_review(review_summary, monkeypatch):
    monkeypatch.setattr(views, "REVIEWS", {"current": review_summary})

    request = RequestFactory().post("/")

    with pytest.raises(Http404):
        views.summary(request, pk="test")


def test_format_mime_type_with_known_types():
    """Test format_mime_type with known MIME types"""
    assert views.format_mime_type("application/pdf") == "PDF"
    assert views.format_mime_type("text/csv") == "CSV"
    assert views.format_mime_type("image/png") == "PNG Image"
    assert views.format_mime_type("image/jpeg") == "JPEG Image"


def test_format_mime_type_with_unknown_type():
    """Test format_mime_type with unknown MIME type"""
    assert views.format_mime_type("application/unknown") == "application/unknown"


def test_format_mime_type_with_empty_string():
    """Test format_mime_type with empty string"""
    assert views.format_mime_type("") == ""


def test_format_mime_type_with_none():
    """Test format_mime_type with None"""
    assert views.format_mime_type(None) == ""


def test_role_selection_with_path(client):
    """Test role_selection view with path parameter"""
    response = client.get("/role-selection/?path=/some/path.json")
    assert response.status_code == 200
    assert "/some/path.json" in response.content.decode()


def test_role_selection_without_path(client):
    """Test role_selection view without path parameter"""
    response = client.get("/role-selection/")
    assert response.status_code == 200


def test_researcher_index_with_path(client, test_outputs):
    """Test researcher_index view with path parameter"""
    response = client.get(f"/researcher/?path={test_outputs.path}")
    assert response.status_code == 200


def test_researcher_index_no_path_debug(client, test_outputs):
    """Test researcher_index view without path in DEBUG mode"""
    # Using default path from DEBUG setting
    from unittest.mock import patch

    with patch("sacro.views.models.load_from_path") as mock_load:
        mock_load.return_value = test_outputs
        response = client.get("/researcher/?path=" + str(test_outputs.path))
        assert response.status_code == 200


def test_researcher_load(client, tmp_path):
    """Test researcher_load view"""
    json_file = tmp_path / "test.json"
    json_file.write_text('{"path": "/some/path"}')

    response = client.get(f"/researcher/load/?dirpath={tmp_path}")
    # Should redirect to researcher-index
    assert response.status_code in [200, 302]


def test_get_filepath_from_request_with_missing_path(client):
    """Test get_filepath_from_request with missing path"""
    with pytest.raises(Http404):
        views.get_filepath_from_request({}, "path")


def test_get_filepath_from_request_with_nonexistent_path(client):
    """Test get_filepath_from_request with non-existent path"""
    with pytest.raises(Http404):
        views.get_filepath_from_request({"path": "/nonexistent/path.json"}, "path")

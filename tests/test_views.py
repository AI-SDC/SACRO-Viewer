import io
import json
import shutil
import zipfile
from pathlib import Path
from urllib.parse import urlencode

import pytest
from django.http import Http404
from django.test import RequestFactory, override_settings

from sacro import transform, views


TEST_PATH = Path("outputs/results.json")


@pytest.fixture
def test_outputs(tmp_path):
    shutil.copytree(TEST_PATH.parent, tmp_path, dirs_exist_ok=True)
    return views.Outputs(tmp_path / TEST_PATH.name)


def test_outputs_as_dict(test_outputs):
    d = test_outputs.as_dict()
    raw = json.loads(test_outputs.path.read_text())
    assert d["outputs"].raw_metadata == raw
    assert list(d["outputs"].items()) == list(
        transform.transform_acro_metadata(raw).items()
    )
    assert d["review_url"] == f"/review/?{urlencode({'path': test_outputs.path})}"


def test_index(test_outputs):
    request = RequestFactory().get(path="/", data={"path": str(test_outputs.path)})

    response = views.index(request)
    assert response.context_data["outputs"] == test_outputs.as_dict()


@override_settings(DEBUG=True)
def test_index_no_path():
    request = RequestFactory().get(path="/")

    response = views.index(request)
    assert response.context_data["outputs"] == views.Outputs(TEST_PATH).as_dict()


@override_settings(DEBUG=False)
def test_index_no_path_no_debug():
    request = RequestFactory().get(path="/")
    with pytest.raises(Http404):
        views.index(request)


def test_contents_success(test_outputs):
    for output, url in test_outputs.content_urls.items():
        actual_file = test_outputs.path.parent / test_outputs[output]["path"]
        request = RequestFactory().get(path=url)
        response = views.contents(request)
        assert response.getvalue() == Path(actual_file).read_bytes()


def test_contents_absolute(test_outputs):
    # convert to absolute file paths
    for value in test_outputs.raw_metadata.values():
        for output in value["output"]:
            value["output"] = [
                str(test_outputs.path.parent / output) for output in value["output"]
            ]
    test_outputs.write()

    for output, url in test_outputs.content_urls.items():
        test_outputs.path.parent / test_outputs[output]["path"]
        request = RequestFactory().get(path=url)
        views.contents(request)


def test_contents_not_in_outputs(test_outputs):
    request = RequestFactory().get(
        path="/contents/",
        data={"path": str(test_outputs.path), "name": "does-not-exist"},
    )
    with pytest.raises(Http404):
        views.contents(request)


def get_review_url_request(outputs_metadata, review_data):
    # we currently use a query param to pass the path, but this is a POST
    # so we use a get request to build the query string url, and then POST to that
    rq = RequestFactory()
    url = rq.get("/review", data={"path": str(outputs_metadata.path)}).get_full_path()
    data = {}
    if review_data:
        data["review"] = json.dumps(review_data)
    return rq.post(url, data=data)


@pytest.fixture
def review_data(test_outputs):
    return {k: {"state": False, "comments": "comment"} for k in test_outputs.keys()}


def test_review_success_all_files(test_outputs, review_data):
    # approve all files
    for k, v in review_data.items():
        v["state"] = True
    request = get_review_url_request(test_outputs, review_data)
    response = views.review(request)
    zf = io.BytesIO(response.getvalue())
    with zipfile.ZipFile(zf, "r") as zip_obj:
        assert zip_obj.testzip() is None
        assert zip_obj.namelist() == [
            Path(v["path"]).name for v in test_outputs.values()
        ]
        for output, data in test_outputs.items():
            zip_path = Path(data["path"]).name
            actual_path = test_outputs.get_file_path(output)
            assert actual_path.read_bytes() == zip_obj.open(zip_path).read()


def test_review_success_no_files(test_outputs, review_data):
    request = get_review_url_request(test_outputs, None)
    response = views.review(request)
    assert response.status_code == 400


def test_review_success_unrecognized_files(test_outputs):
    bad_data = {"output-does-not-exist": {"state": True}}
    request = get_review_url_request(test_outputs, bad_data)
    response = views.review(request)
    assert response.status_code == 400


def test_review_missing_metadata(tmp_path):
    path = tmp_path / "results.json"
    path.write_text(json.dumps({"test": {"output": ["does-not-exist"]}}))
    review_data = {"test": {"state": True}}
    url = RequestFactory().get("/review", data={"path": str(path)}).get_full_path()
    request = RequestFactory().post(url, data={"review": json.dumps(review_data)})
    response = views.review(request)
    zf = io.BytesIO(response.getvalue())
    with zipfile.ZipFile(zf, "r") as zip_obj:
        assert zip_obj.testzip() is None
        assert zip_obj.namelist() == ["missing-files.txt"]
        contents = zip_obj.open("missing-files.txt").read().decode("utf8")
        assert "were not found" in contents
        assert "does-not-exist" in contents


def test_review_success_logs_audit_trail(test_outputs, review_data, mocker):
    mocked_local_audit = mocker.patch("sacro.views.local_audit")
    request = get_review_url_request(test_outputs, review_data)

    response = views.review(request)

    assert response.status_code == 200
    mocked_local_audit.log_release.assert_called_once()

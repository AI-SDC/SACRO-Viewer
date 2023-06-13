import io
import json
import zipfile
from pathlib import Path
from urllib.parse import urlencode

import pytest
from django.http import Http404
from django.test import RequestFactory, override_settings

from sacro import views


TEST_PATH = Path("outputs/test_results.json")
TEST_OUTPUTS = views.Outputs(TEST_PATH)


def test_outputs_as_dict():
    d = TEST_OUTPUTS.as_dict()
    assert d["outputs"] == json.loads(TEST_PATH.read_text())
    assert d["review_url"] == f"/review/?{urlencode({'path': TEST_PATH})}"


def test_index(tmp_path):
    request = RequestFactory().get(path="/", data={"path": str(TEST_PATH)})

    response = views.index(request)
    assert response.context_data["outputs"] == TEST_OUTPUTS.as_dict()


@override_settings(DEBUG=True)
def test_index_no_path(tmp_path):
    request = RequestFactory().get(path="/")

    response = views.index(request)
    assert response.context_data["outputs"] == TEST_OUTPUTS.as_dict()


@override_settings(DEBUG=False)
def test_index_no_path_no_debug(tmp_path):
    request = RequestFactory().get(path="/")
    with pytest.raises(Http404):
        views.index(request)


def test_contents_success():
    for output, url in TEST_OUTPUTS.content_urls.items():
        actual_file = TEST_OUTPUTS[output]["output"]
        request = RequestFactory().get(path=url)
        response = views.contents(request)
        assert response.getvalue() == Path(actual_file).read_bytes()


def test_contents_not_in_outputs():
    request = RequestFactory().get(
        path="/contents/", data={"path": str(TEST_PATH), "file": "does-not-exist"}
    )
    with pytest.raises(Http404):
        views.contents(request)


def test_review_success():
    request = RequestFactory().post("/review", data={"path": str(TEST_PATH)})
    response = views.review(request)
    zf = io.BytesIO(response.getvalue())
    with zipfile.ZipFile(zf, "r") as zip_obj:
        assert zip_obj.testzip() is None
        assert zip_obj.namelist() == ["test_results.json"] + [
            Path(v["output"]).name for v in TEST_OUTPUTS.values()
        ]
        for output in TEST_OUTPUTS.values():
            f = Path(output["output"])
            assert f.read_bytes() == zip_obj.open(f.name).read()

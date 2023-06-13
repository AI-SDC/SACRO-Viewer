from pathlib import Path

import pytest
from django.http import Http404
from django.test import RequestFactory, override_settings

from sacro import views


TEST_PATH = Path("outputs/test_results.json")
TEST_OUTPUTS = views.Outputs(TEST_PATH)


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


def test_contents_not_in_outputs(tmp_path):
    request = RequestFactory().get(
        path="/contents/", data={"path": str(TEST_PATH), "file": "does-not-exist"}
    )
    with pytest.raises(Http404):
        views.contents(request)

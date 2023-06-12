import json
from pathlib import Path

import pytest
from django.http import Http404
from django.test import RequestFactory, override_settings

from sacro import views


TEST_OUTPUTS = Path("outputs/test_results.json")


def test_index(tmp_path):
    request = RequestFactory().get(path="/", data={"path": str(TEST_OUTPUTS)})

    response = views.index(request)
    assert response.context_data["outputs"] == json.loads(TEST_OUTPUTS.read_text())


@override_settings(DEBUG=True)
def test_index_no_path(tmp_path):
    request = RequestFactory().get(path="/")

    response = views.index(request)
    assert response.context_data["outputs"] == json.loads(TEST_OUTPUTS.read_text())


@override_settings(DEBUG=False)
def test_index_no_path_no_debug(tmp_path):
    request = RequestFactory().get(path="/")
    with pytest.raises(Http404):
        views.index(request)

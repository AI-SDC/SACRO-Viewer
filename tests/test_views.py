import json
from pathlib import Path

from django.test import RequestFactory

from sacro import views


TEST_OUTPUTS = Path("outputs/test_results.json")


def test_index(tmp_path):
    request = RequestFactory().get(path="/", data={"path": str(TEST_OUTPUTS)})

    response = views.index(request)
    assert response.context_data["outputs"] == json.loads(TEST_OUTPUTS.read_text())

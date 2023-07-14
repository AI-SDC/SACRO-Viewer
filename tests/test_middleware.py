import json
import shutil

from django.test import Client


def test_error_handling_middleware(client, tmp_path, TEST_PATH):
    shutil.copytree(TEST_PATH.parent, tmp_path, dirs_exist_ok=True)
    path = tmp_path / TEST_PATH.name

    # change the version number
    data = json.load(path.open())
    data["version"] = "0.3.0"
    json.dump(data, path.open("w"))

    response = Client().get(f"/?path={path}")
    assert response.status_code == 500
    assert (
        "Unsupported ACRO output. This viewer supports ACRO version 0.4.x, but your results were generated with version 0.3.0."
        in response.rendered_content
    )

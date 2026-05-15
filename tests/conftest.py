import shutil
from pathlib import Path

import pytest
from django.test import Client, RequestFactory

from sacro import models


@pytest.fixture
def TEST_PATH():
    return Path("outputs/results.json")


@pytest.fixture
def test_outputs(tmp_path, TEST_PATH):
    shutil.copytree(TEST_PATH.parent, tmp_path, dirs_exist_ok=True)
    return models.ACROOutputs(tmp_path / TEST_PATH.name)


@pytest.fixture
def rf():
    return RequestFactory()


@pytest.fixture
def client():
    return Client()

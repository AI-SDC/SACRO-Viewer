import pytest
from django.test import override_settings

from sacro.versioning import (
    IncorrectVersionError,
    UnsupportedVersionFormatError,
    Version,
    check_version,
)


@override_settings(ACRO_SUPPORTED_VERSION="0.4.0")
def test_check_version(monkeypatch):
    assert check_version("0.4.0") is None
    assert check_version("0.4.2") is None

    with pytest.raises(IncorrectVersionError):
        check_version("0.3.0")


@pytest.mark.parametrize("version", ["test", "v0.4.0"])
def test_version_init_with_unexpected_format(version):
    with pytest.raises(UnsupportedVersionFormatError):
        Version(version)


@pytest.mark.parametrize("version", ["0.4.0", "0.4"])
def test_version_init_success(version):
    Version(version)


def test_version_rich_comparison_eq():
    assert Version("0.4.0") == Version("0.4.0")

    # check bugfix numbers are ignored
    assert Version("0.4.0") == Version("0.4.2")


def test_version_rich_comparison_ge():
    assert Version("0.4.0") >= Version("0.3.0")
    assert Version("0.4.0") >= Version("0.4.0")
    assert Version("1.0.0") >= Version("0.3.0")


def test_version_rich_comparison_gt():
    assert Version("0.4.0") > Version("0.3.0")
    assert Version("1.0.0") > Version("0.3.0")


def test_version_rich_comparison_le():
    assert Version("0.3.0") <= Version("0.4.0")
    assert Version("0.4.0") <= Version("0.4.0")
    assert Version("0.3.0") <= Version("1.0.0")


def test_version_rich_comparison_lt():
    assert Version("0.3.0") < Version("0.4.0")
    assert Version("0.3.0") < Version("1.0.0")


def test_version_rich_comparison_ne():
    assert Version("1.4.0") != Version("0.4.0")
    assert Version("0.3.0") != Version("0.4.0")

    # check bugfix numbers are ignored
    assert Version("0.3.2") != Version("0.4.2")


def test_version_repr():
    assert repr(Version("0.7.0")) == "Version: 0.7.0"


def test_version_str():
    assert str(Version("0.7.0")) == "0.7.0"

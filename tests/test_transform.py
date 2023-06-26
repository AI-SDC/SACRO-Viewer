import json

import pytest

from sacro import transform


def test_minimal():
    minimal = {"test": {}}

    assert transform.transform_acro_metadata(minimal) == {
        "test": {
            "name": "test",
            "display_name": "test",
            "type": "unknown",
            "status": "unknown",
            "summary": [],
            "outcome": {},
            "path": None,
            "command": None,
            "comments": [],
            "timestamp": None,
        }
    }


def test_outcome_parsing():
    outcome = {"foo": "bar"}

    json_outcome = transform.transform_acro_metadata({"test": {"outcome": outcome}})
    assert json_outcome["test"]["outcome"] == outcome
    # stringified
    str_outcome = transform.transform_acro_metadata(
        {"test": {"outcome": json.dumps(outcome)}}
    )
    assert str_outcome["test"]["outcome"] == outcome


def test_timestamp_parsing():
    ts = "2023-01-01-12345612"
    name = f"test_{ts}"
    # note that the timestamps we currently get from acro are naive.
    iso = "2023-01-01T12:34:56.120000"

    test = {f"test_{ts}": {"timestamp": ts}}

    assert transform.transform_acro_metadata(test) == {
        name: {
            "name": name,
            "display_name": "test",
            "type": "unknown",
            "status": "unknown",
            "summary": [],
            "outcome": {},
            "path": None,
            "command": None,
            "comments": [],
            "timestamp": iso,
        }
    }


@pytest.mark.parametrize(
    "command,expected",
    [
        ("foo = acro.crosstab(...)", "crosstab"),
        ("foo = acro.pivot_table(...)", "pivot_table"),
        ("foo = acro.ols()...)", "ols"),
        ("foo = acro.olsr()...)", "olsr"),
        ("foo = acro.logit()...)", "logit"),
        ("foo = acro.progit()...)", "progit"),
        ("foo = ...", "unknown"),
    ],
)
def test_type_parsing(command, expected):
    test = {"test": {"command": command}}
    transformed = transform.transform_acro_metadata(test)
    assert transformed["test"]["type"] == expected


def test_status_parsing():
    transformed = transform.transform_acro_metadata(
        {"test": {"summary": "pass; other; info"}}
    )
    assert transformed["test"]["status"] == "pass"
    assert transformed["test"]["summary"] == ["other", "info"]

    transformed = transform.transform_acro_metadata(
        {"test": {"summary": "fail; other; info"}}
    )
    assert transformed["test"]["status"] == "fail"
    assert transformed["test"]["summary"] == ["other", "info"]

    transformed = transform.transform_acro_metadata({"test": {"summary": "review"}})
    assert transformed["test"]["status"] == "review"
    assert transformed["test"]["summary"] == []

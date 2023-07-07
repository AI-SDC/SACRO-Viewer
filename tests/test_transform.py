from sacro import transform


def test_minimal():
    minimal = {"test": {}}

    assert transform.transform_acro_metadata(minimal) == {
        "test": {
            "uid": "test",
            "type": "unknown",
            "status": "unknown",
            "properties": {},
            "command": "",
            "summary": "",
            "outcome": {},
            "output": [],
            "comments": [],
            "timestamp": None,
            "path": None,
        }
    }

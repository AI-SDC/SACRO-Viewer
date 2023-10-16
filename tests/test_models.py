import json

import pytest

from sacro import models


def test_outputs_annotation(test_outputs):
    assert test_outputs.version == "0.4.0"
    for metadata in test_outputs.values():
        for filedata in metadata["files"]:
            assert filedata["checksum"] is not None
            assert filedata["checksum_valid"] is True
            assert filedata["url"].startswith("/contents/?path=")

            cells = filedata.get("sdc", {}).get("cells", {})
            cell_index = filedata["cell_index"]

            if cells == {}:
                assert cell_index == {}
                continue

            for flag, indicies in cells.items():
                for x, y in indicies:
                    key = f"{x},{y}"
                    assert key in cell_index


def test_outputs_annotation_checksum_failed(test_outputs):
    first_output = list(test_outputs)[0]
    first_file = test_outputs[first_output]["files"][0]["name"]
    checksum = test_outputs.path.parent / "checksums" / (first_file + ".txt")
    checksum.write_text("bad checksum")

    # re-annotate
    test_outputs.annotate()

    assert test_outputs[first_output]["files"][0]["checksum"] == "bad checksum"
    assert test_outputs[first_output]["files"][0]["checksum_valid"] is False


@pytest.mark.parametrize(
    "data",
    [
        {},
        {"version": "1"},
        {"version": "1", "results": {}},
        {"version": "1", "results": {"name": {"files": []}}},
        {"version": "1", "results": {"name": {"notfiles": "foo"}}},
    ],
)
def test_validation(data, tmp_path):
    bad_json = tmp_path / "bad.json"
    bad_json.write_text(json.dumps(data))
    with pytest.raises(models.ACROOutputs.InvalidFile):
        models.ACROOutputs(bad_json)

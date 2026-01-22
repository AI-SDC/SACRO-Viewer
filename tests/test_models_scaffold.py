import hashlib
import json

from sacro.models import scaffold_acro_metadata


def test_scaffold_ignores_dot_files(tmp_path):
    # create a file and a dot-file
    (tmp_path / "visible.txt").write_text("hello")
    (tmp_path / ".hidden").write_text("secret")

    outputs = tmp_path / "outputs.json"
    scaffold_acro_metadata(outputs)

    data = json.loads(outputs.read_text())
    # only visible.txt should be present
    assert "visible.txt" in data["results"]
    assert ".hidden" not in data["results"]

    # checksums dir created and checksum file exists for visible.txt
    cs_dir = tmp_path / "checksums"
    assert cs_dir.exists()
    cs_file = cs_dir / "visible.txt.txt"
    assert cs_file.exists()
    expected = hashlib.sha256((tmp_path / "visible.txt").read_bytes()).hexdigest()
    assert cs_file.read_text() == expected

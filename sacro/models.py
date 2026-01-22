import hashlib
import json
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

from sacro import utils, versioning


class MultipleACROFiles(Exception):
    pass


def find_acro_metadata(dirpath):
    json_files = list(dirpath.glob("*.json"))
    default = dirpath / "outputs.json"
    path = None

    if default.exists():
        path = default
    elif len(json_files) == 1:
        path = dirpath / json_files[0]
    else:
        valid_jsons = []
        for jf in json_files:
            try:
                ACROOutputs(dirpath / jf)
            except ACROOutputs.InvalidFile:
                pass
            else:
                valid_jsons.append(dirpath / jf)
        if len(valid_jsons) == 1:
            path = valid_jsons[0]
        elif len(valid_jsons) > 1:
            files = ", ".join(str(s.name) for s in valid_jsons)
            raise MultipleACROFiles(
                f"SACRO Viewer does not support multiple ACRO json files in the same directory\n"
                f"Found {len(valid_jsons)}: {files}"
            )

    if path is None:
        path = default
        scaffold_acro_metadata(default)

    return path


def scaffold_acro_metadata(path):
    dirpath = path.parent
    checksums_dir = dirpath / "checksums"
    metadata = {
        "version": "0.4.0",
        "results": {},
    }

    for output in dirpath.glob("*"):
        if output.is_dir():
            continue
        uid = output.name
        if uid.startswith("."):
            continue
        metadata["results"][uid] = {
            "uid": uid,
            "files": [{"name": output.name}],
            "status": "review",
            "type": "custom",
            "properties": {},
            "outcome": {},
            "command": "custom",
            "summary": "review",
            "exception": None,
            "timestamp": datetime.fromtimestamp(output.stat().st_mtime).isoformat(),
            "comments": [
                "This non-ACRO output metadata was auto generated the SACRO Viewer application",
            ],
        }

        # Write the checksums at the time of first looking at the directory
        # This is a bit of a hack. Ideally, we'd find a way to disable checksums in such cases
        checksums_dir.mkdir(exist_ok=True)
        checksum_path = checksums_dir / (output.name + ".txt")
        checksum_path.write_text(hashlib.sha256(output.read_bytes()).hexdigest())

    path.write_text(json.dumps(metadata, indent=2))


def load_from_path(path):
    """Use outputs path from request and load it"""
    outputs = ACROOutputs(path)

    versioning.check_version(outputs.version)

    return outputs


@dataclass
class ACROOutputs(dict):
    """An ACRO json output file"""

    class InvalidFile(Exception):
        pass

    path: Path
    version: str = None
    config: dict = field(default_factory=dict)

    def __post_init__(self):
        self.raw_metadata = json.loads(self.path.read_text())
        config_path = self.path.parent / "config.json"
        if config_path.exists():
            self.config = json.loads(config_path.read_text())

        # super basic structural validation
        try:
            assert "version" in self.raw_metadata
            assert "results" in self.raw_metadata
            # assert len(self.raw_metadata["results"]) > 0
            for result in self.raw_metadata["results"].values():
                assert "files" in result
                assert len(result["files"]) > 0
                for filedata in result["files"]:
                    assert "name" in filedata

        except AssertionError as exc:
            raise self.InvalidFile(f"{self.path} is not a valid ACRO json file: {exc}")

        self.version = self.raw_metadata["version"]
        self.update(self.raw_metadata["results"])
        self.annotate()

    def annotate(self):
        """Add various useful annotations to the JSON data"""

        # add urls to JSON data
        for output, metadata in self.items():
            for filedata in metadata["files"]:
                filedata["url"] = utils.reverse_with_params(
                    {
                        "path": str(self.path),
                        "output": output,
                        "filename": filedata["name"],
                    },
                    "contents",
                )

        # add and check checksum data, and transform cell data to more useful format
        checksums_dir = self.path.parent / "checksums"
        checksums_dir.mkdir(exist_ok=True)
        for output, metadata in self.items():
            for filedata in metadata["files"]:
                # checksums
                filedata["checksum_valid"] = False
                filedata["checksum"] = None

                actual_file = self.get_file_path(output, filedata["name"])
                if not actual_file.exists():
                    continue

                path = checksums_dir / (filedata["name"] + ".txt")
                file_bytes = actual_file.read_bytes()
                file_checksum = hashlib.sha256(file_bytes).hexdigest()

                if not path.exists():
                    path.write_text(file_checksum)

                stored_checksum = path.read_text(encoding="utf8")
                filedata["checksum"] = stored_checksum
                filedata["checksum_valid"] = file_checksum == stored_checksum

                # cells
                cells = filedata.get("sdc", {}).get("cells", {})
                cell_index = defaultdict(list)

                for flag, indicies in cells.items():
                    for x, y in indicies:
                        key = f"{x},{y}"
                        cell_index[key].append(flag)

                filedata["cell_index"] = cell_index

    def get_file_path(self, output, filename):
        """Return absolute path to output file"""
        if filename not in {
            f["name"] for f in self[output]["files"]
        }:  # pragma: nocover
            return None
        # note: if filename is absolute, this will just return filename
        return self.path.parent / filename

    def write(self):
        """Useful testing helper"""
        self.path.write_text(json.dumps(self.raw_metadata, indent=2))
        self.clear()
        self.version = None
        self.__post_init__()

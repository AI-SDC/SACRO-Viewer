import hashlib
import json
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path

from sacro import utils, versioning


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
            assert len(self.raw_metadata["results"]) > 0
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
        for output, metadata in self.items():
            for filedata in metadata["files"]:
                # checksums
                filedata["checksum_valid"] = False
                filedata["checksum"] = None

                path = checksums_dir / (filedata["name"] + ".txt")
                if not path.exists():
                    continue

                filedata["checksum"] = path.read_text(encoding="utf8")
                actual_file = self.get_file_path(output, filedata["name"])

                if not actual_file.exists():  # pragma: nocover
                    continue

                checksum = hashlib.sha256(actual_file.read_bytes()).hexdigest()
                filedata["checksum_valid"] = checksum == filedata["checksum"]

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

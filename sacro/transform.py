import re


TYPE = re.compile(r".*acro.(\w+)\(.*")
# example "2023-06-23-11472054",
DATE_FORMAT = "%Y-%m-%d-%H%M%S%f"

DEFAULTS = {
    "status": "unknown",
    "type": "unknown",
    "properties": {},
    "command": "",
    "summary": "",
    "outcome": {},
    "output": [],
    "timestamp": None,
    "comments": [],
    "path": None,
}


def transform_acro_metadata(raw_metadata):
    """Parse and transform current ACRO JSON format into richer more useful format."""
    transformed = {}

    for name, metadata in raw_metadata.items():
        new = DEFAULTS.copy()
        new.setdefault("uid", name)
        new.update(**metadata)
        transformed[name] = new

    return transformed

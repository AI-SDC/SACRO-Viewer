import json
import re
from datetime import datetime


TYPE = re.compile(r".*acro.(\w+)\(.*")
# example "2023-06-23-11472054",
DATE_FORMAT = "%Y-%m-%d-%H%M%S%f"


def transform_acro_metadata(raw_metadata):
    """Parse and transform current ACRO JSON format into richer more useful format."""
    transformed = {}

    for name, metadata in raw_metadata.items():
        display_name = name
        raw_ts = metadata.get("timestamp")
        if raw_ts:
            display_name = name[: -(len(raw_ts) + 1)]
        status, *summary = (
            s.strip()
            for s in metadata.get("summary", "unknown").split(";")
            if s.strip()
        )
        output_type = metadata.get("command", "unknown")
        if output_type not in ("unknown", "custom"):
            match = TYPE.search(output_type)
            if match:
                output_type = match.group(1)
            else:
                output_type = "unknown"
        outcome = metadata.get("outcome", {})
        new = {
            "name": name,
            "display_name": display_name,
            "type": output_type,
            "status": status,
            "summary": summary,
            "outcome": json.loads(outcome) if isinstance(outcome, str) else outcome,
            "path": metadata.get("output"),
            "command": metadata.get("command"),
            "comments": [
                c.strip() for c in metadata.get("comments", "").split(",") if c.strip()
            ],
            "timestamp": None,
        }

        if raw_ts:
            # current, the timestamps we get are naive, so we preserve that
            new["timestamp"] = datetime.strptime(raw_ts, DATE_FORMAT).isoformat()

        transformed[name] = new

    return transformed

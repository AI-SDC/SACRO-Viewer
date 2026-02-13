import copy
import io
import json
import logging
import zipfile

from django.template.loader import render_to_string


logger = logging.getLogger(__name__)


def get_summary(review, outputs):
    # add ACRO status to output decisions
    for name, data in review["decisions"].items():
        review["decisions"][name]["acro_status"] = outputs.get(name, {}).get(
            "status", "Unknown"
        )
    return render_to_string("summary.txt", context={"review": review})


def create(outputs, review, approved_outputs):
    in_memory_zf = io.BytesIO()
    with zipfile.ZipFile(in_memory_zf, "w") as zip_obj:
        missing = []

        redacted_metadata = copy.deepcopy(outputs.raw_metadata)
        results = redacted_metadata.get("results", {})

        to_remove = [k for k in results if k not in approved_outputs]
        for k in to_remove:
            del results[k]

        for name in approved_outputs:
            if name in results:
                decision = review["decisions"].get(name, {})
                comment = decision.get("comment")
                if comment:
                    if "comments" not in results[name]:
                        results[name]["comments"] = []
                    results[name]["comments"].append(f"Output Checker: {comment}")

                results[name]["status"] = "approved"

        zip_obj.writestr("results.json", json.dumps(redacted_metadata, indent=2))

        # add approved files
        for output in approved_outputs:
            if output not in outputs:
                continue

            for filedata in outputs[output]["files"]:
                path = outputs.get_file_path(output, filedata["name"])
                if path.exists():
                    zip_obj.write(path, arcname=path.name)
                else:
                    logger.warning(f"{path} does not exist. Excluding from zipfile")
                    missing.append(str(path))

        if missing:
            lines = [
                "The following output files were not found when creating this zipfile:",
                "",
            ] + missing
            zip_obj.writestr("missing-files.txt", data="\n".join(lines))

        zip_obj.writestr("summary.txt", data=get_summary(review, outputs))

    # rewind the file stream to the start
    in_memory_zf.seek(0)

    return in_memory_zf

import io
import logging
import zipfile

from django.template.loader import render_to_string


logger = logging.getLogger(__name__)


def get_summary(review, outputs):
    # add ACRO status to output decisions
    for name, data in review["decisions"].items():
        review["decisions"][name]["acro_status"] = outputs[name].get(
            "status", "Unknown"
        )
    return render_to_string("summary.txt", context={"review": review})


def create(outputs, review, approved_outputs):
    in_memory_zf = io.BytesIO()
    with zipfile.ZipFile(in_memory_zf, "w") as zip_obj:
        missing = []

        # add approved files
        for output in approved_outputs:
            for filedata in outputs[output]["files"]:
                path = outputs.get_file_path(output, filedata["name"])
                if path.exists():
                    zip_obj.write(path, arcname=path.name)
                else:
                    logger.warning("{path} does not exist. Excluding from zipfile")
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

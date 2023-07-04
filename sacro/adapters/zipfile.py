import io
import logging
import zipfile


logger = logging.getLogger(__name__)


def create(outputs, approved_outputs):
    in_memory_zf = io.BytesIO()
    with zipfile.ZipFile(in_memory_zf, "w") as zip_obj:
        missing = []

        # add approved files
        for approved in approved_outputs:
            path = outputs.get_file_path(approved)
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

    # rewind the file stream to the start
    in_memory_zf.seek(0)

    return in_memory_zf

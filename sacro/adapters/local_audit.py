import logging
import os
from pathlib import Path


def get_filename():
    filename = Path(os.getenv("APPDATA", ".")) / "SACRO" / "audit.log"
    filename.parent.mkdir(parents=True, exist_ok=True)
    return str(filename)


def make_logger(filename):
    handler = logging.FileHandler(filename=filename)
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    handler.setFormatter(formatter)
    logger = logging.getLogger("audit")
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    return logger


filename = get_filename()
logger = make_logger(filename)


def log_release(outputs, username):
    for output in outputs:
        logger.info(f"File released by {username}: {output}")

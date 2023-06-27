import logging
import os


def make_logger():
    handler = logging.FileHandler(filename="spam.log")
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    handler.setFormatter(formatter)
    logger = logging.getLogger("audit")
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    return logger


logger = make_logger()


def log_release(outputs, username):
    for output in outputs:
        logger.info(f"File released by {username}: {output}")

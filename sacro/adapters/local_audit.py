import structlog


logger = structlog.getLogger("audit")


def log_release(outputs, username):
    for output in outputs:
        logger.info(f"File released by {username}: {output}")

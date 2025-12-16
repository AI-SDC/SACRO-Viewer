import structlog


logger = structlog.getLogger("audit")


def log_release(review_data, username):
    for output, data in review_data.items():
        verb = "approved" if data["state"] else "rejected"
        comment = data.get("comment")
        logger.info(f"Output {output} {verb} by {username}")
        logger.info(f"Reviewer comment: {comment}")

import os
from pathlib import Path

import structlog


def get_log_filename():
    filename = Path(os.getenv("APPDATA", ".")) / "SACRO" / "error.log"
    filename.parent.mkdir(parents=True, exist_ok=True)
    return str(filename)


def get_audit_filename():
    filename = Path(os.getenv("APPDATA", ".")) / "SACRO" / "audit.log"
    filename.parent.mkdir(parents=True, exist_ok=True)
    return str(filename)


pre_chain = [
    structlog.contextvars.merge_contextvars,
    structlog.stdlib.add_log_level,
    structlog.stdlib.add_logger_name,
    structlog.processors.TimeStamper(fmt="iso", key="ts"),
]

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.filter_by_level,
        structlog.processors.TimeStamper(fmt="iso", key="ts"),
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
    ],
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logging_config_dict = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "formatter": {
            "()": structlog.stdlib.ProcessorFormatter,
            "processor": structlog.dev.ConsoleRenderer(colors=True),
            "foreign_pre_chain": pre_chain,
        },
        "fileformatter": {
            "()": structlog.stdlib.ProcessorFormatter,
            "processor": structlog.dev.ConsoleRenderer(colors=False),
            "foreign_pre_chain": pre_chain,
        },
    },
    "handlers": {
        "console": {
            "level": "DEBUG",
            "class": "logging.StreamHandler",
            "formatter": "formatter",
        },
        "file": {
            "level": "DEBUG",
            "class": "logging.FileHandler",
            "formatter": "fileformatter",
            "filename": get_log_filename(),
        },
        "audit_file": {
            "level": "INFO",
            "class": "logging.FileHandler",
            "formatter": "fileformatter",
            "filename": get_audit_filename(),
        },
    },
    "root": {"handlers": ["console", "file"], "level": "WARNING"},
    "loggers": {
        "django": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False,
        },
        "uvicorn": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False,
        },
        "django_structlog": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": False,
        },
        "sacro": {"handlers": ["console", "file"], "level": "INFO", "propagate": False},
        "audit": {"handlers": ["audit_file"], "level": "INFO", "propagate": False},
    },
}

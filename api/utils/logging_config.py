"""
Structured Logging Configuration

- Development: human-readable, colorized output
- Production: JSON format for log aggregators (Datadog, CloudWatch, ELK)

Configured via environment variables:
- LOG_LEVEL: DEBUG, INFO, WARNING, ERROR, CRITICAL (default: INFO)
- LOG_FORMAT: simple, json (default: simple)
"""

import json
import logging
import logging.config
import os
from typing import Optional


class JSONFormatter(logging.Formatter):
    """Emit log records as single-line JSON objects."""

    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": self.formatTime(record),
            "level": record.levelname.lower(),
            "logger": record.name,
            "message": record.getMessage(),
        }

        if record.exc_info and record.exc_info[0] is not None:
            log_entry["exception"] = self.formatException(record.exc_info)

        # Include extra fields passed via logger.info("msg", extra={...})
        for key in ("request_id", "method", "path", "status_code", "duration_ms"):
            val = getattr(record, key, None)
            if val is not None:
                log_entry[key] = val

        return json.dumps(log_entry, default=str)


def setup_logging(
    level: Optional[str] = None,
    fmt: Optional[str] = None,
) -> None:
    """
    Configure logging for the entire application.

    Call once at startup (before any loggers are used).
    """
    log_level = (level or os.getenv("LOG_LEVEL", "INFO")).upper()
    log_format = fmt or os.getenv("LOG_FORMAT", "simple")

    if log_format == "json":
        formatter_config = {
            "()": f"{__name__}.JSONFormatter",
        }
    else:
        formatter_config = {
            "format": "%(asctime)s %(levelname)-8s [%(name)s] %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        }

    config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": formatter_config,
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "default",
                "stream": "ext://sys.stdout",
            },
        },
        "root": {
            "level": log_level,
            "handlers": ["console"],
        },
        # Quiet noisy third-party loggers
        "loggers": {
            "uvicorn": {"level": "INFO"},
            "uvicorn.access": {"level": "WARNING"},
            "sqlalchemy.engine": {"level": "WARNING"},
            "httpx": {"level": "WARNING"},
        },
    }

    logging.config.dictConfig(config)

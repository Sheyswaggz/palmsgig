"""
Logging configuration for PalmsGig application.

Provides centralized logging setup with file rotation, console output,
and JSON formatting for production environments.
"""

import logging
import logging.handlers
import sys
from pathlib import Path

from src.shared.config import Settings


def setup_logging(settings: Settings) -> None:
    """
    Configure application logging with file and console handlers.

    Sets up rotating file handlers for application logs with automatic
    log rotation and retention. Also configures console output for
    development environments.

    Args:
        settings: Application settings instance

    File Structure:
        logs/
        ├── app.log              # Main application log
        ├── app.log.1            # Rotated logs
        ├── app.log.2
        ├── error.log            # Error-only log
        └── error.log.1          # Rotated error logs
    """
    # Create logs directory
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)

    # Get log level from settings
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)

    # Root logger configuration
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)

    # Clear existing handlers
    root_logger.handlers.clear()

    # Define log format
    if settings.LOG_FORMAT.lower() == "json":
        log_format = (
            '{"timestamp": "%(asctime)s", '
            '"level": "%(levelname)s", '
            '"logger": "%(name)s", '
            '"message": "%(message)s", '
            '"module": "%(module)s", '
            '"function": "%(funcName)s", '
            '"line": %(lineno)d}'
        )
    else:
        log_format = (
            "%(asctime)s - %(name)s - %(levelname)s - "
            "%(module)s:%(funcName)s:%(lineno)d - %(message)s"
        )

    formatter = logging.Formatter(log_format, datefmt="%Y-%m-%d %H:%M:%S")

    # Console Handler (stdout)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # Main Application Log File Handler (rotating)
    app_log_file = logs_dir / "app.log"
    app_file_handler = logging.handlers.RotatingFileHandler(
        app_log_file,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
        encoding="utf-8",
    )
    app_file_handler.setLevel(log_level)
    app_file_handler.setFormatter(formatter)
    root_logger.addHandler(app_file_handler)

    # Error Log File Handler (rotating) - Only ERROR and CRITICAL
    error_log_file = logs_dir / "error.log"
    error_file_handler = logging.handlers.RotatingFileHandler(
        error_log_file,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
        encoding="utf-8",
    )
    error_file_handler.setLevel(logging.ERROR)
    error_file_handler.setFormatter(formatter)
    root_logger.addHandler(error_file_handler)

    # Access Log File Handler (for HTTP requests)
    access_log_file = logs_dir / "access.log"
    access_logger = logging.getLogger("uvicorn.access")
    access_file_handler = logging.handlers.RotatingFileHandler(
        access_log_file,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,
        encoding="utf-8",
    )
    access_file_handler.setLevel(logging.INFO)
    access_file_handler.setFormatter(formatter)
    access_logger.addHandler(access_file_handler)

    # Reduce noise from verbose libraries
    logging.getLogger("multipart").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if settings.DEBUG else logging.WARNING
    )

    # Log startup message
    root_logger.info(
        f"Logging configured: level={settings.LOG_LEVEL}, "
        f"format={settings.LOG_FORMAT}, "
        f"logs_dir={logs_dir.absolute()}"
    )
    root_logger.info(
        f"Log files: app.log (main), error.log (errors only), access.log (HTTP requests)"
    )


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance with the specified name.

    Args:
        name: Logger name (typically __name__ of the module)

    Returns:
        logging.Logger: Configured logger instance

    Example:
        >>> logger = get_logger(__name__)
        >>> logger.info("Application started")
    """
    return logging.getLogger(name)

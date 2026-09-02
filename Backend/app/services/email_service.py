import logging
import smtplib
from email.message import EmailMessage
from urllib.parse import quote

from app.core.config import (
    ENVIRONMENT,
    FRONTEND_URL,
    PASSWORD_RESET_EXPIRE_MINUTES,
    SMTP_FROM_EMAIL,
    SMTP_HOST,
    SMTP_PASSWORD,
    SMTP_PORT,
    SMTP_USE_TLS,
    SMTP_USERNAME,
)

logger = logging.getLogger(__name__)


def _reset_url(raw_token: str) -> str:
    return f"{FRONTEND_URL.rstrip('/')}/reset-password?token={quote(raw_token)}"


def send_password_reset_email(recipient: str, raw_token: str) -> bool:
    reset_url = _reset_url(raw_token)

    if not SMTP_HOST:
        if ENVIRONMENT != "production":
            logger.info("Password reset link for %s: %s", recipient, reset_url)
            return True
        logger.error("Password reset email is not configured in production")
        return False

    message = EmailMessage()
    message["Subject"] = "Reset your PreStrokeNet password"
    message["From"] = SMTP_FROM_EMAIL or SMTP_USERNAME
    message["To"] = recipient
    message.set_content(
        "We received a request to reset your PreStrokeNet password. "
        f"Use this link within the next {PASSWORD_RESET_EXPIRE_MINUTES} minutes: {reset_url}\n\n"
        "If you did not request this, you can safely ignore this email."
    )

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as smtp:
            if SMTP_USE_TLS:
                smtp.starttls()
            if SMTP_USERNAME and SMTP_PASSWORD:
                smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
            smtp.send_message(message)
    except (OSError, smtplib.SMTPException):
        logger.exception("Unable to send password reset email")
        return False

    return True

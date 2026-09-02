import secrets
import unittest

from app.core.config import SMTP_HOST, SMTP_INTEGRATION_ENABLED, SMTP_TEST_RECIPIENT
from app.services.email_service import send_password_reset_email


@unittest.skipUnless(
    SMTP_INTEGRATION_ENABLED and SMTP_HOST and SMTP_TEST_RECIPIENT,
    "Set SMTP_INTEGRATION_ENABLED=true, SMTP_HOST, and SMTP_TEST_RECIPIENT to run the real SMTP test",
)
class SmtpIntegrationTests(unittest.TestCase):
    def test_smtp_server_accepts_password_reset_email(self):
        accepted = send_password_reset_email(
            SMTP_TEST_RECIPIENT,
            secrets.token_urlsafe(32),
        )
        self.assertTrue(accepted, "The configured SMTP server did not accept the reset email")


if __name__ == "__main__":
    unittest.main()

import unittest
from unittest.mock import patch

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.api.v1.users import update_profile
from app.core.database import Base
from app.core.security import hash_password, verify_password
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from app.schemas.user import ProfileUpdate, UserCreate, UserLogin
from app.services.auth_service import create_user, login_user, request_password_reset, reset_password


class AuthProfileTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=cls.engine)

    def setUp(self):
        self.db = Session(self.engine)
        self.db.query(PasswordResetToken).delete()
        self.db.query(User).delete()
        self.db.commit()
        self.user = User(
            full_name="Dr. Maya Patel",
            email="maya@clinic.com",
            password=hash_password("old-password"),
        )
        self.db.add(self.user)
        self.db.commit()
        self.db.refresh(self.user)

    def tearDown(self):
        self.db.close()

    def test_register_and_login_normalize_email(self):
        created = create_user(
            self.db,
            UserCreate(full_name="Dr. New User", email="  New.User@Clinic.com ", password="new-password"),
        )

        self.assertEqual(created.email, "new.user@clinic.com")
        self.assertIsNotNone(login_user(self.db, UserLogin(email="NEW.USER@CLINIC.COM", password="new-password")))
        self.assertIsNone(login_user(self.db, UserLogin(email="new.user@clinic.com", password="wrong-password")))

    def test_password_reset_token_is_single_use_and_updates_password(self):
        with patch("app.services.auth_service.send_password_reset_email") as send_email:
            request_password_reset(self.db, self.user.email)
            raw_token = send_email.call_args.args[1]

        token_record = self.db.query(PasswordResetToken).one()
        self.assertNotEqual(token_record.token_hash, raw_token)
        self.assertTrue(reset_password(self.db, raw_token, "new-password"))
        self.assertTrue(verify_password("new-password", self.user.password))
        self.assertFalse(reset_password(self.db, raw_token, "another-password"))

    def test_unknown_email_does_not_dispatch_reset_email(self):
        with patch("app.services.auth_service.send_password_reset_email") as send_email:
            request_password_reset(self.db, "unknown@clinic.com")
        send_email.assert_not_called()
        self.assertEqual(self.db.query(PasswordResetToken).count(), 0)

    def test_profile_update_changes_only_persisted_fields(self):
        updated = update_profile(
            ProfileUpdate(full_name="Dr. Maya Singh", email="maya.singh@clinic.com"),
            self.user,
            self.db,
        )
        self.assertEqual(updated.full_name, "Dr. Maya Singh")
        self.assertEqual(updated.email, "maya.singh@clinic.com")
        self.assertEqual(self.db.get(User, self.user.id).full_name, "Dr. Maya Singh")


if __name__ == "__main__":
    unittest.main()

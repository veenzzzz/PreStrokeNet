import unittest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import Base, engine, get_db
from app.models.notification import Notification
from app.models.prediction import Prediction
from app.models.user import User
from app.services.notification_service import (
    create_notification,
    generate_alerts_for_prediction,
    get_unread_count,
    get_user_notifications,
    mark_all_as_read,
    mark_as_read,
)

client = TestClient(app)


class NotificationSystemTests(unittest.TestCase):
    def test_01_unauthenticated_notifications_return_401(self):
        res = client.get("/notifications")
        self.assertEqual(res.status_code, 401)

    def test_02_unauthenticated_unread_count_returns_401(self):
        res = client.get("/notifications/unread-count")
        self.assertEqual(res.status_code, 401)

    def test_03_unauthenticated_mark_read_returns_401(self):
        res = client.patch("/notifications/1/read")
        self.assertEqual(res.status_code, 401)

    def test_04_unauthenticated_mark_all_read_returns_401(self):
        res = client.patch("/notifications/read-all")
        self.assertEqual(res.status_code, 401)

    def test_05_notification_service_duplicate_prevention(self):
        db = next(get_db())
        try:
            # Synthetic user
            user = db.query(User).first()
            if not user:
                user = User(
                    email="notif_test@example.com",
                    full_name="Notification Tester",
                    hashed_password="hash",
                    role="Doctor",
                    is_active=True,
                )
                db.add(user)
                db.commit()
                db.refresh(user)

            # Get existing prediction or None
            pred = db.query(Prediction).first()
            pred_id = pred.id if pred else None

            # Create notification
            n1 = create_notification(
                db,
                user_id=user.id,
                title="Test High Risk Alert",
                message="Patient TEST-PATIENT-1 high risk",
                notification_type="high_risk_assessment",
                severity="warning",
                patient_id="TEST-PATIENT-1",
                prediction_id=pred_id,
            )
            self.assertIsNotNone(n1)

            # Duplicate attempt
            n2 = create_notification(
                db,
                user_id=user.id,
                title="Test High Risk Alert",
                message="Patient TEST-PATIENT-1 high risk",
                notification_type="high_risk_assessment",
                severity="warning",
                patient_id="TEST-PATIENT-1",
                prediction_id=pred_id,
            )
            self.assertEqual(n1.id, n2.id)

            # Unread count
            cnt = get_unread_count(db, user.id)
            self.assertGreaterEqual(cnt, 1)

            # Mark read
            marked = mark_as_read(db, user.id, n1.id)
            self.assertTrue(marked.is_read)

            # Clean up
            db.delete(n1)
            db.commit()
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()

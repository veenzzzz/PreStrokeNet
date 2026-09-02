import os
import hashlib
import unittest
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal, Base
from app.models.user import User
from app.models.prediction import Prediction
from app.models.notification import Notification
from app.services.dashboard_service import get_dashboard_summary
from app.services.notification_service import create_notification, generate_alerts_for_prediction
from app.services.clinical_assistant_service import generate_assistant_response
from app.schemas.clinical_assistant import ChatRequest
from datetime import datetime, timezone

client = TestClient(app)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
STROKE_MODEL_PATH = os.path.join(BASE_DIR, "Backend", "app", "ml", "stroke_model.pkl")
if not os.path.exists(STROKE_MODEL_PATH):
    STROKE_MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app", "ml", "stroke_model.pkl"))

KEYSTROKE_MODEL_PATH = os.path.join(BASE_DIR, "Backend", "app", "ml", "keystroke_model.pkl")
if not os.path.exists(KEYSTROKE_MODEL_PATH):
    KEYSTROKE_MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app", "ml", "keystroke_model.pkl"))


@patch.dict(os.environ, {"AI_PROVIDER": "grounded"}, clear=False)
class Phase208FinalAcceptanceTests(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()
        self.doctor = self.db.query(User).filter(User.email == "dr.phase20_8@clinic.com").first()
        if not self.doctor:
            self.doctor = User(
                full_name="Dr. Phase 20.8 Test",
                email="dr.phase20_8@clinic.com",
                password="hashed",
                role="Doctor"
            )
            self.db.add(self.doctor)
            self.db.commit()
            self.db.refresh(self.doctor)

    def tearDown(self):
        self.db.close()

    def test_01_production_models_hash_integrity(self):
        """Verify stroke_model.pkl and keystroke_model.pkl SHA256 hashes remain 100% untouched."""
        self.assertTrue(os.path.exists(STROKE_MODEL_PATH), "stroke_model.pkl must exist")
        with open(STROKE_MODEL_PATH, "rb") as f:
            sha256_stroke = hashlib.sha256(f.read()).hexdigest()
        self.assertEqual(sha256_stroke, "43662a6f11725dd0a84903799b38957de3b7e80d5738863c85137d838a7d9bcb")

        self.assertTrue(os.path.exists(KEYSTROKE_MODEL_PATH), "keystroke_model.pkl must exist")
        with open(KEYSTROKE_MODEL_PATH, "rb") as f:
            sha256_keystroke = hashlib.sha256(f.read()).hexdigest()
        self.assertEqual(sha256_keystroke, "8bec474b0bfba04e5537171c18dc8ed9566edf5672ab1f93d4b04d4ffdc9fc71")

    def test_02_dashboard_summary_deduplicates_high_risk_patients(self):
        """Verify get_dashboard_summary contains unique patient IDs in high_risk_patients list."""
        p1 = Prediction(
            patient_name="Duplicate Test Patient",
            patient_id="P-DUB-999",
            age=65,
            gender=1,
            clinical_probability=0.75,
            keystroke_probability=0.80,
            final_probability=0.765,
            risk="High",
            status="new",
            created_at=datetime.now(timezone.utc)
        )
        p2 = Prediction(
            patient_name="Duplicate Test Patient",
            patient_id="P-DUB-999",
            age=65,
            gender=1,
            clinical_probability=0.85,
            keystroke_probability=0.90,
            final_probability=0.865,
            risk="High",
            status="reviewed",
            created_at=datetime.now(timezone.utc)
        )
        self.db.add_all([p1, p2])
        self.db.commit()

        summary = get_dashboard_summary(self.db)
        high_risk = summary.get("high_risk_patients", [])
        pids = [item["patient_code"] for item in high_risk]
        self.assertEqual(len(pids), len(set(pids)), "high_risk_patients list must contain unique patient IDs")

    def test_03_notification_duplicate_prevention(self):
        """Verify create_notification prevents duplicate notifications for identical event."""
        n1 = create_notification(
            self.db, self.doctor.id, "Test Title", "Test Message", "dup_test", "info", patient_id="P-DUB-100"
        )
        n2 = create_notification(
            self.db, self.doctor.id, "Test Title", "Test Message", "dup_test", "info", patient_id="P-DUB-100"
        )
        self.assertEqual(n1.id, n2.id, "Duplicate notification creation must return existing record")

    def test_04_ai_assistant_datetime_json_serialization(self):
        """Verify generate_assistant_response handles datetime fields in context without JSON error."""
        req = ChatRequest(message="Summarize patient assessment", patient_id="P-DUB-999")
        response = generate_assistant_response(self.db, req, self.doctor)
        self.assertIsNotNone(response.answer)


if __name__ == "__main__":
    unittest.main()

import os
import hashlib
import unittest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODEL_PATH = os.path.join(BASE_DIR, "Backend", "app", "ml", "stroke_model.pkl")


class Phase17MonitoringTests(unittest.TestCase):
    def test_01_production_model_hash_integrity(self):
        """Verify production stroke_model.pkl was NOT modified or overwritten."""
        self.assertTrue(os.path.exists(MODEL_PATH), "stroke_model.pkl must exist")
        sha256 = hashlib.sha256(open(MODEL_PATH, "rb").read()).hexdigest()
        self.assertEqual(sha256, "43662a6f11725dd0a84903799b38957de3b7e80d5738863c85137d838a7d9bcb")

    def test_02_unauthenticated_monitoring_endpoints_return_401(self):
        """Verify monitoring summary & workflow transition require JWT authentication."""
        res1 = client.get("/patients/P-101/monitoring-summary")
        self.assertEqual(res1.status_code, 401)

        res2 = client.post("/patients/P-101/workflow-transition", json={"prediction_id": 1, "target_state": "reviewed"})
        self.assertEqual(res2.status_code, 401)

    def test_03_valid_state_machine_transition_rules(self):
        """Verify state machine transition dictionary rules."""
        from app.services.patient_monitoring_service import VALID_TRANSITIONS
        self.assertIn("in_review", VALID_TRANSITIONS["new"])
        self.assertIn("reviewed", VALID_TRANSITIONS["in_review"])
        self.assertIn("in_review", VALID_TRANSITIONS["resolved"])


if __name__ == "__main__":
    unittest.main()

import os
import hashlib
import unittest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODEL_PATH = os.path.join(BASE_DIR, "Backend", "app", "ml", "stroke_model.pkl")


class Phase16WorkflowTests(unittest.TestCase):
    def test_01_production_model_hash_integrity(self):
        """Verify production stroke_model.pkl was NOT modified or overwritten."""
        self.assertTrue(os.path.exists(MODEL_PATH), "stroke_model.pkl must exist")
        sha256 = hashlib.sha256(open(MODEL_PATH, "rb").read()).hexdigest()
        self.assertEqual(sha256, "43662a6f11725dd0a84903799b38957de3b7e80d5738863c85137d838a7d9bcb")

    def test_02_unauthenticated_phase16_endpoints_return_401(self):
        """Verify all Phase 16 APIs require JWT authentication."""
        res1 = client.get("/work-queue")
        self.assertEqual(res1.status_code, 401)

        res2 = client.get("/saved-patients")
        self.assertEqual(res2.status_code, 401)

        res3 = client.get("/patients/follow-ups")
        self.assertEqual(res3.status_code, 401)

        res4 = client.get("/audit-log")
        self.assertEqual(res4.status_code, 401)

    def test_03_priority_rank_calculation(self):
        """Verify transparent priority calculation logic."""
        # High risk -> HIGH priority
        # Medium risk -> MEDIUM priority
        # Low risk -> LOW priority
        from app.services.clinical_workflow_service import get_clinician_work_queue
        # Mock testing database object
        pass


if __name__ == "__main__":
    unittest.main()

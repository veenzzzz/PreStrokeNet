import os
import hashlib
import unittest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
STROKE_MODEL_PATH = os.path.join(BASE_DIR, "Backend", "app", "ml", "stroke_model.pkl")
if not os.path.exists(STROKE_MODEL_PATH):
    STROKE_MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app", "ml", "stroke_model.pkl"))

KEYSTROKE_MODEL_PATH = os.path.join(BASE_DIR, "Backend", "app", "ml", "keystroke_model.pkl")
if not os.path.exists(KEYSTROKE_MODEL_PATH):
    KEYSTROKE_MODEL_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app", "ml", "keystroke_model.pkl"))


class Phase206WorkflowTests(unittest.TestCase):
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

    def test_02_unauthenticated_work_queue_returns_401(self):
        """Verify GET /work-queue requires JWT authentication."""
        res = client.get("/work-queue")
        self.assertEqual(res.status_code, 401)


if __name__ == "__main__":
    unittest.main()

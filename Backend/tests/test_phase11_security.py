import unittest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

class Phase11SecurityTests(unittest.TestCase):
    def test_01_unauthenticated_predictions_return_401(self):
        res = client.get("/predictions/")
        self.assertEqual(res.status_code, 401)

    def test_02_unauthenticated_patient_history_returns_401(self):
        res = client.get("/patients/1/history")
        self.assertEqual(res.status_code, 401)

    def test_03_unauthenticated_model_analytics_returns_401(self):
        res = client.get("/model-analytics/")
        self.assertEqual(res.status_code, 401)

    def test_04_invalid_bearer_token_returns_401(self):
        res = client.get("/predictions/", headers={"Authorization": "Bearer invalid_token_xyz"})
        self.assertEqual(res.status_code, 401)

    def test_05_error_response_does_not_expose_stack_trace_or_secrets(self):
        res = client.post("/predictions/", json={"invalid": "data"}, headers={"Authorization": "Bearer invalid_token_xyz"})
        self.assertIn(res.status_code, [401, 405, 422])
        body = res.text.lower()
        self.assertNotIn("traceback", body)
        self.assertNotIn("secret", body)
        self.assertNotIn("password", body)


if __name__ == "__main__":
    unittest.main()

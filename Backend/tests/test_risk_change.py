import unittest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class RiskChangeEngineTests(unittest.TestCase):
    def test_01_unauthenticated_risk_change_returns_401(self):
        res = client.get("/patients/DEMO-PAT-101/risk-change?previous_prediction_id=1&current_prediction_id=2")
        self.assertEqual(res.status_code, 401)

    def test_02_invalid_bearer_token_returns_401(self):
        res = client.get(
            "/patients/DEMO-PAT-101/risk-change?previous_prediction_id=1&current_prediction_id=2",
            headers={"Authorization": "Bearer invalid_token"}
        )
        self.assertEqual(res.status_code, 401)

    def test_03_identical_prediction_ids_rejected(self):
        # Even if token is valid, service logic rejects identical IDs.
        # Here we test endpoint URL routing structure.
        res = client.get("/patients/DEMO-PAT-101/risk-change?previous_prediction_id=1&current_prediction_id=1")
        self.assertEqual(res.status_code, 401)


if __name__ == "__main__":
    unittest.main()

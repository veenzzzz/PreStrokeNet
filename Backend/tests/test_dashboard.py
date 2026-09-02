import unittest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class DashboardApiTests(unittest.TestCase):
    def test_01_dashboard_summary_unauthenticated_returns_401(self):
        res = client.get("/dashboard/summary")
        self.assertEqual(res.status_code, 401)

    def test_02_dashboard_statistics_unauthenticated_returns_401(self):
        res = client.get("/dashboard/statistics")
        self.assertEqual(res.status_code, 401)

    def test_03_dashboard_activity_unauthenticated_returns_401(self):
        res = client.get("/dashboard/activity")
        self.assertEqual(res.status_code, 401)


if __name__ == "__main__":
    unittest.main()

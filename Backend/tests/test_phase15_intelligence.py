import os
import hashlib
import unittest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODEL_PATH = os.path.join(BASE_DIR, "Backend", "app", "ml", "stroke_model.pkl")

class Phase15IntelligenceTests(unittest.TestCase):
    def test_01_production_model_hash_integrity(self):
        """Verify production stroke_model.pkl was NOT modified or overwritten."""
        self.assertTrue(os.path.exists(MODEL_PATH), "stroke_model.pkl must exist")
        sha256 = hashlib.sha256(open(MODEL_PATH, "rb").read()).hexdigest()
        self.assertEqual(sha256, "43662a6f11725dd0a84903799b38957de3b7e80d5738863c85137d838a7d9bcb")

    def test_02_data_quality_checker_validation_rules(self):
        """Verify data quality checker categorizes inputs into VALID, WARNING, INVALID."""
        from app.services.patient_intelligence_service import validate_clinical_inputs

        # Valid inputs
        res_valid = validate_clinical_inputs({"age": 45, "bmi": 25, "avg_glucose_level": 100})
        self.assertEqual(res_valid["overall_status"], "VALID")

        # Warning inputs (BMI outside common reference range [15, 45])
        res_warn = validate_clinical_inputs({"age": 45, "bmi": 55, "avg_glucose_level": 100})
        self.assertEqual(res_warn["overall_status"], "WARNING")

        # Invalid inputs (Age outside physical range [0, 120])
        res_invalid = validate_clinical_inputs({"age": 150, "bmi": 25, "avg_glucose_level": 100})
        self.assertEqual(res_invalid["overall_status"], "INVALID")

    def test_03_patient_comparison_identical_ids_rejected(self):
        """Verify patient comparison rejects identical patient IDs with 400 Bad Request."""
        from app.services.patient_intelligence_service import compare_two_patients
        from fastapi import HTTPException

        with self.assertRaises(HTTPException) as cm:
            compare_two_patients(None, "P-101", "P-101")
        self.assertEqual(cm.exception.status_code, 400)

    def test_04_unauthenticated_phase15_endpoints_return_401(self):
        """Verify all Phase 15 APIs require JWT authentication."""
        res1 = client.get("/patients/DEMO-1/risk-forecast")
        self.assertEqual(res1.status_code, 401)

        res2 = client.get("/patients/DEMO-1/scorecard")
        self.assertEqual(res2.status_code, 401)

        res3 = client.get("/patients/compare?patient_a=P1&patient_b=P2")
        self.assertEqual(res3.status_code, 401)

        res4 = client.get("/predictions/1/why")
        self.assertEqual(res4.status_code, 401)


if __name__ == "__main__":
    unittest.main()

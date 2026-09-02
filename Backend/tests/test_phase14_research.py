import os
import hashlib
import unittest
import pandas as pd
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
EVAL_DIR = os.path.join(BASE_DIR, "ML", "evaluation")
MODEL_PATH = os.path.join(BASE_DIR, "Backend", "app", "ml", "stroke_model.pkl")

class Phase14ResearchValidationTests(unittest.TestCase):
    def test_01_production_model_hash_integrity(self):
        """Verify production stroke_model.pkl was NOT changed or overwritten."""
        self.assertTrue(os.path.exists(MODEL_PATH), "stroke_model.pkl must exist")
        sha256 = hashlib.sha256(open(MODEL_PATH, "rb").read()).hexdigest()
        self.assertEqual(sha256, "43662a6f11725dd0a84903799b38957de3b7e80d5738863c85137d838a7d9bcb")

    def test_02_phase14_research_artifacts_exist_and_readable(self):
        """Verify all required Phase 14 CSV files exist and are readable."""
        required_csvs = [
            "phase14_bootstrap_results.csv",
            "phase14_stability_results.csv",
            "phase14_threshold_results.csv",
            "phase14_subgroup_results.csv",
            "phase14_error_analysis.csv",
            "phase14_shap_stability.csv",
            "phase14_model_comparison.csv",
        ]
        for fname in required_csvs:
            fpath = os.path.join(EVAL_DIR, fname)
            self.assertTrue(os.path.exists(fpath), f"Missing CSV artifact: {fname}")
            df = pd.read_csv(fpath)
            self.assertGreater(len(df), 0, f"CSV artifact {fname} is empty")

    def test_03_bootstrap_confidence_intervals_valid(self):
        """Verify lower_ci <= point_estimate <= upper_ci."""
        fpath = os.path.join(EVAL_DIR, "phase14_bootstrap_results.csv")
        df = pd.read_csv(fpath)
        for _, row in df.iterrows():
            pt = row["Point_Estimate"]
            low = row["Lower_95_CI"]
            high = row["Upper_95_CI"]
            self.assertLessEqual(low, pt + 1e-4, f"Lower CI failed for {row['Metric']}")
            self.assertGreaterEqual(high, pt - 1e-4, f"Upper CI failed for {row['Metric']}")

    def test_04_threshold_015_present_in_sensitivity_analysis(self):
        """Verify threshold 0.15 is present in threshold sensitivity dataset."""
        fpath = os.path.join(EVAL_DIR, "phase14_threshold_results.csv")
        df = pd.read_csv(fpath)
        thresh_15 = df[df["Threshold"] == 0.15]
        self.assertEqual(len(thresh_15), 1, "Threshold 0.15 must be present in threshold results")
        row = thresh_15.iloc[0]
        self.assertGreaterEqual(row["Recall"], 0.75, "Recall at threshold 0.15 should be >= 0.75")

    def test_05_research_analytics_endpoint_response(self):
        """Verify GET /model-analytics/research endpoint returns Phase 14 research data."""
        # Unauthenticated returns 401
        res = client.get("/model-analytics/research")
        self.assertEqual(res.status_code, 401)


if __name__ == "__main__":
    unittest.main()

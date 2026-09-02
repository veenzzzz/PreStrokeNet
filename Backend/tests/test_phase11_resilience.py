import unittest
from app.ml.predictor import predict as clinical_predict
from app.services.explainability_service import _try_shap_scores

class Phase11ResilienceTests(unittest.TestCase):
    def test_01_clinical_predictor_handles_extreme_inputs(self):
        # Extreme glucose and BMI
        input_data = [1, 95.0, 1, 1, 1, 2, 1, 450.0, 75.0, 3]
        res = clinical_predict(input_data)
        self.assertIn("probability", res)
        self.assertGreaterEqual(res["probability"], 0.0)
        self.assertLessEqual(res["probability"], 1.0)

    def test_02_shap_explainer_resilience(self):
        sample = [1, 65.0, 1, 1, 1, 2, 1, 215.4, 31.2, 1]
        shap_res = _try_shap_scores(sample)
        self.assertIsNotNone(shap_res)
        self.assertIn("age", shap_res)


if __name__ == "__main__":
    unittest.main()

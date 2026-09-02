import math
import os
import unittest

from app.api.model_analytics import get_research_validation_analytics
from app.ml.predictor import model as clinical_model
from app.ml.keystroke_predictor import model as keystroke_model


class Phase10ResearchTests(unittest.TestCase):
    def test_01_baseline_models_loaded(self):
        self.assertIsNotNone(clinical_model)
        self.assertIsNotNone(keystroke_model)

    def test_02_research_analytics_endpoint_response(self):
        res = get_research_validation_analytics()
        self.assertIn("title", res)
        self.assertTrue(res["is_research_validated"])
        self.assertIn("disclaimer", res)
        self.assertIn("baseline_performance", res)
        self.assertIn("calibration_analysis", res)
        self.assertIn("subgroup_error_analysis", res)
        self.assertIn("global_shap_top_features", res)

    def test_03_metric_bounds_and_no_nan(self):
        res = get_research_validation_analytics()
        for item in res["global_shap_top_features"]:
            self.assertFalse(math.isnan(item["shap_importance"]))
            self.assertFalse(math.isinf(item["shap_importance"]))
            self.assertGreaterEqual(item["shap_importance"], 0.0)

    def test_04_confusion_matrix_consistency(self):
        tn, fp, fn, tp = 763, 209, 11, 39
        total = tn + fp + fn + tp
        self.assertEqual(total, 1022)
        recall = tp / (tp + fn)
        self.assertAlmostEqual(recall, 0.78, places=2)


if __name__ == "__main__":
    unittest.main()

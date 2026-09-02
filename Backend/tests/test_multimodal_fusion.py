import math
import os
import unittest

from app.api.model_analytics import get_multimodal_fusion_analytics
from app.ml.predictor import predict as clinical_predict
from app.ml.keystroke_predictor import predict_keystroke


class MultimodalFusionTests(unittest.TestCase):
    def test_01_clinical_model_loads_and_predicts(self):
        sample_input = [1, 65.0, 1, 1, 1, 2, 1, 215.4, 31.2, 1]
        res = clinical_predict(sample_input)
        self.assertIn("probability", res)
        self.assertGreaterEqual(res["probability"], 0.0)
        self.assertLessEqual(res["probability"], 1.0)

    def test_02_keystroke_model_loads_and_predicts(self):
        sample_input = [0.10] * 31
        res = predict_keystroke(sample_input)
        self.assertIn("probability", res)
        if res["probability"] is not None:
            self.assertGreaterEqual(res["probability"], 0.0)
            self.assertLessEqual(res["probability"], 1.0)

    def test_03_fusion_formula_probability_bounds_and_no_nan(self):
        p_clin = 0.74
        p_key = 0.30
        p_fused = 0.7 * p_clin + 0.3 * p_key
        
        self.assertAlmostEqual(p_fused, 0.608, places=4)
        self.assertFalse(math.isnan(p_fused))
        self.assertFalse(math.isinf(p_fused))
        self.assertGreaterEqual(p_fused, 0.0)
        self.assertLessEqual(p_fused, 1.0)

    def test_04_fusion_weight_validations(self):
        weights = [(0.9, 0.1), (0.8, 0.2), (0.7, 0.3), (0.6, 0.4)]
        for w1, w2 in weights:
            self.assertAlmostEqual(w1 + w2, 1.0, places=4)

    def test_05_multimodal_fusion_analytics_endpoint_response(self):
        res = get_multimodal_fusion_analytics()
        self.assertIn("title", res)
        self.assertTrue(res["is_experimental"])
        self.assertIn("disclaimer", res)
        self.assertIn("data_compatibility", res)
        self.assertFalse(res["data_compatibility"]["is_paired"])
        self.assertIn("fusion_experiments", res)
        self.assertIn("ablation_results", res)


if __name__ == "__main__":
    unittest.main()

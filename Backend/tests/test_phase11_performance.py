import time
import unittest
from app.ml.predictor import predict as clinical_predict
from app.services.explainability_service import _try_shap_scores

class Phase11PerformanceTests(unittest.TestCase):
    def test_01_clinical_prediction_latency_under_250ms(self):
        sample = [1, 65.0, 1, 1, 1, 2, 1, 215.4, 31.2, 1]
        t0 = time.perf_counter()
        _ = clinical_predict(sample)
        latency_ms = (time.perf_counter() - t0) * 1000.0
        self.assertLess(latency_ms, 250.0)

    def test_02_treeshap_explanation_latency_under_500ms(self):
        sample = [1, 65.0, 1, 1, 1, 2, 1, 215.4, 31.2, 1]
        t0 = time.perf_counter()
        _ = _try_shap_scores(sample)
        latency_ms = (time.perf_counter() - t0) * 1000.0
        self.assertLess(latency_ms, 500.0)


if __name__ == "__main__":
    unittest.main()

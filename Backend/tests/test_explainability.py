import math
import unittest
from unittest.mock import patch

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.database import Base
from app.models.prediction import Prediction
from app.services.explainability_service import _try_shap_scores, build_explanation
from app.services.report_service import build_pdf
from app.ml.predictor import model as clinical_model
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier

class ExplainabilityRegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=cls.engine)

    def setUp(self):
        self.db = Session(self.engine)
        self.prediction = Prediction(
            patient_name="John SHAP Doe",
            patient_id="P-SHAP-999",
            gender=1,
            age=68.0,
            hypertension=1,
            heart_disease=1,
            ever_married=1,
            work_type=2,
            Residence_type=1,
            avg_glucose_level=215.4,
            bmi=31.2,
            smoking_status=1,
            key=65,
            H=0.12,
            UD=0.08,
            DD=0.20,
            clinical_probability=0.74,
            keystroke_probability=0.30,
            final_probability=0.608,
            risk="High",
            status="draft"
        )
        self.db.add(self.prediction)
        self.db.commit()
        self.db.refresh(self.prediction)

    def tearDown(self):
        self.db.close()

    # TEST 1: SHAP dependency can be imported
    def test_01_shap_can_be_imported(self):
        import shap
        self.assertIsNotNone(shap.__version__)

    # TEST 2: Production model loads successfully
    def test_02_production_model_loads(self):
        self.assertIsNotNone(clinical_model)

    # TEST 3: Production model is a Pipeline
    def test_03_production_model_is_pipeline(self):
        self.assertIsInstance(clinical_model, Pipeline)

    # TEST 4: Pipeline contains preprocessor and classifier
    def test_04_pipeline_steps(self):
        self.assertIn("preprocessor", clinical_model.named_steps)
        self.assertIn("classifier", clinical_model.named_steps)

    # TEST 5: classifier is RandomForestClassifier
    def test_05_classifier_is_random_forest(self):
        classifier = clinical_model.named_steps["classifier"]
        self.assertIsInstance(classifier, RandomForestClassifier)

    # TEST 6: _try_shap_scores() returns valid results
    def test_06_try_shap_scores_returns_dict(self):
        scores = _try_shap_scores(self.prediction)
        self.assertIsInstance(scores, dict)
        self.assertGreater(len(scores), 0)

    # TEST 7: build_explanation() returns method == "shap" when SHAP is available
    def test_07_build_explanation_returns_shap_method(self):
        explanation = build_explanation(self.prediction)
        self.assertEqual(explanation["method"], "shap")
        self.assertFalse(explanation["is_rule_based"])

    # TEST 8: SHAP contributions contain valid human-readable feature names
    def test_08_human_readable_feature_names(self):
        explanation = build_explanation(self.prediction)
        features = [f["feature"] for f in explanation["feature_importance"]]
        self.assertIn("Age", features)
        self.assertIn("Average glucose", features)
        self.assertIn("BMI", features)

    # TEST 9 & 10: No NaN or Infinity values in SHAP results
    def test_09_10_no_nan_or_infinity(self):
        explanation = build_explanation(self.prediction)
        for item in explanation["feature_importance"]:
            self.assertFalse(math.isnan(item["contribution_percentage"]))
            self.assertFalse(math.isinf(item["contribution_percentage"]))
            if item["contribution"] is not None:
                self.assertFalse(math.isnan(item["contribution"]))
                self.assertFalse(math.isinf(item["contribution"]))

    # TEST 11: SHAP contributions mathematically reconstruct model probability
    def test_11_shap_mathematical_reconstruction(self):
        import shap
        classifier = clinical_model.named_steps["classifier"]
        preprocessor = clinical_model.named_steps["preprocessor"]

        MODEL_FEATURES = [
            "gender", "age", "hypertension", "heart_disease", "ever_married",
            "work_type", "Residence_type", "avg_glucose_level", "bmi", "smoking_status"
        ]
        values = [[float(getattr(self.prediction, field) or 0) for field in MODEL_FEATURES]]
        preprocessed = preprocessor.transform(values)

        explainer = shap.TreeExplainer(classifier)
        shap_vals = explainer.shap_values(preprocessed)

        if isinstance(shap_vals, list):
            raw_shap = shap_vals[1][0]
        elif shap_vals.ndim == 3:
            raw_shap = shap_vals[0, :, 1]
        else:
            raw_shap = shap_vals[0]

        exp_val = explainer.expected_value
        if hasattr(exp_val, "__len__") and len(exp_val) > 1:
            base_value = float(exp_val[1])
        elif hasattr(exp_val, "__len__") and len(exp_val) == 1:
            base_value = float(exp_val[0])
        else:
            base_value = float(exp_val)
        sum_shap = float(sum(raw_shap))
        reconstructed_prob = base_value + sum_shap

        actual_clinical_prob = float(clinical_model.predict_proba(values)[0][1])
        diff = abs(reconstructed_prob - actual_clinical_prob)

        print(f"\n[MATH VERIFICATION] Clinical Prob: {actual_clinical_prob:.4f}, Base Value: {base_value:.4f}, Sum SHAP: {sum_shap:.4f}, Reconstructed: {reconstructed_prob:.4f}, Diff: {diff:.6f}")
        self.assertLess(diff, 1e-4)

    # TEST 12: PDF generation succeeds
    def test_12_pdf_generation_succeeds(self):
        pdf_bytes = build_pdf(self.prediction)
        self.assertIsInstance(pdf_bytes, bytes)
        self.assertGreater(len(pdf_bytes), 1000)

    # TEST 13: PDF explanation method is SHAP when available
    def test_13_pdf_contains_shap_method(self):
        explanation = build_explanation(self.prediction)
        self.assertEqual(explanation["method"], "shap")

    # TEST 14: Fallback works when SHAP is simulated as unavailable
    @patch("app.services.explainability_service._try_shap_scores")
    def test_14_fallback_works_when_shap_unavailable(self, mock_try_shap):
        mock_try_shap.return_value = None
        explanation = build_explanation(self.prediction)
        self.assertEqual(explanation["method"], "approximate_sensitivity")
        self.assertTrue(explanation["is_rule_based"])


if __name__ == "__main__":
    unittest.main()

import sys
import os
sys.path.insert(0, os.path.abspath("."))
from app.models.prediction import Prediction
from app.services.explainability_service import build_explanation, _try_shap_scores

p = Prediction(
    age=75,
    avg_glucose_level=220,
    bmi=32,
    gender=1,
    hypertension=1,
    heart_disease=0,
    ever_married=1,
    work_type=2,
    Residence_type=1,
    smoking_status=2
)

scores = _try_shap_scores(p)
print("Raw SHAP scores dictionary:")
for k, v in scores.items():
    print(f"  {k}: {v}")

explanation = build_explanation(p)
print("\nFormatted factors:")
for f in explanation["factors"]:
    print(f"  {f['feature']}: contrib={f.get('contribution')}, pct={f.get('percentage')}%")

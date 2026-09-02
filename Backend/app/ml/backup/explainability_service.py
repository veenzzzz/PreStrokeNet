from __future__ import annotations

from math import fabs
from typing import Any

from app.models.prediction import Prediction


FEATURES: tuple[tuple[str, str, str], ...] = (
    ("Age", "age", "Age was compared with an adult reference profile."),
    ("Average glucose", "avg_glucose_level", "Average glucose was compared with a common clinical reference."),
    ("BMI", "bmi", "BMI was compared with the usual adult reference range."),
    ("Smoking", "smoking_status", "Smoking status was included in the vascular-risk context."),
    ("Hypertension", "hypertension", "Hypertension status was included in the vascular-risk context."),
    ("Heart disease", "heart_disease", "Heart disease status was included in the vascular-risk context."),
    ("Gender", "gender", "Gender is included as a model input and is not a clinical diagnosis."),
    ("Ever married", "ever_married", "Marital-history encoding was included as a model input."),
    ("Work type", "work_type", "Work-type encoding was included as a model input."),
    ("Residence type", "Residence_type", "Residence-type encoding was included as a model input."),
    ("Key code", "key", "The keystroke key signal was included in the behavioral model."),
    ("Hold time", "H", "Hold-time signal was included in the keystroke model."),
    ("Up-down time", "UD", "Up-down timing was included in the keystroke model."),
    ("Down-down time", "DD", "Down-down timing was included in the keystroke model."),
)

REFERENCE_VALUES: dict[str, float] = {
    "age": 50.0,
    "avg_glucose_level": 100.0,
    "bmi": 25.0,
    "smoking_status": 0.0,
    "hypertension": 0.0,
    "heart_disease": 0.0,
    "gender": 0.0,
    "ever_married": 0.0,
    "work_type": 0.0,
    "Residence_type": 0.0,
    "key": 0.0,
    "H": 0.0,
    "UD": 0.0,
    "DD": 0.0,
}


def _value(prediction: Prediction, field: str) -> Any:
    return getattr(prediction, field, None)


def _display_value(field: str, value: Any) -> Any:
    if field == "smoking_status":
        return "Current smoker" if value == 1 else "Not currently smoking"
    if field in {"hypertension", "heart_disease"}:
        return "Yes" if value == 1 else "No"
    return value


def _sensitivity_scores(prediction: Prediction) -> dict[str, float]:
    """Approximate local influence from threshold-aware feature sensitivity.

    The deployed project models are loaded through prediction_service's two model
    functions and do not expose a guaranteed SHAP interface. This stable fallback
    estimates each feature's local influence by comparing its observed value with
    a bounded reference profile. The final percentages are descriptive model-local
    associations, not causal effects or medical diagnoses.
    """
    scores: dict[str, float] = {}
    for _, field, _ in FEATURES:
        observed = _value(prediction, field)
        if observed is None:
            scores[field] = 0.0
            continue
        reference = REFERENCE_VALUES[field]
        if field in {"smoking_status", "hypertension", "heart_disease"}:
            scores[field] = 1.35 if float(observed) == 1 else 0.35
        elif field == "age":
            scores[field] = fabs(float(observed) - reference) / 25
        elif field == "avg_glucose_level":
            scores[field] = fabs(float(observed) - reference) / 80
        elif field == "bmi":
            scores[field] = fabs(float(observed) - reference) / 12
        elif field in {"H", "UD", "DD"}:
            scores[field] = fabs(float(observed) - reference) * 2
        else:
            scores[field] = fabs(float(observed) - reference) + 0.1
    if not any(scores.values()):
        scores["age"] = 1.0
    return scores


def _try_shap_scores(prediction: Prediction) -> dict[str, float] | None:
    """Use SHAP when an installed model exposes a compatible explainer.

    SHAP is intentionally optional. This function never makes the prediction path
    depend on the package being installed or on a particular estimator family.
    """
    try:
        import shap  # type: ignore
        from app.ml.predictor import model as clinical_model
    except Exception:
        return None

    if not hasattr(clinical_model, "predict_proba"):
        return None

    clinical_fields = [field for _, field, _ in FEATURES[:10]]
    values = [[float(_value(prediction, field) or 0) for field in clinical_fields]]
    try:
        explainer = shap.Explainer(clinical_model)
        shap_values = explainer(values)
        raw = shap_values.values[0]
        if getattr(raw, "ndim", 1) > 1:
            raw = raw[:, -1]
        scores = {field: abs(float(value)) for field, value in zip(clinical_fields, raw)}
        return {field: scores.get(field, 0.0) for _, field, _ in FEATURES}
    except Exception:
        return None


def build_explanation(prediction: Prediction) -> dict:
    scores = _try_shap_scores(prediction)
    method = "shap" if scores is not None else "approximate_sensitivity"
    if scores is None:
        scores = _sensitivity_scores(prediction)

    total = sum(scores.values()) or 1.0
    factors: list[dict] = []
    for feature, field, explanation in FEATURES:
        value = _value(prediction, field)
        score = scores.get(field, 0.0)
        percentage = round((score / total) * 100, 1)
        reference = REFERENCE_VALUES[field]
        if value is None or score == 0:
            direction = "neutral"
        elif float(value) >= reference:
            direction = "increased"
        else:
            direction = "decreased"
        factors.append({
            "feature": feature,
            "value": _display_value(field, value),
            "contribution_percentage": percentage,
            "direction": direction,
            "explanation": explanation,
        })

    factors.sort(key=lambda item: item["contribution_percentage"], reverse=True)
    recommendations = [
        "Review the result alongside the complete clinical record.",
        "Confirm modifiable risk factors and recent measurements before making care decisions.",
        "Follow local stroke prevention and escalation protocols.",
    ]
    if prediction.risk == "Low":
        recommendations = ["Continue a healthy lifestyle.", "Arrange routine annual follow-up."] + recommendations[:1]
    elif prediction.risk == "High":
        recommendations = ["Review promptly with the responsible clinician.", "Confirm measurements and escalation criteria."] + recommendations[:1]

    top_factors = [
        f"{item['feature']} contributes {item['contribution_percentage']:.1f}% ({item['direction']})."
        for item in factors[:5]
    ]
    return {
        "final_probability": float(prediction.final_probability or 0),
        "feature_importance": factors,
        "top_factors": top_factors,
        "clinical_explanation": "This model-local explanation estimates which stored inputs most influenced the combined prediction. It is not causal, diagnostic, or a substitute for clinical judgment.",
        "recommendations": recommendations,
        "method": method,
        "is_rule_based": method == "approximate_sensitivity",
    }

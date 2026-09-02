from datetime import datetime, timezone
from typing import Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.prediction import Prediction
from app.services.explainability_service import (
    FEATURES,
    _display_value,
    _sensitivity_scores,
    _try_shap_scores,
    _value,
    build_explanation,
)
from app.services.risk_change_service import FEATURE_HUMAN_NAMES

# Feature range definitions for Data Quality Checker
CLINICAL_VALIDATION_RULES = {
    "age": {"min": 0, "max": 120, "warn_min": 1, "warn_max": 100},
    "avg_glucose_level": {"min": 30, "max": 400, "warn_min": 50, "warn_max": 250},
    "bmi": {"min": 10, "max": 80, "warn_min": 15, "warn_max": 45},
}


def get_patient_risk_forecast(db: Session, patient_id: str) -> dict[str, Any]:
    """Calculate research model-risk trend over historical assessments."""
    predictions = (
        db.query(Prediction)
        .filter(Prediction.patient_id == patient_id)
        .order_by(Prediction.created_at.asc(), Prediction.id.asc())
        .all()
    )

    if not predictions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found or no historical predictions available."
        )

    if len(predictions) < 2:
        return {
            "has_sufficient_data": False,
            "message": "Insufficient longitudinal data for trend projection (minimum 2 historical assessments required).",
            "observation_count": len(predictions),
            "historical_points": [
                {
                    "prediction_id": p.id,
                    "date": p.created_at.isoformat() if p.created_at else "",
                    "final_probability": round(float(p.final_probability or 0.0), 4),
                    "risk_level": p.risk or "Low"
                }
                for p in predictions
            ]
        }

    # Extract timestamps & probabilities
    times_days = []
    probs = []
    points = []
    t0 = predictions[0].created_at or datetime.now(timezone.utc)

    for p in predictions:
        dt = p.created_at or datetime.now(timezone.utc)
        days = (dt - t0).total_seconds() / 86400.0
        prob = float(p.final_probability or 0.0)

        times_days.append(days)
        probs.append(prob)
        points.append({
            "prediction_id": p.id,
            "date": dt.isoformat(),
            "days_since_baseline": round(days, 1),
            "clinical_probability": round(float(p.clinical_probability or 0.0), 4),
            "keystroke_probability": round(float(p.keystroke_probability or 0.30), 4),
            "final_probability": round(prob, 4),
            "risk_level": p.risk or "Low"
        })

    # Simple linear regression trend slope (probability per 30 days)
    x = times_days
    y = probs
    n = len(x)

    if max(times_days) == min(times_days):
        slope_per_day = (y[-1] - y[0]) / max(len(y) - 1, 1)
    else:
        x_mean = sum(x) / n
        y_mean = sum(y) / n
        num = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n))
        den = sum((x[i] - x_mean) ** 2 for i in range(n))
        slope_per_day = num / den if den != 0 else 0.0

    slope_per_month = slope_per_day * 30.0

    if slope_per_month > 0.01:
        trend_direction = "Increasing"
    elif slope_per_month < -0.01:
        trend_direction = "Decreasing"
    else:
        trend_direction = "Stable"

    # Short-horizon 30-day projection (bounded [0, 1])
    last_prob = probs[-1]
    projected_30d = min(max(last_prob + slope_per_month, 0.0), 1.0)
    proj_risk = "Low" if projected_30d < 0.30 else "Medium" if projected_30d < 0.60 else "High"

    return {
        "has_sufficient_data": True,
        "patient_id": patient_id,
        "observation_count": n,
        "baseline_date": t0.isoformat(),
        "last_assessment_date": predictions[-1].created_at.isoformat() if predictions[-1].created_at else "",
        "trend_slope_per_month": round(slope_per_month, 4),
        "trend_direction": trend_direction,
        "current_final_probability": round(last_prob, 4),
        "projected_30d_probability": round(projected_30d, 4),
        "projected_30d_risk_level": proj_risk,
        "historical_points": points,
        "disclaimer": "Research trend projection based on historical assessment probabilities — not a medical clinical forecast."
    }


def get_patient_scorecard(db: Session, patient_id: str) -> dict[str, Any]:
    """Build central Patient Risk Scorecard."""
    predictions = (
        db.query(Prediction)
        .filter(Prediction.patient_id == patient_id)
        .order_by(Prediction.created_at.desc(), Prediction.id.desc())
        .all()
    )

    if not predictions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found or no predictions available."
        )

    latest = predictions[0]
    forecast = get_patient_risk_forecast(db, patient_id)

    # TreeSHAP top attributions
    shap_scores = _try_shap_scores(latest) or _sensitivity_scores(latest)
    attributions = []
    for feature_name, field_key, _ in FEATURES[:10]:
        val = shap_scores.get(field_key, 0.0)
        attributions.append({
            "feature": FEATURE_HUMAN_NAMES.get(field_key, feature_name),
            "field": field_key,
            "contribution": round(val, 4),
            "impact": "Increases Risk Score" if val > 0 else "Decreases Risk Score" if val < 0 else "Neutral"
        })
    attributions.sort(key=lambda x: abs(x["contribution"]), reverse=True)

    has_keystroke = latest.keystroke_probability is not None
    keystroke_profile = {
        "available": has_keystroke,
        "keystroke_probability": round(float(latest.keystroke_probability or 0.30), 4),
        "key_dwell_time": latest.H if latest.H is not None else None,
        "up_down_flight_time": latest.UD if latest.UD is not None else None,
        "down_down_latency": latest.DD if latest.DD is not None else None,
    }

    return {
        "patient": {
            "patient_id": patient_id,
            "patient_name": latest.patient_name or "Unknown Patient",
            "age": latest.age,
            "gender": "Male" if latest.gender == 1 else "Female" if latest.gender == 0 else "Unknown"
        },
        "scorecard": {
            "clinical_model_probability": round(float(latest.clinical_probability or 0.0), 4),
            "keystroke_model_probability": round(float(latest.keystroke_probability or 0.30), 4),
            "combined_final_probability": round(float(latest.final_probability or 0.0), 4),
            "risk_category": (latest.risk or "Low").capitalize(),
            "trend_direction": forecast.get("trend_direction", "Stable"),
            "last_assessment_date": latest.created_at.isoformat() if latest.created_at else "",
        },
        "top_attributions": attributions[:5],
        "keystroke_profile": keystroke_profile,
        "disclaimer": "The scorecard displays model outputs for clinical decision support — not a clinical diagnosis."
    }


def validate_clinical_inputs(input_data: dict[str, Any]) -> dict[str, Any]:
    """Data Quality Checker evaluating input ranges before prediction."""
    results = []
    overall_status = "VALID"

    for field, rules in CLINICAL_VALIDATION_RULES.items():
        if field in input_data and input_data[field] is not None:
            try:
                val = float(input_data[field])
                field_label = FEATURE_HUMAN_NAMES.get(field, field.capitalize())

                if val < rules["min"] or val > rules["max"]:
                    item_status = "INVALID"
                    overall_status = "INVALID"
                    msg = f"{field_label} ({val}) is outside physical range [{rules['min']}, {rules['max']}]."
                elif val < rules["warn_min"] or val > rules["warn_max"]:
                    item_status = "WARNING"
                    if overall_status != "INVALID":
                        overall_status = "WARNING"
                    msg = f"{field_label} ({val}) is outside common reference range [{rules['warn_min']}, {rules['warn_max']}]."
                else:
                    item_status = "VALID"
                    msg = f"{field_label} ({val}) is within normal parameters."

                results.append({
                    "field": field,
                    "label": field_label,
                    "value": val,
                    "status": item_status,
                    "message": msg
                })
            except (ValueError, TypeError):
                overall_status = "INVALID"
                results.append({
                    "field": field,
                    "label": field.capitalize(),
                    "value": input_data[field],
                    "status": "INVALID",
                    "message": f"Invalid numerical value for {field}."
                })

    return {
        "overall_status": overall_status,
        "checks": results,
        "disclaimer": "Input validation warnings highlight values outside standard reference ranges and do not indicate clinical pathology."
    }


def compare_two_patients(db: Session, patient_id_a: str, patient_id_b: str) -> dict[str, Any]:
    """Side-by-side comparison of 2 patients for clinician workspace."""
    if patient_id_a == patient_id_b:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient A and Patient B IDs cannot be identical."
        )

    card_a = get_patient_scorecard(db, patient_id_a)
    card_b = get_patient_scorecard(db, patient_id_b)

    attr_a = {item["field"]: item["contribution"] for item in card_a["top_attributions"]}
    attr_b = {item["field"]: item["contribution"] for item in card_b["top_attributions"]}

    differences = []
    for feature_name, field_key, _ in FEATURES[:10]:
        ca = attr_a.get(field_key, 0.0)
        cb = attr_b.get(field_key, 0.0)
        diff = cb - ca
        differences.append({
            "feature": FEATURE_HUMAN_NAMES.get(field_key, feature_name),
            "field": field_key,
            "patient_a_contribution": ca,
            "patient_b_contribution": cb,
            "attribution_delta": round(diff, 4),
            "interpretation": f"Model attribution shift between Patient A and B: {diff:+.4f}"
        })

    differences.sort(key=lambda x: abs(x["attribution_delta"]), reverse=True)

    return {
        "patient_a": card_a,
        "patient_b": card_b,
        "attribution_differences": differences,
        "disclaimer": "Side-by-side comparisons illustrate differences in model outputs and feature attributions only."
    }


def get_prediction_why_explanation(db: Session, prediction_id: int) -> dict[str, Any]:
    """Advanced TreeSHAP 'Why This Risk?' view showing base value + sum(SHAP) reconstruction."""
    pred = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not pred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prediction record not found."
        )

    explanation = build_explanation(pred)
    shap_scores = _try_shap_scores(pred) or _sensitivity_scores(pred)

    base_value = float(explanation.get("base_value", 0.18))
    clin_prob = float(pred.clinical_probability or 0.0)

    factors_increasing = []
    factors_decreasing = []

    for feature_name, field_key, _ in FEATURES[:10]:
        val = shap_scores.get(field_key, 0.0)
        item = {
            "feature": FEATURE_HUMAN_NAMES.get(field_key, feature_name),
            "field": field_key,
            "value": _display_value(field_key, _value(pred, field_key)),
            "shap_contribution": round(val, 4)
        }
        if val > 0:
            factors_increasing.append(item)
        elif val < 0:
            factors_decreasing.append(item)

    factors_increasing.sort(key=lambda x: x["shap_contribution"], reverse=True)
    factors_decreasing.sort(key=lambda x: x["shap_contribution"])

    sum_shap = sum(shap_scores.values())
    reconstructed = base_value + sum_shap

    return {
        "prediction_id": pred.id,
        "patient_id": pred.patient_id,
        "clinical_probability": round(clin_prob, 4),
        "explanation_method": explanation.get("method", "shap"),
        "base_value": round(base_value, 4),
        "sum_shap_contributions": round(sum_shap, 4),
        "reconstructed_probability": round(reconstructed, 4),
        "factors_increasing_risk": factors_increasing,
        "factors_decreasing_risk": factors_decreasing,
        "disclaimer": "SHAP values describe model attribution and do not establish biological causation."
    }

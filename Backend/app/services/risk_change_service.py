from datetime import datetime, timezone
from typing import Any
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.prediction import Prediction
from app.services.explainability_service import (
    FEATURES,
    _sensitivity_scores,
    _try_shap_scores,
    _value,
    _display_value
)

FEATURE_HUMAN_NAMES = {
    "age": "Age",
    "avg_glucose_level": "Average glucose level",
    "bmi": "Body Mass Index (BMI)",
    "hypertension": "Hypertension",
    "heart_disease": "Heart disease",
    "smoking_status": "Smoking status",
    "gender": "Gender",
    "ever_married": "Ever married",
    "work_type": "Work type",
    "Residence_type": "Residence type",
}

def compare_patient_risk_change(
    db: Session,
    patient_id: str,
    previous_prediction_id: int,
    current_prediction_id: int
) -> dict[str, Any]:
    if previous_prediction_id == current_prediction_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Previous and current prediction IDs cannot be identical."
        )

    prev_pred = db.query(Prediction).filter(Prediction.id == previous_prediction_id).first()
    curr_pred = db.query(Prediction).filter(Prediction.id == current_prediction_id).first()

    if not prev_pred or not curr_pred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or both prediction records could not be found."
        )

    if prev_pred.patient_id != patient_id or curr_pred.patient_id != patient_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both predictions must belong to the specified patient."
        )

    # Ensure chronological order (previous = earlier, current = later)
    if prev_pred.created_at and curr_pred.created_at and prev_pred.created_at > curr_pred.created_at:
        prev_pred, curr_pred = curr_pred, prev_pred

    prev_clin = float(prev_pred.clinical_probability or 0.0)
    prev_key = float(prev_pred.keystroke_probability or 0.30)
    prev_final = float(prev_pred.final_probability or 0.0)
    prev_risk = (prev_pred.risk or "Low").capitalize()

    curr_clin = float(curr_pred.clinical_probability or 0.0)
    curr_key = float(curr_pred.keystroke_probability or 0.30)
    curr_final = float(curr_pred.final_probability or 0.0)
    curr_risk = (curr_pred.risk or "Low").capitalize()

    clin_delta = curr_clin - prev_clin
    key_delta = curr_key - prev_key
    final_delta = curr_final - prev_final
    risk_transition = f"{prev_risk} → {curr_risk}"

    if final_delta > 0.001:
        status_code = "increased"
    elif final_delta < -0.001:
        status_code = "decreased"
    else:
        status_code = "stable"

    # 1. Clinical Feature Changes
    clinical_feature_changes = []
    for feature_name, field_key, _ in FEATURES[:10]:
        v_prev = _value(prev_pred, field_key)
        v_curr = _value(curr_pred, field_key)

        disp_prev = _display_value(field_key, v_prev)
        disp_curr = _display_value(field_key, v_curr)

        num_prev = float(v_prev) if v_prev is not None and isinstance(v_prev, (int, float)) else None
        num_curr = float(v_curr) if v_curr is not None and isinstance(v_curr, (int, float)) else None

        if num_prev is not None and num_curr is not None:
            diff_num = num_curr - num_prev
            diff_str = f"{diff_num:+.1f}"
            if diff_num > 0:
                direction = "Increased"
            elif diff_num < 0:
                direction = "Decreased"
            else:
                direction = "Unchanged"
        else:
            diff_str = "Changed" if disp_prev != disp_curr else "Unchanged"
            direction = "Changed" if disp_prev != disp_curr else "Unchanged"

        clinical_feature_changes.append({
            "feature": FEATURE_HUMAN_NAMES.get(field_key, feature_name),
            "field": field_key,
            "previous_value": disp_prev,
            "current_value": disp_curr,
            "difference": diff_str,
            "direction": direction
        })

    # 2. SHAP Attribution Comparison
    prev_shap_scores = _try_shap_scores(prev_pred)
    curr_shap_scores = _try_shap_scores(curr_pred)
    
    explanation_method = "shap" if (prev_shap_scores and curr_shap_scores) else "approximate_sensitivity"
    
    if not prev_shap_scores:
        prev_shap_scores = _sensitivity_scores(prev_pred)
    if not curr_shap_scores:
        curr_shap_scores = _sensitivity_scores(curr_pred)

    shap_comparison = []
    for feature_name, field_key, _ in FEATURES[:10]:
        s_prev = float(prev_shap_scores.get(field_key, 0.0))
        s_curr = float(curr_shap_scores.get(field_key, 0.0))
        s_delta = s_curr - s_prev

        if s_delta > 0.0001:
            s_dir = "Contribution Increased"
        elif s_delta < -0.0001:
            s_dir = "Contribution Decreased"
        else:
            s_dir = "Unchanged"

        shap_comparison.append({
            "feature": FEATURE_HUMAN_NAMES.get(field_key, feature_name),
            "field": field_key,
            "previous_shap": round(s_prev, 4),
            "current_shap": round(s_curr, 4),
            "delta": round(s_delta, 4),
            "previous_direction": "positive" if s_prev > 0 else "negative" if s_prev < 0 else "neutral",
            "current_direction": "positive" if s_curr > 0 else "negative" if s_curr < 0 else "neutral",
            "attribution_direction": s_dir,
            "interpretation": f"The model attribution of {FEATURE_HUMAN_NAMES.get(field_key, feature_name)} changed by {s_delta:+.4f}."
        })

    shap_comparison.sort(key=lambda x: abs(x["delta"]), reverse=True)

    # 3. Keystroke Behavioral Comparison
    has_keystroke = (
        prev_pred.keystroke_probability is not None and curr_pred.keystroke_probability is not None
    )
    
    keystroke_changes = []
    if has_keystroke:
        keystroke_changes.append({
            "metric": "Keystroke Risk Probability",
            "previous_value": f"{prev_key*100:.1f}%",
            "current_value": f"{curr_key*100:.1f}%",
            "delta": f"{key_delta*100:+.1f}%",
            "direction": "Increased" if key_delta > 0 else "Decreased" if key_delta < 0 else "Unchanged"
        })

    # 4. Explainable Summary Narrative
    top_positive_shift = [s for s in shap_comparison if s["delta"] > 0][:2]
    top_negative_shift = [s for s in shap_comparison if s["delta"] < 0][:2]

    summary_msg = f"Model-assessed risk {status_code} from {prev_risk} ({prev_final*100:.1f}%) to {curr_risk} ({curr_final*100:.1f}%) between assessments."
    
    highlights = []
    for s in top_positive_shift:
        highlights.append(f"{s['feature']} showed the largest positive increase in model risk attribution ({s['delta']:+.4f}).")
    for s in top_negative_shift:
        highlights.append(f"{s['feature']} model risk attribution decreased ({s['delta']:+.4f}).")

    return {
        "patient": {
            "patient_id": patient_id,
            "patient_name": curr_pred.patient_name or prev_pred.patient_name or "Unknown Patient"
        },
        "previous": {
            "prediction_id": prev_pred.id,
            "created_at": prev_pred.created_at.isoformat() if prev_pred.created_at else "",
            "clinical_probability": round(prev_clin, 4),
            "keystroke_probability": round(prev_key, 4),
            "final_probability": round(prev_final, 4),
            "risk_level": prev_risk
        },
        "current": {
            "prediction_id": curr_pred.id,
            "created_at": curr_pred.created_at.isoformat() if curr_pred.created_at else "",
            "clinical_probability": round(curr_clin, 4),
            "keystroke_probability": round(curr_key, 4),
            "final_probability": round(curr_final, 4),
            "risk_level": curr_risk
        },
        "changes": {
            "clinical_delta": round(clin_delta, 4),
            "keystroke_delta": round(key_delta, 4),
            "final_delta": round(final_delta, 4),
            "risk_transition": risk_transition
        },
        "explanation_method": explanation_method,
        "clinical_feature_changes": clinical_feature_changes,
        "shap_comparison": shap_comparison,
        "keystroke_available": has_keystroke,
        "keystroke_changes": keystroke_changes,
        "summary": {
            "status": status_code,
            "message": summary_msg,
            "highlights": highlights,
            "disclaimer": "These feature attribution comparisons describe how model predictions shifted over time and do not establish direct medical causation."
        }
    }

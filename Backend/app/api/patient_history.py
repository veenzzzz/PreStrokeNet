import sys
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_roles
from app.core.database import get_db
from app.models.prediction import Prediction
from app.models.prediction_activity import PredictionActivity
from app.models.user import User
from app.schemas.patient import (
    PatientAssessmentHistoryItem,
    RiskProgressionPoint,
    ShapFeatureComparison,
    RiskProgressionChange,
    RiskProgressionResponse
)
from app.schemas.prediction import ActivityEvent
from app.services.explainability_service import (
    FEATURES,
    _try_shap_scores,
    _sensitivity_scores
)
from app.services.risk_change_service import compare_patient_risk_change

router = APIRouter(prefix="/patients", tags=["Patient History"])


@router.get("/{patient_id}/risk-change")
def get_patient_risk_change_comparison(
    patient_id: str,
    previous_prediction_id: int,
    current_prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor"))
):
    return compare_patient_risk_change(
        db=db,
        patient_id=patient_id,
        previous_prediction_id=previous_prediction_id,
        current_prediction_id=current_prediction_id
    )

def _has_shap() -> bool:
    try:
        import shap  # type: ignore
        return True
    except Exception:
        return False

@router.get("/{patient_id}/history", response_model=list[PatientAssessmentHistoryItem])
def get_patient_history(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor"))
):
    rows = (
        db.query(Prediction)
        .filter(Prediction.patient_id == patient_id)
        .order_by(Prediction.created_at.desc(), Prediction.id.desc())
        .all()
    )
    if not rows:
        raise HTTPException(
            status_code=404,
            detail="Patient not found or no previous assessments available."
        )

    method = "shap" if _has_shap() else "approximate_sensitivity"
    
    return [
        PatientAssessmentHistoryItem(
            id=row.id,
            patient_name=row.patient_name,
            patient_id=row.patient_id,
            age=row.age,
            gender=row.gender,
            clinical_probability=row.clinical_probability or 0.0,
            keystroke_probability=row.keystroke_probability or 0.0,
            final_probability=row.final_probability or 0.0,
            risk=row.risk or "Low",
            created_at=row.created_at,
            doctor_notes=row.doctor_notes,
            recommendation=row.recommendation,
            follow_up_date=row.follow_up_date,
            status=row.status or "draft",
            explainability_method=method
        )
        for row in rows
    ]

@router.get("/{patient_id}/risk-progression", response_model=RiskProgressionResponse)
def get_patient_risk_progression(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor"))
):
    # Fetch sequential assessments (earliest first for chart plotting)
    predictions = (
        db.query(Prediction)
        .filter(Prediction.patient_id == patient_id)
        .order_by(Prediction.created_at.asc(), Prediction.id.asc())
        .all()
    )
    if not predictions:
        raise HTTPException(
            status_code=404,
            detail="Patient not found or no previous assessments available."
        )

    # Build progression timeline points
    progression = [
        RiskProgressionPoint(
            prediction_id=p.id,
            assessment_date=p.created_at,
            clinical_probability=p.clinical_probability or 0.0,
            keystroke_probability=p.keystroke_probability or 0.0,
            final_probability=p.final_probability or 0.0,
            risk=p.risk or "Low"
        )
        for p in predictions
    ]

    latest_assessment = None
    if len(predictions) > 0:
        latest = predictions[-1]
        previous = predictions[-2] if len(predictions) >= 2 else None
        
        prev_prob = previous.final_probability if previous else None
        curr_prob = latest.final_probability or 0.0
        
        if prev_prob is not None:
            abs_change = curr_prob - prev_prob
            pct_change = abs_change * 100.0
            if abs_change > 0.0001:
                direction = "Increased"
                status_message = "Predicted risk increased compared with the previous assessment."
            elif abs_change < -0.0001:
                direction = "Decreased"
                status_message = "Predicted risk decreased compared with the previous assessment."
            else:
                direction = "Stable"
                status_message = "Predicted risk remained stable compared with the previous assessment."
        else:
            abs_change = 0.0
            pct_change = 0.0
            direction = "Stable"
            status_message = "Predicted risk remained stable compared with the previous assessment."

        # Compute SHAP comparisons for the 10 clinical features
        shap_comparison = []
        latest_shap = _try_shap_scores(latest)
        latest_scores = latest_shap or _sensitivity_scores(latest)
        
        if previous:
            prev_shap = _try_shap_scores(previous)
            prev_scores = prev_shap or _sensitivity_scores(previous)
        else:
            prev_scores = {}

        # Limit to the 10 clinical features
        for feature, field, _ in FEATURES[:10]:
            curr_contrib = latest_scores.get(field, 0.0)
            prev_contrib = prev_scores.get(field, 0.0) if previous else None
            change = curr_contrib - prev_contrib if prev_contrib is not None else 0.0
            
            shap_comparison.append(
                ShapFeatureComparison(
                    feature=feature,
                    field=field,
                    current_contribution=curr_contrib,
                    previous_contribution=prev_contrib,
                    change=change
                )
            )
            
        # Sort by absolute current contribution descending
        shap_comparison.sort(key=lambda x: abs(x.current_contribution), reverse=True)

        latest_assessment = RiskProgressionChange(
            previous_probability=prev_prob,
            current_probability=curr_prob,
            absolute_change=abs_change,
            percentage_change=pct_change,
            direction=direction,
            status_message=status_message,
            shap_comparison=shap_comparison
        )

    return RiskProgressionResponse(
        progression=progression,
        latest_assessment=latest_assessment
    )

@router.get("/{patient_id}/timeline", response_model=list[ActivityEvent])
def get_patient_timeline(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor"))
):
    predictions = (
        db.query(Prediction)
        .filter(Prediction.patient_id == patient_id)
        .all()
    )
    if not predictions:
        raise HTTPException(
            status_code=404,
            detail="Patient not found or no previous assessments available."
        )

    pred_ids = [p.id for p in predictions]

    # Query timeline events with actors
    rows = (
        db.query(PredictionActivity, User.full_name)
        .outerjoin(User, User.id == PredictionActivity.actor_id)
        .filter(PredictionActivity.prediction_id.in_(pred_ids))
        .order_by(PredictionActivity.created_at.desc())
        .all()
    )

    return [
        ActivityEvent(
            id=activity.id,
            prediction_id=activity.prediction_id,
            activity_type=activity.activity_type,
            message=activity.message,
            actor_name=actor_name,
            created_at=activity.created_at
        )
        for activity, actor_name in rows
    ]

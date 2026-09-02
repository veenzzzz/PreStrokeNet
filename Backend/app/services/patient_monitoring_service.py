import logging
from datetime import datetime, timezone
from typing import Any, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.follow_up import PatientFollowUp
from app.models.notification import Notification
from app.models.prediction import Prediction
from app.models.prediction_activity import PredictionActivity
from app.models.user import User
from app.services.clinical_workflow_service import get_patient_follow_ups, log_doctor_action
from app.services.patient_intelligence_service import (
    get_patient_risk_forecast,
    get_patient_scorecard,
    get_prediction_why_explanation,
)
from app.services.risk_change_service import compare_patient_risk_change

logger = logging.getLogger(__name__)

# Valid workflow state transitions
VALID_TRANSITIONS = {
    "new": ["in_review", "reviewed", "follow_up", "resolved"],
    "in_review": ["reviewed", "follow_up", "resolved"],
    "reviewed": ["in_review", "follow_up", "resolved"],
    "follow_up": ["in_review", "reviewed", "resolved"],
    "resolved": ["in_review", "reviewed"],
}


def process_post_assessment_workflow(db: Session, prediction: Prediction, user: Optional[User] = None) -> list[str]:
    """Automated post-assessment pipeline executing risk change analysis, event detection, notification, and audit logging."""
    generated_events = []
    pid = prediction.patient_id or str(prediction.id)

    try:
        # 1. Fetch previous prediction for risk change comparison
        prev_pred = (
            db.query(Prediction)
            .filter(Prediction.patient_id == pid, Prediction.id < prediction.id)
            .order_by(Prediction.created_at.desc(), Prediction.id.desc())
            .first()
        )

        curr_risk = (prediction.risk or "Low").capitalize()
        curr_prob = float(prediction.final_probability or 0.0)

        # 2. Risk Event Detection
        if prev_pred:
            prev_risk = (prev_pred.risk or "Low").capitalize()
            prev_prob = float(prev_pred.final_probability or 0.0)
            prob_diff = curr_prob - prev_prob

            if curr_risk != prev_risk:
                generated_events.append("RISK_CATEGORY_CHANGED")
                _create_idempotent_notification(
                    db=db,
                    user_id=user.id if user else 1,
                    patient_id=pid,
                    prediction_id=prediction.id,
                    notif_type="risk_level_change",
                    severity="high" if curr_risk == "High" else "medium",
                    title=f"Workflow Event: Risk Category Shift ({prev_risk} → {curr_risk})",
                    message=f"Patient {pid} risk score shifted from {prev_prob:.1%} ({prev_risk}) to {curr_prob:.1%} ({curr_risk}). Review required.",
                )

            if prob_diff >= 0.10:
                generated_events.append("RISK_INCREASED")
                _create_idempotent_notification(
                    db=db,
                    user_id=user.id if user else 1,
                    patient_id=pid,
                    prediction_id=prediction.id,
                    notif_type="risk_increase",
                    severity="high",
                    title="Workflow Alert: Model Probability Jump (+10%)",
                    message=f"Patient {pid} final probability increased by +{prob_diff:.1%} since previous assessment.",
                )

        if curr_risk == "High" and "HIGH_RISK_REVIEW_REQUIRED" not in generated_events:
            generated_events.append("HIGH_RISK_REVIEW_REQUIRED")
            _create_idempotent_notification(
                db=db,
                user_id=user.id if user else 1,
                patient_id=pid,
                prediction_id=prediction.id,
                notif_type="high_risk_assessment",
                severity="high",
                title="Workflow Priority: High Model Risk Score",
                message=f"Patient {pid} assessed at High risk ({curr_prob:.1%}). Added to Clinician Work Queue.",
            )

        if not generated_events:
            generated_events.append("NEW_ASSESSMENT")

        # 3. Log Audit Trail Action
        if user:
            log_doctor_action(
                db=db,
                user=user,
                action="Assessment Created & Evaluated",
                patient_id=pid,
                prediction_id=prediction.id,
                details=f"Events: {', '.join(generated_events)}",
            )

    except Exception as err:
        logger.error(f"Post-assessment workflow error for prediction {prediction.id}: {err}", exc_info=True)

    return generated_events


def _create_idempotent_notification(
    db: Session,
    user_id: int,
    patient_id: str,
    prediction_id: int,
    notif_type: str,
    severity: str,
    title: str,
    message: str,
):
    """Prevent duplicate notifications for identical prediction & type."""
    existing = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.prediction_id == prediction_id,
            Notification.type == notif_type,
        )
        .first()
    )
    if not existing:
        n = Notification(
            user_id=user_id,
            patient_id=patient_id,
            prediction_id=prediction_id,
            type=notif_type,
            severity=severity,
            title=title,
            message=message,
        )
        db.add(n)
        db.commit()


def transition_workflow_state(
    db: Session,
    user: User,
    patient_id: str,
    prediction_id: int,
    target_state: str,
    note: Optional[str] = None,
) -> dict[str, Any]:
    """Execute validated state machine transition."""
    target_state_clean = target_state.lower().strip().replace(" ", "_")
    pred = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not pred:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found.")

    current_state = (pred.status or "new").lower().strip().replace(" ", "_")

    # Validate transition
    allowed = VALID_TRANSITIONS.get(current_state, ["in_review", "reviewed", "resolved"])
    if target_state_clean not in allowed and target_state_clean != current_state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid transition from '{current_state}' to '{target_state_clean}'. Allowed: {allowed}",
        )

    pred.status = target_state_clean
    if note:
        pred.doctor_notes = f"{pred.doctor_notes or ''}\n[{target_state_clean.upper()}]: {note}".strip()

    db.commit()
    db.refresh(pred)

    log_doctor_action(
        db=db,
        user=user,
        action=f"Workflow Transition ({current_state} → {target_state_clean})",
        patient_id=patient_id,
        prediction_id=prediction_id,
        details=note,
    )

    return {
        "prediction_id": pred.id,
        "patient_id": patient_id,
        "previous_state": current_state,
        "current_state": target_state_clean,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def calculate_smart_patient_status(db: Session, patient_id: str) -> str:
    """Calculate transparent workflow status for patient badges."""
    preds = (
        db.query(Prediction)
        .filter(Prediction.patient_id == patient_id)
        .order_by(Prediction.created_at.desc())
        .all()
    )
    if not preds:
        return "No Recent Activity"

    latest = preds[0]

    # Check overdue follow-up
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    overdue = (
        db.query(PatientFollowUp)
        .filter(
            PatientFollowUp.patient_id == patient_id,
            PatientFollowUp.status == "Pending",
            PatientFollowUp.due_date < today_str,
        )
        .first()
    )
    if overdue:
        return "Follow-up Overdue"

    pending = (
        db.query(PatientFollowUp)
        .filter(
            PatientFollowUp.patient_id == patient_id,
            PatientFollowUp.status == "Pending",
        )
        .first()
    )
    if pending:
        return "Follow-up Pending"

    if (latest.risk or "").lower() == "high" or (latest.status or "").lower() in ["new", "in_review", "draft"]:
        return "Requires Review"

    return "Up to Date"


def get_patient_monitoring_summary(db: Session, patient_id: str) -> dict[str, Any]:
    """Single unified monitoring summary endpoint aggregating full patient workflow state."""
    scorecard = get_patient_scorecard(db, patient_id)
    forecast = get_patient_risk_forecast(db, patient_id)
    smart_status = calculate_smart_patient_status(db, patient_id)

    preds = (
        db.query(Prediction)
        .filter(Prediction.patient_id == patient_id)
        .order_by(Prediction.created_at.desc())
        .all()
    )

    risk_change_data = None
    if len(preds) >= 2:
        try:
            risk_change_data = compare_patient_risk_change(db, patient_id, preds[1].id, preds[0].id)
        except Exception:
            risk_change_data = None

    open_notifs = (
        db.query(Notification)
        .filter(Notification.patient_id == patient_id, Notification.is_read == False)
        .all()
    )

    pending_followups = get_patient_follow_ups(db, user_id=1, patient_id=patient_id)

    activities = (
        db.query(PredictionActivity)
        .filter(PredictionActivity.prediction_id.in_([p.id for p in preds]))
        .order_by(PredictionActivity.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "patient_id": patient_id,
        "smart_workflow_status": smart_status,
        "scorecard": scorecard,
        "longitudinal_forecast": forecast,
        "risk_change_analysis": risk_change_data,
        "open_notifications_count": len(open_notifs),
        "pending_followups": pending_followups,
        "recent_timeline_events": [
            {
                "id": a.id,
                "type": a.activity_type,
                "message": a.message,
                "date": a.created_at.isoformat() if a.created_at else "",
            }
            for a in activities
        ],
        "model_reliability_context": {
            "roc_auc": 0.8801,
            "pr_auc": 0.4298,
            "recall": 0.8810,
            "f1_score": 0.2803,
            "brier_score": 0.0373,
            "threshold": 0.15,
            "disclaimer": "Metrics represent research evaluation results on held-out test data — not diagnostic certainty.",
        },
    }

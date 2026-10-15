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

        # 3. Longitudinal Neuromotor Degradation Detection
        if prediction.H is not None and float(prediction.H) > 0.0:
            motor_alert = detect_subclinical_motor_degradation(db=db, patient_id=pid)
            if motor_alert.get("is_degraded"):
                generated_events.append("MOTOR_DEGRADATION_DETECTED")
                _create_idempotent_notification(
                    db=db,
                    user_id=user.id if user else 1,
                    patient_id=pid,
                    prediction_id=prediction.id,
                    notif_type="motor_degradation",
                    severity="high" if motor_alert.get("severity") == "HIGH" else "medium",
                    title=f"Neuromotor Alert: Motor Slowing Detected (+{motor_alert.get('latency_shift_pct', 0.0):.1f}%)",
                    message=(
                        f"Patient {pid} exhibited a +{motor_alert.get('latency_shift_pct', 0.0):.1f}% fine-motor latency slowdown "
                        f"relative to baseline. Neurological consult and MRI DWI recommended."
                    ),
                )

        if not generated_events:
            generated_events.append("NEW_ASSESSMENT")

        # 4. Log Audit Trail Action
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


def detect_subclinical_motor_degradation(db: Session, patient_id: str) -> dict[str, Any]:
    """
    Longitudinal neuromotor degradation trajectory detector.
    Evaluates key-hold dwell time (H), inter-key flight time (UD), and digraph latency (DD)
    shifts across visits against the patient's personalized baseline.
    Flags subclinical motor latency slowing (>=20% drift) before overt hemiparesis or vitals shifts appear.
    """
    preds = (
        db.query(Prediction)
        .filter(Prediction.patient_id == patient_id)
        .order_by(Prediction.created_at.asc(), Prediction.id.asc())
        .all()
    )

    # Filter to predictions with valid keystroke measurements (H > 0)
    keystroke_preds = [p for p in preds if p.H is not None and float(p.H) > 0.0]

    if len(keystroke_preds) < 2:
        latest_pred = keystroke_preds[-1] if keystroke_preds else None
        return {
            "patient_id": patient_id,
            "is_degraded": False,
            "severity": "NORMAL",
            "status": "INSUFFICIENT_DATA",
            "message": "Longitudinal neuromotor analysis requires at least 2 keystroke sessions.",
            "session_count": len(keystroke_preds),
            "baseline_dwell_ms": round(float(latest_pred.H) * 1000.0, 1) if latest_pred and latest_pred.H else 0.0,
            "current_dwell_ms": round(float(latest_pred.H) * 1000.0, 1) if latest_pred and latest_pred.H else 0.0,
            "baseline_flight_ms": round(float(latest_pred.UD) * 1000.0, 1) if latest_pred and latest_pred.UD else 0.0,
            "current_flight_ms": round(float(latest_pred.UD) * 1000.0, 1) if latest_pred and latest_pred.UD else 0.0,
            "baseline_digraph_ms": round(float(latest_pred.DD) * 1000.0, 1) if latest_pred and latest_pred.DD else 0.0,
            "current_digraph_ms": round(float(latest_pred.DD) * 1000.0, 1) if latest_pred and latest_pred.DD else 0.0,
            "dwell_shift_pct": 0.0,
            "flight_shift_pct": 0.0,
            "digraph_shift_pct": 0.0,
            "latency_shift_pct": 0.0,
            "clinical_rationale": "Patient currently has fewer than 2 distinct keystroke sessions. No longitudinal neuromotor drift can be ascertained yet.",
            "recommended_workup": [],
            "last_assessed_at": latest_pred.created_at.isoformat() if latest_pred and latest_pred.created_at else None,
        }

    current = keystroke_preds[-1]
    prior_sessions = keystroke_preds[:-1]

    baseline_h = float(sum(p.H for p in prior_sessions) / len(prior_sessions))
    baseline_ud = float(sum((p.UD or 0.0) for p in prior_sessions) / len(prior_sessions))
    baseline_dd = float(sum((p.DD or 0.0) for p in prior_sessions) / len(prior_sessions))

    curr_h = float(current.H or 0.0)
    curr_ud = float(current.UD or 0.0)
    curr_dd = float(current.DD or 0.0)

    dwell_shift = round(((curr_h - baseline_h) / baseline_h) * 100.0, 1) if baseline_h > 0 else 0.0
    flight_shift = round(((curr_ud - baseline_ud) / baseline_ud) * 100.0, 1) if baseline_ud > 0 else 0.0
    digraph_shift = round(((curr_dd - baseline_dd) / baseline_dd) * 100.0, 1) if baseline_dd > 0 else 0.0

    max_shift = round(max(dwell_shift, flight_shift, digraph_shift), 1)

    # Determine severity
    if dwell_shift >= 25.0 or flight_shift >= 30.0 or max_shift >= 30.0:
        severity = "HIGH"
        is_degraded = True
        status_label = "SUBCLINICAL_DEGRADATION_DETECTED"
        message = (
            f"Significant fine-motor latency slowdown detected: dwell time shifted by +{dwell_shift:.1f}% "
            f"and flight latency shifted by +{flight_shift:.1f}% relative to historical baseline."
        )
    elif dwell_shift >= 15.0 or flight_shift >= 20.0 or max_shift >= 20.0:
        severity = "MODERATE"
        is_degraded = True
        status_label = "MILD_MOTOR_SLOWING_DETECTED"
        message = (
            f"Moderate fine-motor latency prolongation detected (+{max_shift:.1f}% shift from baseline). "
            f"Monitor for microvascular changes."
        )
    else:
        severity = "NORMAL"
        is_degraded = False
        status_label = "STABLE"
        message = "Longitudinal fine-motor keystroke kinematics remain stable relative to baseline."

    if is_degraded:
        clinical_rationale = (
            f"Subclinical motor latency degradation of +{max_shift:.1f}% detected across successive evaluations. "
            "In patients with cerebrovascular risk factors, progressive subclinical prolongation of key-hold dwell time (H) "
            "and inter-key flight time (UD) frequently reflects microvascular white-matter ischemia, lacunar subcortical micro-infarcts, "
            "or transient ischemic attack (TIA) motor deficits before gross hemiparesis or visible vitals changes emerge."
        )
        recommended_workup = [
            "Urgent outpatient Neurological consultation & NIH Stroke Scale (NIHSS) assessment",
            "Brain MRI with Diffusion-Weighted Imaging (DWI) and FLAIR to evaluate silent cerebral infarctions",
            "Bilateral Carotid Duplex Ultrasound to screen for internal carotid artery stenosis",
            "24- to 48-hour ambulatory Holter ECG monitoring to rule out paroxysmal atrial fibrillation",
            "Targeted blood pressure optimization and antiplatelet regimen review per AHA/ASA secondary prevention guidelines",
        ]
    else:
        clinical_rationale = "Longitudinal motor tapping kinematics show preserved finger dexterity and normal inter-tap timing variance."
        recommended_workup = ["Routine annual cerebrovascular and cardiovascular risk follow-up."]

    return {
        "patient_id": patient_id,
        "is_degraded": is_degraded,
        "severity": severity,
        "status": status_label,
        "message": message,
        "session_count": len(keystroke_preds),
        "baseline_dwell_ms": round(baseline_h * 1000.0, 1),
        "current_dwell_ms": round(curr_h * 1000.0, 1),
        "baseline_flight_ms": round(baseline_ud * 1000.0, 1),
        "current_flight_ms": round(curr_ud * 1000.0, 1),
        "baseline_digraph_ms": round(baseline_dd * 1000.0, 1),
        "current_digraph_ms": round(curr_dd * 1000.0, 1),
        "dwell_shift_pct": dwell_shift,
        "flight_shift_pct": flight_shift,
        "digraph_shift_pct": digraph_shift,
        "latency_shift_pct": max_shift,
        "clinical_rationale": clinical_rationale,
        "recommended_workup": recommended_workup,
        "last_assessed_at": current.created_at.isoformat() if current.created_at else None,
    }


def get_patient_monitoring_summary(db: Session, patient_id: str) -> dict[str, Any]:
    """Single unified monitoring summary endpoint aggregating full patient workflow state."""
    scorecard = get_patient_scorecard(db, patient_id)
    forecast = get_patient_risk_forecast(db, patient_id)
    smart_status = calculate_smart_patient_status(db, patient_id)
    motor_degradation_alert = detect_subclinical_motor_degradation(db, patient_id)

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
        "motor_degradation_alert": motor_degradation_alert,
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

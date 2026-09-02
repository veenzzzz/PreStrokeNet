import io
from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.follow_up import PatientFollowUp
from app.models.notification import Notification
from app.models.prediction import Prediction
from app.models.prediction_activity import PredictionActivity
from app.models.saved_patient import SavedPatient
from app.models.user import User


def log_doctor_action(
    db: Session,
    user: User,
    action: str,
    patient_id: Optional[str] = None,
    prediction_id: Optional[int] = None,
    details: Optional[str] = None,
) -> AuditLog:
    """Record clinician workflow action in AuditLog & PredictionActivity."""
    audit = AuditLog(
        user_id=user.id,
        user_name=user.full_name or user.email,
        user_role=user.role,
        action=action,
        patient_id=patient_id,
        prediction_id=prediction_id,
        details=details,
    )
    db.add(audit)

    if prediction_id or patient_id:
        activity = PredictionActivity(
            prediction_id=prediction_id,
            activity_type="workflow_action",
            message=f"{user.full_name or 'Clinician'} performed '{action}' for patient {patient_id or ''}".strip(),
            actor_id=user.id,
        )
        db.add(activity)

    db.commit()
    db.refresh(audit)
    return audit


def get_clinician_work_queue(
    db: Session,
    user: User,
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
) -> dict[str, Any]:
    """Retrieve Clinician Work Queue with transparent workflow priority scoring."""
    query = db.query(Prediction).order_by(Prediction.created_at.desc(), Prediction.id.desc())

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Prediction.patient_id.like(s)) | (Prediction.patient_name.like(s))
        )

    all_preds = query.all()

    # Deduplicate latest predictions per patient
    latest_per_patient: dict[str, Prediction] = {}
    for p in all_preds:
        pid = p.patient_id or str(p.id)
        if pid not in latest_per_patient:
            latest_per_patient[pid] = p

    # Fetch active unread notifications & pending follow-ups
    unread_notifs = (
        db.query(Notification)
        .filter(Notification.user_id == user.id, Notification.is_read == False)
        .all()
    )
    unread_pids = {n.patient_id for n in unread_notifs if n.patient_id}

    pending_followups = (
        db.query(PatientFollowUp)
        .filter(PatientFollowUp.user_id == user.id, PatientFollowUp.status == "Pending")
        .all()
    )
    followup_pids = {f.patient_id for f in pending_followups}

    saved_records = (
        db.query(SavedPatient)
        .filter(SavedPatient.user_id == user.id)
        .all()
    )
    saved_pids = {s.patient_id for s in saved_records}

    queue_items = []
    for pid, p in latest_per_patient.items():
        risk_level = (p.risk or "Low").capitalize()
        prob = float(p.final_probability or 0.0)

        # Transparent Priority Scoring
        priority = "LOW"
        reasons = []

        if risk_level == "High":
            priority = "HIGH"
            reasons.append("High model-assessed risk score")
        if pid in unread_pids:
            priority = "HIGH"
            reasons.append("Unresolved workflow notification")
        if pid in followup_pids:
            if priority != "HIGH":
                priority = "MEDIUM"
            reasons.append("Pending assessment follow-up")
        if risk_level == "Medium" and priority == "LOW":
            priority = "MEDIUM"
            reasons.append("Medium model-assessed risk score")
        if not reasons:
            reasons.append("Routine assessment — no pending workflow alerts")

        # Map item status
        item_status = p.status or "reviewed"
        if status_filter and status_filter.lower() != "all" and item_status.lower() != status_filter.lower():
            continue
        if priority_filter and priority_filter.upper() != "ALL" and priority.upper() != priority_filter.upper():
            continue

        queue_items.append({
            "prediction_id": p.id,
            "patient_id": p.patient_id,
            "patient_name": p.patient_name or "Unknown Patient",
            "age": p.age,
            "gender": "Male" if p.gender == 1 else "Female" if p.gender == 0 else "Unknown",
            "latest_assessment_date": p.created_at.isoformat() if p.created_at else "",
            "final_probability": round(prob, 4),
            "clinical_probability": round(float(p.clinical_probability or 0.0), 4),
            "keystroke_probability": round(float(p.keystroke_probability or 0.30), 4),
            "risk_category": risk_level,
            "priority": priority,
            "priority_reason": "; ".join(reasons),
            "workflow_status": item_status.capitalize(),
            "has_unread_alert": pid in unread_pids,
            "has_pending_followup": pid in followup_pids,
            "is_saved": pid in saved_pids,
        })

    # Priority order: HIGH -> MEDIUM -> LOW
    prio_map = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    queue_items.sort(key=lambda x: (prio_map.get(x["priority"], 3), x["latest_assessment_date"]), reverse=False)

    total_count = len(queue_items)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated_items = queue_items[start_idx:end_idx]

    return {
        "work_queue": paginated_items,
        "page": page,
        "limit": limit,
        "total_count": total_count,
        "kpi_summary": {
            "total_requiring_review": total_count,
            "high_priority_count": sum(1 for i in queue_items if i["priority"] == "HIGH"),
            "medium_priority_count": sum(1 for i in queue_items if i["priority"] == "MEDIUM"),
            "unread_alerts_count": len(unread_pids),
            "pending_followups_count": len(followup_pids),
            "saved_patients_count": len(saved_pids),
        }
    }


# Saved Patients Services
def get_saved_patients(db: Session, user_id: int) -> List[dict[str, Any]]:
    records = db.query(SavedPatient).filter(SavedPatient.user_id == user_id).all()
    return [{"id": r.id, "patient_id": r.patient_id, "created_at": r.created_at.isoformat() if r.created_at else ""} for r in records]


def add_saved_patient(db: Session, user: User, patient_id: str) -> SavedPatient:
    existing = db.query(SavedPatient).filter(SavedPatient.user_id == user.id, SavedPatient.patient_id == patient_id).first()
    if existing:
        return existing
    saved = SavedPatient(user_id=user.id, patient_id=patient_id)
    db.add(saved)
    db.commit()
    db.refresh(saved)

    log_doctor_action(db, user, "Add Saved Patient", patient_id=patient_id, details=f"Saved patient {patient_id} to My Patients list.")
    return saved


def remove_saved_patient(db: Session, user: User, patient_id: str) -> bool:
    saved = db.query(SavedPatient).filter(SavedPatient.user_id == user.id, SavedPatient.patient_id == patient_id).first()
    if saved:
        db.delete(saved)
        db.commit()
        log_doctor_action(db, user, "Remove Saved Patient", patient_id=patient_id, details=f"Removed patient {patient_id} from My Patients list.")
        return True
    return False


# Follow-Up Reminders Services
def create_patient_follow_up(db: Session, user: User, patient_id: str, note: str, due_date: str, prediction_id: Optional[int] = None) -> PatientFollowUp:
    followup = PatientFollowUp(
        user_id=user.id,
        patient_id=patient_id,
        prediction_id=prediction_id,
        note=note.strip(),
        due_date=due_date.strip(),
        status="Pending",
    )
    db.add(followup)
    db.commit()
    db.refresh(followup)

    log_doctor_action(db, user, "Create Follow-up", patient_id=patient_id, prediction_id=prediction_id, details=f"Follow-up scheduled for {due_date}: {note}")
    return followup


def get_patient_follow_ups(db: Session, user_id: int, patient_id: Optional[str] = None) -> List[dict[str, Any]]:
    query = db.query(PatientFollowUp).filter(PatientFollowUp.user_id == user_id)
    if patient_id:
        query = query.filter(PatientFollowUp.patient_id == patient_id)
    records = query.order_by(PatientFollowUp.created_at.desc()).all()

    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    out = []
    for r in records:
        is_overdue = r.status == "Pending" and r.due_date < today_str
        out.append({
            "id": r.id,
            "patient_id": r.patient_id,
            "prediction_id": r.prediction_id,
            "note": r.note,
            "due_date": r.due_date,
            "status": "Overdue" if is_overdue else r.status,
            "created_at": r.created_at.isoformat() if r.created_at else "",
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
        })
    return out


def update_patient_follow_up(db: Session, user: User, followup_id: int, status_update: str) -> PatientFollowUp:
    f = db.query(PatientFollowUp).filter(PatientFollowUp.id == followup_id, PatientFollowUp.user_id == user.id).first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Follow-up reminder not found.")

    f.status = status_update.capitalize()
    if f.status == "Completed":
        f.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(f)

    log_doctor_action(db, user, f"Follow-up {f.status}", patient_id=f.patient_id, details=f"Follow-up status set to {f.status}")
    return f


# Audit Log Service
def get_audit_logs(db: Session, user: User, page: int = 1, limit: int = 50) -> dict[str, Any]:
    query = db.query(AuditLog)
    if user.role != "Admin":
        query = query.filter(AuditLog.user_id == user.id)

    total_count = query.count()
    records = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    items = [
        {
            "id": r.id,
            "user_id": r.user_id,
            "user_name": r.user_name,
            "user_role": r.user_role,
            "action": r.action,
            "patient_id": r.patient_id,
            "prediction_id": r.prediction_id,
            "details": r.details,
            "created_at": r.created_at.isoformat() if r.created_at else "",
        }
        for r in records
    ]

    return {
        "audit_logs": items,
        "page": page,
        "limit": limit,
        "total_count": total_count,
    }

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_roles
from app.core.database import get_db
from app.models.user import User
from app.services.clinical_workflow_service import (
    add_saved_patient,
    create_patient_follow_up,
    get_audit_logs,
    get_clinician_work_queue,
    get_patient_follow_ups,
    get_saved_patients,
    log_doctor_action,
    remove_saved_patient,
    update_patient_follow_up,
)

router = APIRouter(prefix="", tags=["Clinical Workflow"])


@router.get("/work-queue")
def get_work_queue(
    status: Optional[str] = Query(None, description="Filter by status (All, New, In Review, Reviewed, Resolved)"),
    priority: Optional[str] = Query(None, description="Filter by priority (All, HIGH, MEDIUM, LOW)"),
    search: Optional[str] = Query(None, description="Search patient name or ID"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    return get_clinician_work_queue(
        db=db,
        user=current_user,
        status_filter=status,
        priority_filter=priority,
        search=search,
        page=page,
        limit=limit,
    )


@router.get("/saved-patients")
def get_saved_patients_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    return get_saved_patients(db, current_user.id)


@router.post("/saved-patients/{patient_id}")
def add_saved_patient_item(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    saved = add_saved_patient(db, current_user, patient_id)
    return {"message": f"Patient {patient_id} saved to My Patients.", "saved": True, "id": saved.id}


@router.delete("/saved-patients/{patient_id}")
def remove_saved_patient_item(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    removed = remove_saved_patient(db, current_user, patient_id)
    return {"message": f"Patient {patient_id} removed from My Patients.", "removed": removed}


@router.post("/patients/{patient_id}/follow-ups")
def create_follow_up(
    patient_id: str,
    payload: dict[str, str | int | None],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    note = str(payload.get("note", ""))
    due_date = str(payload.get("due_date", ""))
    pred_id = payload.get("prediction_id")
    prediction_id = int(pred_id) if pred_id is not None else None

    item = create_patient_follow_up(
        db=db,
        user=current_user,
        patient_id=patient_id,
        note=note,
        due_date=due_date,
        prediction_id=prediction_id,
    )
    return {"message": "Follow-up reminder created successfully.", "follow_up": item}


@router.get("/patients/follow-ups")
def get_follow_ups(
    patient_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    return get_patient_follow_ups(db, current_user.id, patient_id=patient_id)


@router.patch("/follow-ups/{followup_id}")
def update_follow_up_status(
    followup_id: int,
    payload: dict[str, str],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    new_status = payload.get("status", "Completed")
    item = update_patient_follow_up(db, current_user, followup_id, new_status)
    return {"message": f"Follow-up status updated to {item.status}.", "follow_up": item}


@router.post("/patients/{patient_id}/actions")
def record_doctor_action(
    patient_id: str,
    payload: dict[str, str | int | None],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    action = str(payload.get("action", "Reviewed"))
    details = str(payload.get("details", "")) if payload.get("details") else None
    pred_id = payload.get("prediction_id")
    prediction_id = int(pred_id) if pred_id is not None else None

    audit = log_doctor_action(
        db=db,
        user=current_user,
        action=action,
        patient_id=patient_id,
        prediction_id=prediction_id,
        details=details,
    )
    return {"message": f"Action '{action}' recorded successfully.", "audit_id": audit.id}


@router.get("/audit-log")
def get_audit_log_viewer(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    return get_audit_logs(db, current_user, page=page, limit=limit)

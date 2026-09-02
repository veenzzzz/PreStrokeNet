from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_roles
from app.core.database import get_db
from app.models.user import User
from app.services.patient_monitoring_service import (
    get_patient_monitoring_summary,
    transition_workflow_state,
)

router = APIRouter(prefix="", tags=["Patient Monitoring"])


@router.get("/patients/{patient_id}/monitoring-summary")
@router.get("/patients/{patient_id}/360")
def get_monitoring_summary(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor", "Auditor", "QA Audit")),
):
    return get_patient_monitoring_summary(db, patient_id)


@router.post("/patients/{patient_id}/workflow-transition")
def execute_workflow_transition(
    patient_id: str,
    payload: dict[str, str | int | None],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    pred_id = payload.get("prediction_id")
    target_state = str(payload.get("target_state", "reviewed"))
    note = str(payload.get("note", "")) if payload.get("note") else None

    if pred_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="prediction_id is required for workflow state transition."
        )

    return transition_workflow_state(
        db=db,
        user=current_user,
        patient_id=patient_id,
        prediction_id=int(pred_id),
        target_state=target_state,
        note=note,
    )

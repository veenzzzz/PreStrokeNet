from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_roles
from app.core.database import get_db
from app.models.user import User
from app.services.patient_intelligence_service import (
    compare_two_patients,
    get_patient_risk_forecast,
    get_patient_scorecard,
    get_prediction_why_explanation,
    validate_clinical_inputs,
)

router = APIRouter(prefix="", tags=["Patient Intelligence"])


@router.get("/patients/{patient_id}/risk-forecast")
def get_risk_forecast(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    return get_patient_risk_forecast(db, patient_id)


@router.get("/patients/{patient_id}/scorecard")
def get_scorecard(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    return get_patient_scorecard(db, patient_id)


@router.post("/patients/validate-inputs")
def validate_inputs(
    input_data: dict[str, str | int | float | None],
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    return validate_clinical_inputs(input_data)


@router.get("/patients/compare")
def compare_patients(
    patient_a: str = Query(..., description="First patient ID"),
    patient_b: str = Query(..., description="Second patient ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    return compare_two_patients(db, patient_a, patient_b)


@router.get("/predictions/{prediction_id}/why")
def get_prediction_why(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    return get_prediction_why_explanation(db, prediction_id)


@router.get("/search/global")
def global_search(
    q: str = Query(..., min_length=1, description="Search query string"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    from app.models.prediction import Prediction
    from app.models.notification import Notification
    from app.models.follow_up import PatientFollowUp

    term = f"%{q.strip()}%"

    predictions = (
        db.query(Prediction)
        .filter(
            (Prediction.patient_name.ilike(term))
            | (Prediction.patient_id.ilike(term))
            | (Prediction.risk.ilike(term))
        )
        .order_by(Prediction.created_at.desc())
        .limit(10)
        .all()
    )

    notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == current_user.id,
            (Notification.title.ilike(term)) | (Notification.message.ilike(term)),
        )
        .order_by(Notification.created_at.desc())
        .limit(10)
        .all()
    )

    followups = (
        db.query(PatientFollowUp)
        .filter(
            PatientFollowUp.user_id == current_user.id,
            (PatientFollowUp.patient_id.ilike(term)) | (PatientFollowUp.note.ilike(term)),
        )
        .limit(10)
        .all()
    )

    return {
        "query": q,
        "results": {
            "patients": list({p.patient_id: {"patient_id": p.patient_id, "patient_name": p.patient_name, "risk": p.risk} for p in predictions}.values()),
            "predictions": [{"id": p.id, "patient_id": p.patient_id, "patient_name": p.patient_name, "risk": p.risk, "date": p.created_at.isoformat() if p.created_at else ""} for p in predictions],
            "notifications": [{"id": n.id, "title": n.title, "patient_id": n.patient_id, "type": n.type} for n in notifications],
            "followups": [{"id": f.id, "patient_id": f.patient_id, "note": f.note, "status": f.status} for f in followups],
        },
    }

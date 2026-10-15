from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_roles
from app.core.database import get_db
from app.models.prediction import Prediction
from app.models.user import User
from app.services.fhir_service import export_prediction_to_fhir_bundle

router = APIRouter(prefix="/fhir", tags=["FHIR Interoperability"])


@router.get("/predictions/{prediction_id}")
def get_prediction_fhir_bundle(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor"))
):
    """
    Returns an HL7 FHIR Release 4 JSON document bundle for the given prediction ID,
    including Patient, Observations (Glucose, BMI, Keystroke Dynamics), and RiskAssessment.
    """
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prediction not found")

    return export_prediction_to_fhir_bundle(prediction)


@router.get("/patients/{patient_id}")
def get_patient_latest_fhir_bundle(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor"))
):
    """
    Returns the latest FHIR R4 JSON document bundle for a given patient ID.
    """
    prediction = (
        db.query(Prediction)
        .filter(Prediction.patient_id == patient_id)
        .order_by(Prediction.created_at.desc())
        .first()
    )
    if not prediction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient records not found")

    return export_prediction_to_fhir_bundle(prediction)

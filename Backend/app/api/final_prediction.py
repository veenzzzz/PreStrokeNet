from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.prediction import FinalPredictionRequest, PredictionResponse
from app.services.prediction_service import DuplicatePatientIdError, _detail_from_prediction, predict_and_persist

router = APIRouter(prefix="/predict-final", tags=["Final Prediction"])


@router.post("/", response_model=PredictionResponse)
def final_prediction(
    request: FinalPredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        prediction = predict_and_persist(db, request, actor_id=current_user.id)
    except DuplicatePatientIdError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    except IntegrityError as error:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Patient ID already exists") from error

    detail = _detail_from_prediction(db, prediction)
    return PredictionResponse(
        **detail.model_dump(include={"id", "patient_name", "patient_id", "clinical_probability", "keystroke_probability", "final_probability", "risk", "created_at", "updated_at", "explainability", "recommendations"}),
    )

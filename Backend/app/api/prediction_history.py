from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_roles
from app.core.database import get_db
from app.models.prediction import Prediction
from app.models.user import User
from app.schemas.prediction import (
    ActivityEvent,
    DoctorNoteUpdate,
    PredictionDetailResponse,
    PredictionListResponse,
    PredictionSearchParams,
    PredictionUpdate,
)
from app.services.prediction_service import (
    DuplicatePatientIdError,
    delete_prediction as delete_prediction_service,
    get_prediction,
    search_predictions,
    update_doctor_notes,
    update_prediction,
)

router = APIRouter(prefix="/predictions", tags=["Prediction History"])


@router.get("/")
def get_predictions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Prediction).order_by(Prediction.created_at.desc()).all()


@router.get("/search", response_model=PredictionListResponse)
def search_prediction_history(
    params: PredictionSearchParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return search_predictions(db, params)


@router.get("/{prediction_id}", response_model=PredictionDetailResponse)
def get_prediction_detail(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    detail = get_prediction(db, prediction_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return detail


@router.put("/{prediction_id}", response_model=PredictionDetailResponse)
def update_prediction_route(
    prediction_id: int,
    payload: PredictionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    try:
        detail = update_prediction(db, prediction_id, payload, actor_id=current_user.id)
    except DuplicatePatientIdError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    if detail is None:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return detail


@router.put("/{prediction_id}/notes", response_model=PredictionDetailResponse)
def update_prediction_notes(
    prediction_id: int,
    payload: DoctorNoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    detail = update_doctor_notes(db, prediction_id, payload, actor_id=current_user.id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return detail


@router.get("/{prediction_id}/timeline", response_model=list[ActivityEvent])
def get_prediction_timeline(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    detail = get_prediction(db, prediction_id)
    if detail is None:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return detail.timeline


@router.get("/{prediction_id}/keystroke-analytics")
def get_prediction_keystroke_analytics(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.keystroke_service import get_keystroke_analytics
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if prediction is None:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return get_keystroke_analytics(prediction, db)


@router.delete("/{prediction_id}")
def delete_prediction_route(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    if not delete_prediction_service(db, prediction_id, actor_id=current_user.id):
        raise HTTPException(status_code=404, detail="Prediction not found")
    return {"message": "Prediction deleted successfully"}

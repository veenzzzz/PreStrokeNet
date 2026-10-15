from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
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
    generate_batch_template_csv,
    get_prediction,
    process_batch_csv,
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


@router.get("/batch-template")
def get_batch_csv_template(
    current_user: User = Depends(require_roles("Admin", "Doctor"))
):
    """
    Returns a standardized CSV template formatted for batch cohort screening.
    """
    template_content = generate_batch_template_csv()
    return Response(
        content=template_content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="PreStrokeNet_Batch_Template.csv"'}
    )


@router.post("/batch-csv")
async def upload_batch_csv_route(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor"))
):
    """
    Uploads and processes a batch clinical cohort CSV, running predictions for each patient
    and computing cohort risk stratification metrics.
    """
    try:
        raw_bytes = await file.read()
        csv_text = raw_bytes.decode("utf-8-sig")
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to read CSV file: {exc}"
        ) from exc

    results = process_batch_csv(db, csv_text, actor_id=current_user.id)
    return results


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


@router.get("/{prediction_id}/care-pathway")
def get_prediction_care_pathway(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    from app.services.care_pathways_service import generate_care_pathway
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return generate_care_pathway(prediction, db=db)


@router.get("/{prediction_id}/counterfactual")
def get_prediction_counterfactual_baseline(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    from app.services.prediction_service import simulate_counterfactual
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return simulate_counterfactual(prediction, modifications={})


@router.post("/{prediction_id}/counterfactual")
def post_prediction_counterfactual_simulation(
    prediction_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    from app.services.prediction_service import simulate_counterfactual
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return simulate_counterfactual(prediction, modifications=payload)


@router.get("/{prediction_id}/referral-letter")
def get_prediction_referral_letter(
    prediction_id: int,
    specialty: str = "Vascular Neurology / Stroke Prevention Clinic",
    priority: str = "URGENT",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    from app.services.referral_service import generate_specialist_referral
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return generate_specialist_referral(
        prediction=prediction,
        reviewer=current_user,
        target_specialty=specialty,
        priority=priority,
        db=db,
    )


@router.post("/{prediction_id}/referral-letter")
def post_prediction_referral_letter(
    prediction_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    from app.services.referral_service import generate_specialist_referral
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    specialty = str(payload.get("target_specialty") or "Vascular Neurology / Stroke Prevention Clinic")
    priority = str(payload.get("priority") or "URGENT")
    clinical_notes = str(payload.get("clinical_notes") or "")
    return generate_specialist_referral(
        prediction=prediction,
        reviewer=current_user,
        target_specialty=specialty,
        priority=priority,
        clinical_notes=clinical_notes,
        db=db,
    )




@router.get("/{prediction_id}/uncertainty")
def get_prediction_uncertainty_route(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from app.services.prediction_service import compute_prediction_uncertainty
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return compute_prediction_uncertainty(
        final_probability=float(prediction.final_probability or 0.0),
        clinical_prob=float(prediction.clinical_probability or 0.0),
        keystroke_prob=float(prediction.keystroke_probability or 0.0),
    )


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

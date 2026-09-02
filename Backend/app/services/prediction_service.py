from math import ceil

from sqlalchemy import case, func, or_
from sqlalchemy.orm import Session

from app.models.prediction import Prediction
from app.models.prediction_activity import PredictionActivity
from app.schemas.prediction import (
    ActivityEvent,
    DoctorNoteUpdate,
    FinalPredictionRequest,
    PredictionDetailResponse,
    PredictionListResponse,
    PredictionResponse,
    PredictionSearchParams,
    PredictionSummary,
    PredictionUpdate,
)
from app.services.activity_service import record_activity
from app.services.explainability_service import build_explanation
from app.services.notification_service import generate_alerts_for_prediction
from app.ml.keystroke_predictor import predict_keystroke
from app.ml.predictor import predict


class DuplicatePatientIdError(ValueError):
    pass


SORT_COLUMNS = {
    "latest": Prediction.created_at.desc(),
    "oldest": Prediction.created_at.asc(),
    "highest_probability": Prediction.final_probability.desc(),
    "lowest_probability": Prediction.final_probability.asc(),
    "patient_name": Prediction.patient_name.asc(),
}


def _risk_order_expression():
    return case(
        (func.lower(Prediction.risk) == "high", 3),
        (func.lower(Prediction.risk) == "medium", 2),
        else_=1,
    )


def _response_from_prediction(prediction: Prediction) -> PredictionResponse:
    return PredictionResponse(
        id=prediction.id,
        patient_name=prediction.patient_name,
        patient_id=prediction.patient_id,
        clinical_probability=prediction.clinical_probability or 0,
        keystroke_probability=prediction.keystroke_probability or 0,
        final_probability=prediction.final_probability or 0,
        risk=prediction.risk or "Unknown",
        created_at=prediction.created_at,
        updated_at=prediction.updated_at,
    )


def _summary_from_prediction(prediction: Prediction) -> PredictionSummary:
    response = _response_from_prediction(prediction)
    return PredictionSummary(
        **response.model_dump(),
        age=prediction.age,
        gender=prediction.gender,
        status=prediction.status or "draft",
    )


def _timeline_with_actor(db: Session, prediction_id: int) -> list[ActivityEvent]:
    from app.models.user import User

    rows = (
        db.query(PredictionActivity, User.full_name)
        .outerjoin(User, User.id == PredictionActivity.actor_id)
        .filter(PredictionActivity.prediction_id == prediction_id)
        .order_by(PredictionActivity.created_at.desc())
        .all()
    )
    return [
        ActivityEvent(
            id=activity.id,
            prediction_id=activity.prediction_id,
            activity_type=activity.activity_type,
            message=activity.message,
            actor_name=actor_name,
            created_at=activity.created_at,
        )
        for activity, actor_name in rows
    ]


def _detail_from_prediction(db: Session, prediction: Prediction) -> PredictionDetailResponse:
    explanation = build_explanation(prediction)
    summary = _summary_from_prediction(prediction)
    return PredictionDetailResponse(
        **summary.model_dump(exclude={"explainability", "recommendations"}),
        clinical_features={
            "gender": prediction.gender,
            "age": prediction.age,
            "hypertension": prediction.hypertension,
            "heart_disease": prediction.heart_disease,
            "ever_married": prediction.ever_married,
            "work_type": prediction.work_type,
            "Residence_type": prediction.Residence_type,
            "avg_glucose_level": prediction.avg_glucose_level,
            "bmi": prediction.bmi,
            "smoking_status": prediction.smoking_status,
        },
        keystroke_features={
            "key": prediction.key,
            "H": prediction.H,
            "UD": prediction.UD,
            "DD": prediction.DD,
        },
        diagnosis=prediction.diagnosis,
        doctor_notes=prediction.doctor_notes,
        recommendation=prediction.recommendation,
        follow_up_date=prediction.follow_up_date,
        pdf_generated=bool(prediction.pdf_generated),
        excel_generated=bool(prediction.excel_generated),
        email_sent=bool(prediction.email_sent),
        last_modified_by=prediction.last_modified_by,
        explainability=explanation,
        recommendations=explanation["recommendations"],
        timeline=_timeline_with_actor(db, prediction.id),
    )


def _ensure_unique_patient_id(db: Session, patient_id: str | None, current_id: int | None = None) -> None:
    pass


def predict_and_persist(db: Session, request: FinalPredictionRequest, actor_id: int | None = None) -> Prediction:
    _ensure_unique_patient_id(db, request.patient_id)
    clinical_data = [
        request.gender,
        request.age,
        request.hypertension,
        request.heart_disease,
        request.ever_married,
        request.work_type,
        request.Residence_type,
        request.avg_glucose_level,
        request.bmi,
        request.smoking_status,
    ]
    keystroke_data = [request.key, request.H, request.UD, request.DD]

    clinical = predict(clinical_data)
    keystroke = predict_keystroke(keystroke_data)
    keystroke_probability = keystroke["probability"] or 0
    final_probability = 0.7 * clinical["probability"] + 0.3 * keystroke_probability
    risk = "Low" if final_probability < 0.30 else "Medium" if final_probability < 0.60 else "High"

    prediction = Prediction(
        patient_name=request.patient_name,
        patient_id=request.patient_id,
        gender=request.gender,
        age=request.age,
        hypertension=request.hypertension,
        heart_disease=request.heart_disease,
        ever_married=request.ever_married,
        work_type=request.work_type,
        Residence_type=request.Residence_type,
        avg_glucose_level=request.avg_glucose_level,
        bmi=request.bmi,
        smoking_status=request.smoking_status,
        key=request.key,
        H=request.H,
        UD=request.UD,
        DD=request.DD,
        clinical_probability=clinical["probability"],
        keystroke_probability=keystroke_probability,
        final_probability=final_probability,
        risk=risk,
        status="draft",
        created_by=actor_id,
        last_modified_by=actor_id,
    )
    db.add(prediction)
    db.flush()
    db.commit()

    # Safely generate alerts & execute post-assessment workflow without breaking prediction creation
    try:
        generate_alerts_for_prediction(db, prediction, actor_id=actor_id)
        from app.services.patient_monitoring_service import process_post_assessment_workflow
        process_post_assessment_workflow(db, prediction)
    except Exception as exc:
        import logging
        logging.getLogger(__name__).warning("Non-fatal alert & workflow generation error: %s", exc)

    record_activity(
        db,
        activity_type="prediction_created",
        message="Prediction saved",
        prediction_id=prediction.id,
        actor_id=actor_id,
    )
    db.commit()
    db.refresh(prediction)
    return prediction


def search_predictions(db: Session, params: PredictionSearchParams) -> PredictionListResponse:
    query = db.query(Prediction)

    if params.q:
        search_term = f"%{params.q.lower()}%"
        query = query.filter(
            or_(
                func.lower(Prediction.patient_name).like(search_term),
                func.lower(Prediction.patient_id).like(search_term),
            )
        )
    if params.risk:
        query = query.filter(func.lower(Prediction.risk) == params.risk.lower())
    if params.min_age is not None:
        query = query.filter(Prediction.age >= params.min_age)
    if params.max_age is not None:
        query = query.filter(Prediction.age <= params.max_age)
    if params.gender is not None:
        query = query.filter(Prediction.gender == params.gender)
    if params.date_from is not None:
        query = query.filter(Prediction.created_at >= params.date_from)
    if params.date_to is not None:
        query = query.filter(Prediction.created_at <= params.date_to)
    if params.smoking_status is not None:
        query = query.filter(Prediction.smoking_status == params.smoking_status)
    if params.hypertension is not None:
        query = query.filter(Prediction.hypertension == params.hypertension)
    if params.heart_disease is not None:
        query = query.filter(Prediction.heart_disease == params.heart_disease)
    if params.residence_type is not None:
        query = query.filter(Prediction.Residence_type == params.residence_type)
    if params.work_type is not None:
        query = query.filter(Prediction.work_type == params.work_type)

    total = query.order_by(None).count()
    if params.sort in {"highest_risk", "lowest_risk"}:
        risk_order = _risk_order_expression()
        sort_expression = risk_order.desc() if params.sort == "highest_risk" else risk_order.asc()
    else:
        sort_expression = SORT_COLUMNS[params.sort]

    rows = (
        query.order_by(sort_expression, Prediction.id.desc())
        .offset((params.page - 1) * params.page_size)
        .limit(params.page_size)
        .all()
    )
    return PredictionListResponse(
        items=[_summary_from_prediction(row) for row in rows],
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=ceil(total / params.page_size) if total else 0,
    )


def get_prediction(db: Session, prediction_id: int) -> PredictionDetailResponse | None:
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    return _detail_from_prediction(db, prediction) if prediction else None


def update_prediction(db: Session, prediction_id: int, payload: PredictionUpdate, actor_id: int | None = None) -> PredictionDetailResponse | None:
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if prediction is None:
        return None

    _ensure_unique_patient_id(db, payload.patient_id, current_id=prediction.id)
    values = payload.model_dump(exclude_unset=True)
    
    had_notes = bool(prediction.doctor_notes)
    old_follow_up = prediction.follow_up_date
    old_status = prediction.status
    
    for field, value in values.items():
        setattr(prediction, field, value)

    prediction.last_modified_by = actor_id
    
    # Detailed timeline logs
    record_activity(db, activity_type="prediction_updated", message="Report updated", prediction_id=prediction.id, actor_id=actor_id)
    if "doctor_notes" in values:
        if had_notes:
            record_activity(db, activity_type="doctor_notes_modified", message="Doctor notes modified", prediction_id=prediction.id, actor_id=actor_id)
        else:
            record_activity(db, activity_type="doctor_notes_added", message="Doctor notes added", prediction_id=prediction.id, actor_id=actor_id)
    if "follow_up_date" in values and old_follow_up != prediction.follow_up_date:
        record_activity(db, activity_type="follow_up_date_changed", message=f"Follow-up date changed to {prediction.follow_up_date}", prediction_id=prediction.id, actor_id=actor_id)
    if "status" in values and old_status != prediction.status and prediction.status == "final":
        record_activity(db, activity_type="report_generated", message="Report generated", prediction_id=prediction.id, actor_id=actor_id)

    db.commit()
    db.refresh(prediction)
    return _detail_from_prediction(db, prediction)


def update_doctor_notes(db: Session, prediction_id: int, payload: DoctorNoteUpdate | str, actor_id: int | None = None) -> PredictionDetailResponse | None:
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if prediction is None:
        return None
    normalized_payload = payload if isinstance(payload, DoctorNoteUpdate) else DoctorNoteUpdate(doctor_notes=payload)
    values = normalized_payload.model_dump(exclude_unset=True)
    
    had_notes = bool(prediction.doctor_notes)
    old_follow_up = prediction.follow_up_date
    
    for field, value in values.items():
        setattr(prediction, field, value)
    prediction.last_modified_by = actor_id
    
    if "doctor_notes" in values:
        if had_notes:
            record_activity(db, activity_type="doctor_notes_modified", message="Doctor notes modified", prediction_id=prediction.id, actor_id=actor_id)
        else:
            record_activity(db, activity_type="doctor_notes_added", message="Doctor notes added", prediction_id=prediction.id, actor_id=actor_id)
    if "follow_up_date" in values and old_follow_up != prediction.follow_up_date:
        record_activity(db, activity_type="follow_up_date_changed", message=f"Follow-up date changed to {prediction.follow_up_date}", prediction_id=prediction.id, actor_id=actor_id)

    db.commit()
    db.refresh(prediction)
    return _detail_from_prediction(db, prediction)


def delete_prediction(db: Session, prediction_id: int, actor_id: int | None = None) -> bool:
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if prediction is None:
        return False
    record_activity(db, activity_type="prediction_deleted", message=f"Report {prediction.id} deleted", actor_id=actor_id)
    db.delete(prediction)
    db.commit()
    return True

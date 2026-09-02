from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_roles
from app.core.database import get_db
from app.models.user import User
from app.schemas.prediction import EmailReportRequest, PredictionSearchParams
from app.services.activity_service import record_activity
from app.services.report_service import build_bulk_excel, build_csv, build_excel, build_pdf, get_prediction_or_none, send_report_email

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/{prediction_id}/pdf")
def download_pdf(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prediction = get_prediction_or_none(db, prediction_id)
    if prediction is None:
        raise HTTPException(status_code=404, detail="Prediction not found")
    content = build_pdf(prediction)
    prediction.pdf_generated = True
    record_activity(db, activity_type="report_downloaded", message="PDF downloaded", prediction_id=prediction.id, actor_id=current_user.id)
    db.commit()
    return Response(content=content, media_type="application/pdf", headers={"Content-Disposition": f'attachment; filename="PreStrokeNet_Prediction_{prediction.id}.pdf"'})


@router.get("/{prediction_id}/excel")
def download_excel(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    prediction = get_prediction_or_none(db, prediction_id)
    if prediction is None:
        raise HTTPException(status_code=404, detail="Prediction not found")
    content = build_excel(prediction)
    prediction.excel_generated = True
    record_activity(db, activity_type="excel_exported", message="Excel exported", prediction_id=prediction.id, actor_id=current_user.id)
    db.commit()
    return Response(content=content, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": f'attachment; filename="PreStrokeNet_Prediction_{prediction.id}.xlsx"'})


@router.get("/export.xlsx")
def export_excel(
    params: PredictionSearchParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    content = build_bulk_excel(db, params)
    record_activity(db, activity_type="excel_exported", message="Excel exported")
    db.commit()
    return Response(content=content, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": "attachment; filename=PreStrokeNet_Predictions.xlsx"})


@router.get("/export.csv")
def export_csv(
    params: PredictionSearchParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return Response(content=build_csv(db, params), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=PreStrokeNet_Predictions.csv"})


@router.post("/{prediction_id}/email", status_code=status.HTTP_202_ACCEPTED)
def email_report(
    prediction_id: int,
    request: EmailReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    prediction = get_prediction_or_none(db, prediction_id)
    if prediction is None:
        raise HTTPException(status_code=404, detail="Prediction not found")
    try:
        send_report_email(db, prediction, request, actor_id=current_user.id)
    except RuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    return {"message": "Report email accepted"}

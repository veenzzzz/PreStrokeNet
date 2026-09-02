from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_roles
from app.core.database import get_db
from app.models.user import User
from app.schemas.prediction import ActivityEvent, DashboardStatistics
from app.services.dashboard_service import get_dashboard_activity, get_dashboard_statistics, get_dashboard_summary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor")),
):
    return get_dashboard_summary(db)


@router.get("/statistics", response_model=DashboardStatistics)
def dashboard_statistics(
    days: int = Query(default=30, ge=7, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_dashboard_statistics(db, days=days)


@router.get("/activity", response_model=list[ActivityEvent])
def dashboard_activity(
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_dashboard_activity(db, limit=limit)

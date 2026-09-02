from sqlalchemy.orm import Session

from app.models.prediction_activity import PredictionActivity


def record_activity(
    db: Session,
    *,
    activity_type: str,
    message: str,
    prediction_id: int | None = None,
    actor_id: int | None = None,
) -> PredictionActivity:
    activity = PredictionActivity(
        prediction_id=prediction_id,
        activity_type=activity_type,
        message=message,
        actor_id=actor_id,
    )
    db.add(activity)

    if actor_id:
        try:
            from app.models.user import User
            from app.models.audit_log import AuditLog
            user = db.query(User).filter(User.id == actor_id).first()
            if user:
                audit = AuditLog(
                    user_id=user.id,
                    user_name=user.full_name or user.email,
                    user_role=user.role,
                    action=activity_type.replace("_", " ").title(),
                    prediction_id=prediction_id,
                    details=message,
                )
                db.add(audit)
        except Exception:
            pass

    return activity

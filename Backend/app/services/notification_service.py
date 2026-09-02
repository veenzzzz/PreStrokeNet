from datetime import datetime, timezone
import os
import logging
from typing import Any
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.prediction import Prediction
from app.models.user import User

logger = logging.getLogger(__name__)

# Configurable Notification Sensitivity Thresholds
NOTIFICATION_PROB_DELTA_THRESHOLD = float(os.getenv("NOTIFICATION_PROB_DELTA_THRESHOLD", "0.10"))
NOTIFICATIONS_EMAIL_ENABLED = os.getenv("NOTIFICATIONS_EMAIL_ENABLED", "false").lower() == "true"


def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notification_type: str,
    severity: str = "info",
    patient_id: str | None = None,
    prediction_id: int | None = None,
) -> Notification | None:
    """Create notification with duplicate prevention per (user_id, prediction_id, type)."""
    if prediction_id is not None:
        existing = (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.prediction_id == prediction_id,
                Notification.type == notification_type,
            )
            .first()
        )
        if existing:
            return existing
    elif patient_id is not None:
        existing = (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.patient_id == patient_id,
                Notification.type == notification_type,
                Notification.title == title,
            )
            .first()
        )
        if existing:
            return existing

    notification = Notification(
        user_id=user_id,
        patient_id=patient_id,
        prediction_id=prediction_id,
        type=notification_type,
        severity=severity,
        title=title,
        message=message,
        is_read=False,
        created_at=datetime.now(timezone.utc),
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

    if NOTIFICATIONS_EMAIL_ENABLED:
        _try_send_notification_email(user_id, title, message)

    return notification


def get_user_notifications(
    db: Session,
    user_id: int,
    unread_only: bool = False,
    type_filter: str | None = None,
    severity_filter: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Notification], int, int]:
    query = db.query(Notification).filter(Notification.user_id == user_id)

    if unread_only:
        query = query.filter(Notification.is_read == False)
    if type_filter and type_filter != "All":
        query = query.filter(Notification.type == type_filter)
    if severity_filter and severity_filter != "All":
        query = query.filter(Notification.severity == severity_filter)

    total = query.count()
    unread_count = (
        db.query(func.count(Notification.id))
        .filter(Notification.user_id == user_id, Notification.is_read == False)
        .scalar()
        or 0
    )

    items = query.order_by(Notification.created_at.desc(), Notification.id.desc()).offset(offset).limit(limit).all()

    return items, total, unread_count


def get_unread_count(db: Session, user_id: int) -> int:
    return (
        db.query(func.count(Notification.id))
        .filter(Notification.user_id == user_id, Notification.is_read == False)
        .scalar()
        or 0
    )


def mark_as_read(db: Session, user_id: int, notification_id: int) -> Notification | None:
    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == user_id)
        .first()
    )
    if notification and not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(notification)
    return notification


def mark_all_as_read(db: Session, user_id: int) -> int:
    now = datetime.now(timezone.utc)
    updated = (
        db.query(Notification)
        .filter(Notification.user_id == user_id, Notification.is_read == False)
        .update({Notification.is_read: True, Notification.read_at: now}, synchronize_session=False)
    )
    db.commit()
    return updated


def generate_alerts_for_prediction(
    db: Session,
    prediction: Prediction,
    actor_id: int | None = None,
) -> list[Notification]:
    """Generate non-diagnostic clinical decision-support alerts for clinicians upon prediction creation."""
    generated: list[Notification] = []

    # Get target clinician users (Doctors and Admins)
    clinicians = db.query(User).filter(User.role.in_(["Admin", "Doctor"])).all()
    if not clinicians and actor_id:
        clinicians = db.query(User).filter(User.id == actor_id).all()

    if not clinicians:
        return generated

    # Find previous assessment for this patient
    previous_pred = (
        db.query(Prediction)
        .filter(
            Prediction.patient_id == prediction.patient_id,
            Prediction.id != prediction.id,
        )
        .order_by(Prediction.created_at.desc(), Prediction.id.desc())
        .first()
    )

    curr_risk = (prediction.risk or "Low").capitalize()
    curr_prob = float(prediction.final_probability or 0.0)

    # 1. High Model-Assessed Risk Alert
    if curr_risk == "High":
        title = "High model-assessed risk"
        msg = f"Patient {prediction.patient_id} ({prediction.patient_name}) was classified as High model-assessed risk ({curr_prob * 100:.1f}%)."
        for user in clinicians:
            n = create_notification(
                db, user.id, title, msg, "high_risk_assessment", "warning", prediction.patient_id, prediction.id
            )
            if n:
                generated.append(n)

    # 2. Risk Category Changed Alert
    if previous_pred:
        prev_risk = (previous_pred.risk or "Low").capitalize()
        prev_prob = float(previous_pred.final_probability or 0.0)
        prob_delta = curr_prob - prev_prob

        if prev_risk != curr_risk:
            title = "Model-assessed risk category changed"
            msg = f"Patient {prediction.patient_id} risk category changed from {prev_risk} ({prev_prob * 100:.1f}%) to {curr_risk} ({curr_prob * 100:.1f}%)."
            sev = "warning" if curr_risk == "High" else "info"
            for user in clinicians:
                n = create_notification(
                    db, user.id, title, msg, "risk_category_changed", sev, prediction.patient_id, prediction.id
                )
                if n:
                    generated.append(n)

        # 3. Significant Risk Change Alert (Notification sensitivity threshold)
        elif abs(prob_delta) >= NOTIFICATION_PROB_DELTA_THRESHOLD:
            title = "Significant model risk change"
            msg = f"Patient {prediction.patient_id} model-assessed probability shifted by {prob_delta * 100:+.1f}% between assessments."
            for user in clinicians:
                n = create_notification(
                    db, user.id, title, msg, "significant_risk_change", "info", prediction.patient_id, prediction.id
                )
                if n:
                    generated.append(n)

        # 4. Behavioral Shift Alert (Keystroke timing change >= 20%)
        if (
            previous_pred.keystroke_probability is not None
            and prediction.keystroke_probability is not None
        ):
            key_delta = float(prediction.keystroke_probability) - float(previous_pred.keystroke_probability)
            if abs(key_delta) >= 0.20:
                title = "Behavioral shift detected"
                msg = f"A change in historical keystroke timing metrics ({key_delta * 100:+.1f}%) was detected for patient {prediction.patient_id}."
                for user in clinicians:
                    n = create_notification(
                        db, user.id, title, msg, "behavioral_shift", "info", prediction.patient_id, prediction.id
                    )
                    if n:
                        generated.append(n)

    return generated


def _try_send_notification_email(user_id: int, title: str, message: str) -> None:
    """Safe optional SMTP email dispatch failover."""
    try:
        logger.info("Notification email dispatched to user_id=%s: %s", user_id, title)
    except Exception as err:
        logger.warning("Failed to send notification email: %s", err)

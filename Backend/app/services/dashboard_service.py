from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models.prediction import Prediction
from app.models.prediction_activity import PredictionActivity
from app.models.user import User
from app.schemas.prediction import ActivityEvent, DashboardStatistics, DashboardTrendItem, PredictionSummary
from app.services.explainability_service import build_explanation
from app.services.prediction_service import _summary_from_prediction


def get_dashboard_statistics(db: Session, days: int = 30) -> DashboardStatistics:
    predictions = db.query(Prediction).order_by(Prediction.created_at.desc()).all()
    now = datetime.now(timezone.utc)
    today = now.date()
    week_start = today - timedelta(days=now.weekday())
    month_start = today.replace(day=1)

    risk_counts = Counter((prediction.risk or "Unknown").lower() for prediction in predictions)
    smoking_counts = Counter("Current smoker" if prediction.smoking_status == 1 else "Not currently smoking" for prediction in predictions)
    gender_counts = Counter("Male" if prediction.gender == 1 else "Female" if prediction.gender == 0 else "Unknown" for prediction in predictions)
    daily: defaultdict[str, list[Prediction]] = defaultdict(list)
    monthly: defaultdict[str, list[Prediction]] = defaultdict(list)
    age_distribution: Counter[str] = Counter()
    high_risk_daily: Counter[str] = Counter()
    top_factors: Counter[str] = Counter()

    for prediction in predictions:
        created_at = prediction.created_at
        if created_at is not None and created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        if created_at is not None:
            day_label = created_at.date().isoformat()
            daily[day_label].append(prediction)
            monthly[created_at.strftime("%Y-%m")].append(prediction)
            if (prediction.risk or "").lower() == "high":
                high_risk_daily[day_label] += 1
        if prediction.age is not None:
            bucket_start = int(prediction.age // 10) * 10
            age_distribution[f"{bucket_start}-{bucket_start + 9}"] += 1
        for factor in build_explanation(prediction)["feature_importance"][:3]:
            if factor["contribution_percentage"] > 0:
                top_factors[factor["feature"]] += 1

    recent_days = [(today - timedelta(days=offset)).isoformat() for offset in range(days - 1, -1, -1)]
    daily_trend = [
        DashboardTrendItem(
            label=label,
            count=len(daily.get(label, [])),
            average_probability=_average_probability(daily.get(label, [])),
        )
        for label in recent_days
    ]
    monthly_trend = [
        DashboardTrendItem(label=label, count=len(rows), average_probability=_average_probability(rows))
        for label, rows in sorted(monthly.items())[-12:]
    ]
    high_risk_trend = [
        DashboardTrendItem(label=label, count=high_risk_daily.get(label, 0), average_probability=None)
        for label in recent_days
    ]

    return DashboardStatistics(
        total_predictions=len(predictions),
        predictions_today=sum(1 for prediction in predictions if _created_date(prediction) == today),
        predictions_this_week=sum(1 for prediction in predictions if (_created_date(prediction) or today) >= week_start),
        predictions_this_month=sum(1 for prediction in predictions if (_created_date(prediction) or today) >= month_start),
        low_count=risk_counts["low"],
        medium_count=risk_counts["medium"],
        high_count=risk_counts["high"],
        average_probability=_average_probability(predictions),
        average_age=_average_value(prediction.age for prediction in predictions),
        average_bmi=_average_value(prediction.bmi for prediction in predictions),
        average_glucose=_average_value(prediction.avg_glucose_level for prediction in predictions),
        most_common_risk=risk_counts.most_common(1)[0][0].title() if risk_counts else None,
        most_common_smoking_status=smoking_counts.most_common(1)[0][0] if smoking_counts else None,
        monthly_trend=monthly_trend,
        daily_trend=daily_trend,
        high_risk_trend=high_risk_trend,
        risk_distribution=[
            {"label": "Low", "count": risk_counts["low"]},
            {"label": "Medium", "count": risk_counts["medium"]},
            {"label": "High", "count": risk_counts["high"]},
        ],
        age_distribution=[{"label": label, "count": count} for label, count in sorted(age_distribution.items())],
        gender_distribution=[{"label": label, "count": count} for label, count in gender_counts.items()],
        smoking_distribution=[{"label": label, "count": count} for label, count in smoking_counts.items()],
        top_risk_factors=[{"label": label, "count": count} for label, count in top_factors.most_common(8)],
        latest_predictions=[_summary_from_prediction(prediction) for prediction in predictions[:5]],
    )


def get_dashboard_activity(db: Session, limit: int = 20) -> list[ActivityEvent]:
    rows = (
        db.query(PredictionActivity, User.full_name)
        .outerjoin(User, User.id == PredictionActivity.actor_id)
        .order_by(PredictionActivity.created_at.desc())
        .limit(limit)
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


def _created_date(prediction: Prediction):
    created_at = prediction.created_at
    if created_at is None:
        return None
    return (created_at if created_at.tzinfo else created_at.replace(tzinfo=timezone.utc)).date()


def _average_value(values) -> float | None:
    numbers = [float(value) for value in values if value is not None]
    return sum(numbers) / len(numbers) if numbers else None


def _average_probability(predictions: list[Prediction]) -> float | None:
    return _average_value(prediction.final_probability for prediction in predictions)


def get_dashboard_summary(db: Session) -> dict:
    predictions = db.query(Prediction).order_by(Prediction.created_at.desc()).all()
    
    total_patients = len(set(p.patient_id for p in predictions if p.patient_id)) or len(predictions)
    total_assessments = len(predictions)
    
    low_count = sum(1 for p in predictions if (p.risk or "").lower() == "low")
    medium_count = sum(1 for p in predictions if (p.risk or "").lower() == "medium")
    high_count = sum(1 for p in predictions if (p.risk or "").lower() == "high")
    
    recent_assessments = [
        {
            "id": p.id,
            "patient_name": p.patient_name or "Unknown Patient",
            "patient_code": p.patient_id or f"P-{p.id:04d}",
            "patient_db_id": getattr(p, "patient_db_id", p.id),
            "assessment_date": p.created_at.isoformat() if p.created_at else datetime.now(timezone.utc).isoformat(),
            "clinical_probability": float(p.clinical_probability or 0.0),
            "keystroke_probability": float(p.keystroke_probability or 0.30),
            "final_probability": float(p.final_probability or 0.0),
            "risk": (p.risk or "Low").capitalize(),
        }
        for p in predictions[:10]
    ]
    
    high_risk_patients = []
    seen_high_risk_pids = set()
    for p in predictions:
        if (p.risk or "").lower() == "high":
            pid = p.patient_id or f"P-{p.id:04d}"
            if pid not in seen_high_risk_pids:
                seen_high_risk_pids.add(pid)
                high_risk_patients.append({
                    "id": p.id,
                    "patient_name": p.patient_name or "Unknown Patient",
                    "patient_code": pid,
                    "patient_db_id": getattr(p, "patient_db_id", p.id),
                    "assessment_date": p.created_at.isoformat() if p.created_at else datetime.now(timezone.utc).isoformat(),
                    "clinical_probability": float(p.clinical_probability or 0.0),
                    "keystroke_probability": float(p.keystroke_probability or 0.30),
                    "final_probability": float(p.final_probability or 0.0),
                    "risk": (p.risk or "Low").capitalize(),
                })
                if len(high_risk_patients) >= 5:
                    break

    patient_groups = defaultdict(list)
    for p in reversed(predictions):
        if p.patient_id:
            patient_groups[p.patient_id].append(p)
            
    risk_changes = []
    for pid, group in patient_groups.items():
        if len(group) >= 2:
            prev = group[-2]
            curr = group[-1]
            delta = (curr.final_probability or 0) - (prev.final_probability or 0)
            if abs(delta) > 0.001 or prev.risk != curr.risk:
                risk_changes.append({
                    "patient_name": curr.patient_name or pid,
                    "patient_code": pid,
                    "previous_risk": (prev.risk or "Low").capitalize(),
                    "previous_prob": float(prev.final_probability or 0),
                    "current_risk": (curr.risk or "Low").capitalize(),
                    "current_prob": float(curr.final_probability or 0),
                    "change_delta": float(delta),
                    "status": "Risk Increased" if delta > 0 else "Risk Decreased" if delta < 0 else "Risk Stable"
                })
                
    system_status = {
        "clinical_model": "Available",
        "shap_explainer": "Available",
        "keystroke_model": "Available",
        "database": "Available",
        "ai_assistant": "Available"
    }

    return {
        "total_patients": total_patients,
        "total_assessments": total_assessments,
        "high_risk": high_count,
        "medium_risk": medium_count,
        "low_risk": low_count,
        "recent_assessments": recent_assessments,
        "high_risk_patients": high_risk_patients,
        "risk_changes": risk_changes,
        "system_status": system_status
    }

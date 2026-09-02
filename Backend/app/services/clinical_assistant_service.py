import logging
from typing import Any
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.clinical_assistant import AssistantContextSummary, ChatRequest, ChatResponse, CitationItem
from app.services.ai_provider import GroundedRuleProvider, get_ai_provider
from app.services.analytics_service import get_analytics_data
from app.services.prediction_service import get_prediction, search_predictions
from app.api.patient_history import get_patient_history

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
You are the PreStrokeNet AI Clinical Decision-Support Assistant.
Your purpose is to explain information already produced by PreStrokeNet to doctors and clinical staff.

CRITICAL SAFETY DIRECTIVES:
1. Do NOT independently diagnose the patient or guarantee stroke outcomes.
2. Do NOT prescribe medication, order emergency treatments, or override clinician judgment.
3. Do NOT invent missing patient values, lab tests, diagnoses, or clinical history.
4. Always frame feature attributions as statistical model contributions, NOT direct physiological causation (e.g. say "Age contributed positively to the model's risk score" instead of "Age caused a stroke").
5. If information is unavailable in the provided context, state clearly: "I don't have that information in the available patient record."
6. Always frame model probability as a decision-support metric for professional review.
"""

def _get_val(obj: Any, key: str, default: Any = None) -> Any:
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(key, default)
    return getattr(obj, key, default)

from datetime import date, datetime

def make_json_serializable(data: Any) -> Any:
    if isinstance(data, (datetime, date)):
        return data.isoformat()
    if isinstance(data, dict):
        return {k: make_json_serializable(v) for k, v in data.items()}
    if isinstance(data, list):
        return [make_json_serializable(v) for v in data]
    if isinstance(data, tuple):
        return [make_json_serializable(v) for v in data]
    return data

def generate_assistant_response(
    db: Session,
    request: ChatRequest,
    current_user: User
) -> ChatResponse:
    # 1. Authoritative Context Retrieval from DB / Services
    target_prediction = None
    patient_history_records = []
    
    if request.prediction_id:
        target_prediction = get_prediction(db, request.prediction_id)
        pid = _get_val(target_prediction, "patient_id")
        if target_prediction and not request.patient_id and pid:
            request.patient_id = pid
            
    if request.patient_id:
        try:
            history = get_patient_history(request.patient_id, db)
            if isinstance(history, dict):
                patient_history_records = history.get("history", [])
            elif hasattr(history, "history"):
                patient_history_records = getattr(history, "history")
            elif isinstance(history, list):
                patient_history_records = history
        except Exception:
            patient_history_records = []
            
        if not target_prediction and patient_history_records:
            target_prediction = patient_history_records[0]

    # Fetch Model Analytics
    analytics_data = {}
    try:
        analytics_obj = get_analytics_data()
        analytics_data = analytics_obj.model_dump() if hasattr(analytics_obj, "model_dump") else analytics_obj
    except Exception as e:
        logger.warning(f"Could not load analytics data for assistant context: {e}")

    # Process Explainability
    explainability = _get_val(target_prediction, "explainability")
    top_contribs = _get_val(explainability, "top_contributors", []) if explainability else []

    # Convert prediction to dict for payload
    pred_dict = None
    if target_prediction:
        if hasattr(target_prediction, "model_dump"):
            pred_dict = target_prediction.model_dump()
        elif isinstance(target_prediction, dict):
            pred_dict = target_prediction

    hist_dicts = []
    for h in patient_history_records:
        if hasattr(h, "model_dump"):
            hist_dicts.append(h.model_dump())
        elif isinstance(h, dict):
            hist_dicts.append(h)

    # 2. Build Context Summary for Frontend Panel
    context_summary = AssistantContextSummary(
        patient_id=request.patient_id or _get_val(target_prediction, "patient_id"),
        patient_name=_get_val(target_prediction, "patient_name"),
        latest_risk_level=_get_val(target_prediction, "risk"),
        latest_final_probability=_get_val(target_prediction, "final_probability"),
        latest_clinical_probability=_get_val(target_prediction, "clinical_probability"),
        latest_assessment_date=str(_get_val(target_prediction, "created_at")) if _get_val(target_prediction, "created_at") else None,
        top_shap_factors=[c if isinstance(c, dict) else c.model_dump() for c in top_contribs[:4]] if top_contribs else [],
        has_history=len(patient_history_records) > 1,
        has_doctor_notes=bool(_get_val(target_prediction, "doctor_notes"))
    )

    # 3. Assemble Context Object for Provider
    raw_context_payload = {
        "patient": {
            "id": context_summary.patient_id,
            "name": context_summary.patient_name,
        },
        "prediction": pred_dict,
        "history": hist_dicts,
        "analytics": analytics_data,
        "user_role": getattr(current_user, "role", "Doctor")
    }
    context_payload = make_json_serializable(raw_context_payload)

    # 4. Invoke AI Provider with Fallback Safety
    provider = get_ai_provider()
    try:
        answer_text = provider.generate_response(SYSTEM_PROMPT, request.message, context_payload)
    except Exception as err:
        err_str = str(err)
        logger.warning("External AI Provider failed (%s). Falling back to GroundedRuleProvider.", err_str)
        fallback_provider = GroundedRuleProvider()
        answer_text = fallback_provider.generate_response(SYSTEM_PROMPT, request.message, context_payload)
        if "429" in err_str or "Too Many Requests" in err_str or "rate limit" in err_str.lower():
            answer_text += "\n\n*(Note: External AI Provider encountered a rate limit (HTTP 429). Decision-support response provided via PreStrokeNet Built-in Grounded Rule Engine.)*"
        else:
            answer_text += f"\n\n*(Note: External AI Provider unavailable. Decision-support response provided via PreStrokeNet Built-in Grounded Rule Engine.)*"

    # 5. Build Citations based on content referenced
    citations: list[CitationItem] = []
    msg_lower = request.message.lower()
    
    if target_prediction:
        p_id_label = _get_val(target_prediction, "id", "Current")
        p_risk = _get_val(target_prediction, "risk", "")
        p_fprob = _get_val(target_prediction, "final_probability", 0) or 0
        citations.append(CitationItem(
            source="Latest Prediction",
            label=f"Assessment #{p_id_label}",
            detail=f"{p_risk} Risk ({p_fprob:.1f}%)"
        ))
        exp = _get_val(target_prediction, "explainability")
        if exp:
            exp_method = _get_val(exp, "method", "SHAP")
            exp_contribs = _get_val(exp, "top_contributors", []) or []
            citations.append(CitationItem(
                source="SHAP Explanation",
                label=f"Method: {exp_method}",
                detail=f"{len(exp_contribs)} features evaluated"
            ))
        doc_notes = _get_val(target_prediction, "doctor_notes")
        if doc_notes:
            p_status = _get_val(target_prediction, "status", "reviewed")
            citations.append(CitationItem(
                source="Doctor Notes",
                label="Clinical Assessment Notes",
                detail=f"Status: {p_status}"
            ))
            
    if len(patient_history_records) > 1:
        citations.append(CitationItem(
            source="Patient History",
            label="Historical Progression",
            detail=f"{len(patient_history_records)} historical assessments"
        ))

    if any(k in msg_lower for k in ["model", "accuracy", "precision", "recall", "f1", "auc", "roc", "dataset", "limitation"]):
        citations.append(CitationItem(
            source="Model Analytics",
            label="Random Forest Production Pipeline",
            detail="ROC-AUC 0.8801, Recall 0.8810, PR-AUC 0.4298, F1 0.2803"
        ))

    # 6. Suggested Questions
    suggested_questions = [
        "Why is this patient classified under their current risk level?",
        "What are the strongest SHAP factors influencing this prediction?",
        "How has the patient's predicted risk changed compared to previous assessments?",
        "Summarize the doctor notes and follow-up schedule.",
        "What are the production model accuracy and limitation metrics?"
    ]

    provider_name = provider.health_check().get("provider", "grounded")

    return ChatResponse(
        answer=answer_text,
        citations=citations,
        context_summary=context_summary,
        suggested_questions=suggested_questions,
        provider=provider_name
    )

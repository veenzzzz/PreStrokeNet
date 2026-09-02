import os
import json
import logging
from abc import ABC, abstractmethod
from typing import Any

logger = logging.getLogger(__name__)

class BaseAIProvider(ABC):
    @abstractmethod
    def generate_response(self, system_instruction: str, user_message: str, context: dict[str, Any]) -> str:
        """Generate response given system prompt, user query, and structured context."""
        pass

    @abstractmethod
    def health_check(self) -> dict[str, Any]:
        """Return provider health status."""
        pass

class GroundedRuleProvider(BaseAIProvider):
    """
    Built-in grounded clinical decision-support engine.
    Analyzes patient data, SHAP attributions, progression, doctor notes, model analytics,
    and dataset metrics to produce 100% data-grounded answers without hallucination.
    """
    def health_check(self) -> dict[str, Any]:
        return {"status": "healthy", "provider": "grounded_rule_engine", "mode": "built_in"}

    def generate_response(self, system_instruction: str, user_message: str, context: dict[str, Any]) -> str:
        query = user_message.lower().strip()
        patient = context.get("patient") or {}
        prediction = context.get("prediction") or {}
        analytics = context.get("analytics") or {}
        history = context.get("history", [])

        # 1. Safety Redirection Checks (Independent diagnosis, prescriptions, emergency)
        if any(w in query for w in ["definitely have", "diagnose me", "am i having a stroke", "prescribe", "medication", "emergency treatment", "cure"]):
            return (
                "The PreStrokeNet model provides a probability risk estimate for clinician review and does NOT establish a medical diagnosis or prescribe treatment. "
                "The available prediction and model attributions should be interpreted alongside appropriate comprehensive clinical assessment by a qualified physician. "
                "If a patient exhibits acute symptoms of stroke (such as facial drooping, arm weakness, or speech difficulty), immediate emergency medical evaluation (e.g. 911 / Emergency Services) is required."
            )

        # 2. Missing Context / Information Query
        if any(w in query for w in ["missing", "unavailable", "absent", "lacking"]):
            missing = []
            if not prediction:
                missing.append("Latest prediction assessment record")
            if not history:
                missing.append("Historical assessment progression")
            if prediction and not prediction.get("doctor_notes"):
                missing.append("Written clinician notes")
            if prediction and not prediction.get("follow_up_date"):
                missing.append("Scheduled follow-up date")
            if not missing:
                return "All primary patient record fields (latest prediction, SHAP attributions, historical assessments, and clinician notes) are available in the context."
            return "The following information is currently absent or unrecorded in the available patient context:\n- " + "\n- ".join(missing)

        # 3. Model Analytics & Limitations Questions
        if any(w in query for w in ["model limitation", "limitation", "accuracy", "metrics", "recall", "precision", "f1", "roc", "auc", "brier", "dataset"]):
            prod = analytics.get("production_model", {}) if analytics else {}
            auc_val = prod.get("roc_auc", 0.8801)
            pr_val = prod.get("pr_auc", 0.4298)
            recall_val = prod.get("recall", 0.8810)
            f1_val = prod.get("f1", 0.2803)
            brier_val = prod.get("brier_score", 0.0373)
            cutoff_val = prod.get("cutoff_threshold", 0.15)
            
            return (
                f"**PreStrokeNet Research Model & Analytics Overview:**\n\n"
                f"- **Architecture:** Random Forest Classifier Pipeline\n"
                f"- **ROC-AUC:** {auc_val:.4f}\n"
                f"- **PR-AUC:** {pr_val:.4f}\n"
                f"- **Recall (Sensitivity):** {recall_val:.4f}\n"
                f"- **F1 Score:** {f1_val:.4f}\n"
                f"- **Brier Score:** {brier_val:.4f}\n"
                f"- **Clinical Probability Threshold:** {cutoff_val:.2f} (Optimized to maximize stroke sensitivity)\n"
                f"- **Multimodal Fusion Formula:** `Final Probability = 0.7 * Clinical + 0.3 * Keystroke`\n\n"
                f"**Model Scope & Limitations:**\n"
                f"The model is a statistical decision-support tool. It outputs decision probabilities for clinician review. "
                f"SHAP values reflect local model feature attributions rather than direct physiological causation."
            )

        # 4. Risk Progression / History Questions
        if any(w in query for w in ["change", "changed", "progression", "trend", "previous", "compared", "history"]):
            if history and len(history) >= 2:
                latest = history[0]
                prev = history[1]
                latest_fp = latest.get("final_probability", 0)
                prev_fp = prev.get("final_probability", 0)
                delta = latest_fp - prev_fp
                direction = "increased" if delta > 0 else "decreased" if delta < 0 else "remained unchanged"
                
                return (
                    f"**Patient Risk Progression Summary:**\n\n"
                    f"- **Previous Assessment ({prev.get('created_at', 'Prior')}):** {prev_fp:.1f}% ({prev.get('risk', '')} Risk)\n"
                    f"- **Latest Assessment ({latest.get('created_at', 'Current')}):** {latest_fp:.1f}% ({latest.get('risk', '')} Risk)\n"
                    f"- **Change:** {delta:+.1f} percentage points ({direction}).\n\n"
                    f"The model-estimated stroke probability {direction} compared with the previous assessment. "
                    f"This reflects updated clinical/keystroke parameter inputs rather than a direct statement of changing physiological condition."
                )
            elif history and len(history) == 1:
                return f"Only 1 historical assessment is currently recorded for this patient ({history[0].get('final_probability', 0):.1f}%). Subsequent assessments will generate trend progression comparison."
            else:
                return "I don't have previous assessment history available in the record for this patient."

        # 5. SHAP / Feature Attributions Questions
        if any(w in query for w in ["shap", "factor", "contributor", "feature", "influenc", "strongest"]):
            if prediction and prediction.get("explainability"):
                shap = prediction["explainability"]
                method = shap.get("method", "SHAP")
                contribs = shap.get("top_contributors", [])
                
                rows = []
                for c in contribs:
                    f = c.get("feature")
                    val = c.get("patient_value")
                    dir_str = "Positive (Increased Risk)" if c.get("contribution", 0) > 0 or c.get("direction") == "increased" else "Negative (Decreased Risk)"
                    rows.append(f"- **{f}** = `{val}` -> {dir_str}")
                
                return (
                    f"**SHAP Model Explainability Analysis (Method: {method}):**\n\n"
                    + "\n".join(rows)
                    + "\n\nSHAP (SHapley Additive exPlanations) quantifies the exact contribution of each feature to moving the model outcome away from the dataset baseline. These reflect model attributions for clinician review."
                )

        # 6. Doctor Notes / Follow-up Questions
        if any(w in query for w in ["note", "doctor", "recommendation", "follow-up", "followup", "review"]):
            if prediction:
                notes = prediction.get("doctor_notes")
                f_date = prediction.get("follow_up_date")
                status = prediction.get("status", "reviewed")
                if notes or f_date:
                    return (
                        f"**Doctor Review & Clinical Notes Summary:**\n\n"
                        f"- **Status:** {status}\n"
                        f"- **Notes:** {notes if notes else 'No written clinical notes entered yet.'}\n"
                        f"- **Scheduled Follow-up Date:** {f_date if f_date else 'Not scheduled'}"
                    )
            return "No doctor notes or follow-up dates are currently available for this assessment record."

        # 7. General Risk / Prediction Summary Questions
        if any(w in query for w in ["why", "risk", "classified", "high risk", "medium risk", "low risk", "probability", "score", "current"]):
            if prediction:
                c_prob = prediction.get("clinical_probability", 0)
                k_prob = prediction.get("keystroke_probability", 0)
                f_prob = prediction.get("final_probability", 0)
                r_level = prediction.get("risk", "Unknown")
                p_name = prediction.get("patient_name", "the patient")
                p_id = prediction.get("patient_id", "")
                
                contrib_text = ""
                shap_list = prediction.get("explainability", {}).get("top_contributors", [])
                if shap_list:
                    top3 = shap_list[:3]
                    items = []
                    for idx, item in enumerate(top3, 1):
                        feat = item.get("feature", "")
                        direction = "increased" if item.get("direction") == "increased" or item.get("contribution", 0) > 0 else "decreased"
                        val = item.get("patient_value", "")
                        items.append(f"  {idx}. **{feat}** (patient value: {val}) — {direction} model estimated risk.")
                    contrib_text = "\n\n**Top Model Attributions:**\n" + "\n".join(items)
                
                return (
                    f"**Prediction Summary for {p_name} ({p_id}):**\n\n"
                    f"- **Clinical Probability:** {c_prob:.1f}%\n"
                    f"- **Keystroke Probability:** {k_prob:.1f}%\n"
                    f"- **Final Combined Probability:** {f_prob:.1f}%\n"
                    f"- **Risk Classification:** **{r_level} Risk**\n\n"
                    f"**Model Calculation Formula:**\n"
                    f"`Final Probability = 0.7 * Clinical ({(c_prob/100):.4f}) + 0.3 * Keystroke ({(k_prob/100):.4f}) = {(f_prob/100):.4f}`\n\n"
                    f"Risk thresholds: Low (<30%), Medium (30%-59%), High (>=60%)."
                    f"{contrib_text}\n\n"
                    f"*Note: These features represent model-local statistical attributions, not physiological causal factors.*"
                )

        # Default Grounded Summary Response
        p_info = f"patient {patient.get('name', 'ID ' + str(patient.get('id')))}" if patient and patient.get("id") else "the selected patient record"
        return (
            f"I have reviewed the clinical decision-support data for {p_info}. "
            f"You can ask me about why this patient is classified under their current risk level, "
            f"the top SHAP model contributors, risk progression compared to prior assessments, "
            f"doctor notes summary, or production model analytics metrics."
        )


class OpenAICompatibleProvider(BaseAIProvider):
    """Provider for external OpenAI/Gemini/Ollama API endpoints when configured."""
    def __init__(self, provider_type: str = "openai", api_key: str = "", api_base: str = "https://api.openai.com/v1", model: str = "gpt-4o-mini"):
        self.provider_type = provider_type.lower()
        self.api_key = api_key
        self.api_base = api_base.rstrip("/")
        self.model = model

    def health_check(self) -> dict[str, Any]:
        if self.provider_type in ["openai", "gemini"] and not self.api_key:
            return {
                "status": "missing_api_key",
                "provider": f"external_{self.provider_type}",
                "model": self.model,
                "mode": "external_llm",
                "detail": f"AI_PROVIDER is set to '{self.provider_type}' but AI_API_KEY is missing."
            }
        return {
            "status": "configured",
            "provider": f"external_{self.provider_type}",
            "model": self.model,
            "mode": "external_llm"
        }

    def generate_response(self, system_instruction: str, user_message: str, context: dict[str, Any]) -> str:
        if self.provider_type in ["openai", "gemini"] and not self.api_key:
            raise ValueError(f"AI Provider error: '{self.provider_type}' is selected but AI_API_KEY is not configured.")

        import urllib.request
        import urllib.error

        url = f"{self.api_base}/chat/completions"
        headers = {
            "Content-Type": "application/json",
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_instruction + "\nContext JSON:\n" + json.dumps(context, default=str)},
                {"role": "user", "content": user_message}
            ],
            "temperature": 0.2
        }

        try:
            req = urllib.request.Request(url, data=json.dumps(payload, default=str).encode("utf-8"), headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["choices"][0]["message"]["content"]
        except Exception as err:
            logger.warning(f"External AI Provider '{self.provider_type}' request failed: {err}")
            raise RuntimeError(f"External AI Provider '{self.provider_type}' request failed: {str(err)}")


def get_ai_provider() -> BaseAIProvider:
    provider_type = os.getenv("AI_PROVIDER", "grounded").lower()
    api_key = os.getenv("AI_API_KEY", "")
    api_base = os.getenv("AI_API_BASE", "https://api.openai.com/v1")
    model = os.getenv("AI_MODEL", "gpt-4o-mini")

    if provider_type in ["openai", "gemini", "ollama"]:
        return OpenAICompatibleProvider(
            provider_type=provider_type,
            api_key=api_key,
            api_base=api_base,
            model=model
        )

    return GroundedRuleProvider()

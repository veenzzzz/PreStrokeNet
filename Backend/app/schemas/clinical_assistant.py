from pydantic import BaseModel, Field
from typing import Any, Literal

class ChatMessage(BaseModel):
    role: Literal["user", "assistant", "system"]
    content: str

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    patient_id: str | None = Field(default=None, max_length=100)
    prediction_id: int | None = Field(default=None, ge=1)
    history: list[ChatMessage] = Field(default_factory=list)

class CitationItem(BaseModel):
    source: str
    label: str
    detail: str | None = None

class AssistantContextSummary(BaseModel):
    patient_id: str | None = None
    patient_name: str | None = None
    latest_risk_level: str | None = None
    latest_final_probability: float | None = None
    latest_clinical_probability: float | None = None
    latest_assessment_date: str | None = None
    top_shap_factors: list[dict[str, Any]] = Field(default_factory=list)
    has_history: bool = False
    has_doctor_notes: bool = False

class ChatResponse(BaseModel):
    answer: str
    citations: list[CitationItem] = Field(default_factory=list)
    context_summary: AssistantContextSummary
    suggested_questions: list[str] = Field(default_factory=list)
    disclaimer: str = (
        "PreStrokeNet AI Clinical Decision-Support Assistant is designed for explanation "
        "and decision support. It does not provide medical diagnoses or replace clinical judgment."
    )
    provider: str = "grounded"

from datetime import date, datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

class PatientAssessmentHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    patient_name: str
    patient_id: str
    age: float
    gender: int
    clinical_probability: float
    keystroke_probability: float
    final_probability: float
    risk: str
    created_at: datetime
    doctor_notes: str | None = None
    recommendation: str | None = None
    follow_up_date: date | None = None
    status: str
    explainability_method: str

class RiskProgressionPoint(BaseModel):
    prediction_id: int
    assessment_date: datetime
    clinical_probability: float
    keystroke_probability: float
    final_probability: float
    risk: str

class ShapFeatureComparison(BaseModel):
    feature: str
    field: str
    current_contribution: float
    previous_contribution: float | None = None
    change: float

class RiskProgressionChange(BaseModel):
    previous_probability: float | None = None
    current_probability: float
    absolute_change: float
    percentage_change: float
    direction: Literal["Increased", "Decreased", "Stable"]
    status_message: str
    shap_comparison: list[ShapFeatureComparison] = Field(default_factory=list)

class RiskProgressionResponse(BaseModel):
    progression: list[RiskProgressionPoint]
    latest_assessment: RiskProgressionChange | None = None

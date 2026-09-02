from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.schemas.keystroke import KeystrokeFeatures


RiskLevel = Literal["Low", "Medium", "High"]
ReportStatus = Literal["draft", "reviewed", "final", "archived"]
ExplainabilityDirection = Literal["increased", "decreased", "neutral"]
ExplainabilityMethod = Literal["shap", "approximate_sensitivity", "rule_based"]
PredictionSort = Literal[
    "latest",
    "oldest",
    "highest_probability",
    "lowest_probability",
    "highest_risk",
    "lowest_risk",
    "patient_name",
]
ActivityType = Literal[
    "prediction_created",
    "prediction_updated",
    "doctor_note_added",
    "doctor_notes_added",
    "doctor_notes_modified",
    "follow_up_date_changed",
    "report_generated",
    "report_emailed",
    "pdf_downloaded",
    "report_downloaded",
    "excel_exported",
    "email_sent",
    "prediction_deleted",
]


class FinalPredictionRequest(KeystrokeFeatures):
    patient_name: str = Field(min_length=1, max_length=100)
    patient_id: str | None = Field(default=None, max_length=100)
    gender: int = Field(ge=0)
    age: float = Field(gt=0, le=130)
    hypertension: int = Field(ge=0, le=1)
    heart_disease: int = Field(ge=0, le=1)
    ever_married: int = Field(ge=0, le=1)
    work_type: int = Field(ge=0)
    Residence_type: int = Field(ge=0, le=1)
    avg_glucose_level: float = Field(gt=0, le=1000)
    bmi: float = Field(gt=0, le=150)
    smoking_status: int = Field(ge=0, le=1)

    @field_validator("patient_name", "patient_id", mode="before")
    @classmethod
    def trim_identity(cls, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        if value is not None and not trimmed and cls.__name__ == "FinalPredictionRequest":
            raise ValueError("Patient name is required")
        return trimmed or None


class PredictionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int | None = None
    patient_name: str | None = None
    patient_id: str | None = None
    clinical_probability: float = Field(ge=0, le=1)
    keystroke_probability: float = Field(ge=0, le=1)
    final_probability: float = Field(ge=0, le=1)
    risk: str
    created_at: datetime | None = None
    updated_at: datetime | None = None
    explainability: "Explainability | None" = None
    recommendations: list[str] = Field(default_factory=list)


class PredictionSummary(PredictionResponse):
    age: float | None = None
    gender: int | None = None
    status: ReportStatus | None = None


class PredictionUpdate(BaseModel):
    patient_name: str | None = Field(default=None, min_length=1, max_length=100)
    patient_id: str | None = Field(default=None, max_length=100)
    diagnosis: str | None = Field(default=None, max_length=5000)
    doctor_notes: str | None = Field(default=None, max_length=10000)
    recommendation: str | None = Field(default=None, max_length=5000)
    follow_up_date: date | None = None
    status: ReportStatus = "draft"

    @field_validator("patient_name", "patient_id", "diagnosis", "doctor_notes", "recommendation", mode="before")
    @classmethod
    def trim_text(cls, value: str | None) -> str | None:
        return value.strip() if isinstance(value, str) else value

    @model_validator(mode="after")
    def validate_patient_name_when_provided(self):
        if "patient_name" in self.model_fields_set and not self.patient_name:
            raise ValueError("Patient name is required")
        return self


class DoctorNoteUpdate(BaseModel):
    diagnosis: str | None = Field(default=None, max_length=5000)
    doctor_notes: str = Field(default="", max_length=10000)
    recommendation: str | None = Field(default=None, max_length=5000)
    follow_up_date: date | None = None
    status: ReportStatus = "reviewed"

    @field_validator("diagnosis", "doctor_notes", "recommendation", mode="before")
    @classmethod
    def trim_notes(cls, value: str | None) -> str | None:
        return value.strip() if isinstance(value, str) else value


class PredictionSearchParams(BaseModel):
    q: str | None = Field(default=None, max_length=120)
    page: int = Field(default=1, ge=1, le=100000)
    page_size: int = Field(default=20, ge=1, le=100)
    sort: PredictionSort = "latest"
    risk: str | None = None
    min_age: float | None = Field(default=None, ge=0, le=130)
    max_age: float | None = Field(default=None, ge=0, le=130)
    gender: int | None = Field(default=None, ge=0)
    date_from: datetime | None = None
    date_to: datetime | None = None
    smoking_status: int | None = Field(default=None, ge=0, le=1)
    hypertension: int | None = Field(default=None, ge=0, le=1)
    heart_disease: int | None = Field(default=None, ge=0, le=1)
    residence_type: int | None = Field(default=None, ge=0, le=1)
    work_type: int | None = Field(default=None, ge=0)

    @field_validator("q", "risk", mode="before")
    @classmethod
    def trim_query_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        trimmed = value.strip()
        return trimmed or None

    @model_validator(mode="after")
    def validate_ranges(self):
        if self.min_age is not None and self.max_age is not None and self.min_age > self.max_age:
            raise ValueError("min_age must be less than or equal to max_age")
        if self.date_from is not None and self.date_to is not None and self.date_from > self.date_to:
            raise ValueError("date_from must be before date_to")
        return self


class PredictionListResponse(BaseModel):
    items: list[PredictionSummary]
    total: int
    page: int
    page_size: int
    total_pages: int


class ActivityEvent(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prediction_id: int | None
    activity_type: ActivityType
    message: str
    actor_name: str | None = None
    created_at: datetime


class ExplainabilityFactor(BaseModel):
    feature: str
    value: float | int | str | None
    contribution_percentage: float = Field(ge=0, le=100)
    direction: ExplainabilityDirection
    explanation: str


class Explainability(BaseModel):
    final_probability: float = Field(ge=0, le=1)
    feature_importance: list[ExplainabilityFactor]
    top_factors: list[str]
    clinical_explanation: str
    recommendations: list[str]
    method: ExplainabilityMethod = "rule_based"
    is_rule_based: bool = True


PredictionResponse.model_rebuild()


class PredictionDetailResponse(PredictionSummary):
    clinical_features: dict[str, float | int | None]
    keystroke_features: dict[str, float | int | None]
    diagnosis: str | None = None
    doctor_notes: str | None = None
    recommendation: str | None = None
    follow_up_date: date | None = None
    pdf_generated: bool = False
    excel_generated: bool = False
    email_sent: bool = False
    last_modified_by: int | None = None
    explainability: Explainability
    recommendations: list[str]
    timeline: list[ActivityEvent]


class DashboardTrendItem(BaseModel):
    label: str
    count: int
    average_probability: float | None = None


class DashboardDistributionItem(BaseModel):
    label: str
    count: int


class DashboardStatistics(BaseModel):
    total_predictions: int
    predictions_today: int
    predictions_this_week: int
    predictions_this_month: int
    low_count: int
    medium_count: int
    high_count: int
    average_probability: float | None
    average_age: float | None
    average_bmi: float | None
    average_glucose: float | None
    most_common_risk: str | None
    most_common_smoking_status: str | None
    monthly_trend: list[DashboardTrendItem]
    daily_trend: list[DashboardTrendItem]
    high_risk_trend: list[DashboardTrendItem]
    risk_distribution: list[DashboardDistributionItem]
    age_distribution: list[DashboardDistributionItem]
    gender_distribution: list[DashboardDistributionItem]
    smoking_distribution: list[DashboardDistributionItem]
    top_risk_factors: list[DashboardDistributionItem]
    latest_predictions: list[PredictionSummary]


class EmailReportRequest(BaseModel):
    recipient: EmailStr
    subject: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1, max_length=5000)

    @field_validator("subject", "message")
    @classmethod
    def trim_email_text(cls, value: str) -> str:
        return value.strip()

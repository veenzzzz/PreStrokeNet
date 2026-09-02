from pydantic import BaseModel
from typing import Any

class ModelMetricItem(BaseModel):
    model: str
    accuracy: float
    precision: float
    recall: float
    f1: float
    roc_auc: float
    pr_auc: float
    threshold: float | None = None

class ConfusionMatrix(BaseModel):
    tn: int
    fp: int
    fn: int
    tp: int

class ModelComparisonItem(BaseModel):
    model: str
    accuracy: float
    precision: float
    recall: float
    f1: float
    roc_auc: float
    pr_auc: float

class ThresholdPerformanceItem(BaseModel):
    threshold: float
    precision: float
    recall: float
    f1: float
    tp: int
    fp: int
    fn: int
    tn: int
    fpr: float

class FeatureImportanceItem(BaseModel):
    feature: str
    field: str
    importance: float

class DatasetAnalysis(BaseModel):
    total_records: int
    stroke_cases: int
    non_stroke_cases: int
    prevalence: float
    incompatibility_notes: str
    synthetic_notes: str

class ModelAnalyticsResponse(BaseModel):
    production_model: ModelMetricItem
    confusion_matrix: ConfusionMatrix
    model_comparison: list[ModelComparisonItem]
    threshold_analysis: list[ThresholdPerformanceItem]
    feature_importance: list[FeatureImportanceItem]
    dataset_analysis: DatasetAnalysis
    model_info: dict[str, Any]

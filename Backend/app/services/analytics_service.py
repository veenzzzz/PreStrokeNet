import os
import re
import csv
import sys
import joblib
from typing import Any, Dict

from app.schemas.analytics import (
    ModelMetricItem,
    ConfusionMatrix,
    ModelComparisonItem,
    ThresholdPerformanceItem,
    FeatureImportanceItem,
    DatasetAnalysis,
    ModelAnalyticsResponse
)

EVALUATION_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "ML", "evaluation")
)
MODEL_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "ml", "stroke_model.pkl")
)

# In-memory cache for loaded analytics data
_cached_analytics: Dict[str, Any] = {}

def get_analytics_data() -> ModelAnalyticsResponse:
    global _cached_analytics
    if _cached_analytics:
        return ModelAnalyticsResponse(**_cached_analytics)

    # 1. Paths to required artifacts
    analysis_md_path = os.path.join(EVALUATION_DIR, "phase2_model_analysis.md")
    model_comparison_csv_path = os.path.join(EVALUATION_DIR, "phase2_model_comparison.csv")
    threshold_csv_path = os.path.join(EVALUATION_DIR, "phase2_threshold_analysis.csv")

    # Validate file existences
    for filepath in [analysis_md_path, model_comparison_csv_path, threshold_csv_path]:
        if not os.path.exists(filepath):
            raise FileNotFoundError(
                f"Required evaluation artifact {os.path.basename(filepath)} is not available in the ML/evaluation directory."
            )

    # 2. Parse phase2_model_analysis.md for production metrics and confusion matrix
    with open(analysis_md_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Regex extraction
    accuracy_match = re.search(r"\*\*[aA]ccuracy\*\*:\s*`([\d.]+)`", content)
    precision_match = re.search(r"\*\*[pP]recision\*\*:\s*`([\d.]+)`", content)
    recall_match = re.search(r"\*\*[rR]ecall\*\*:\s*`([\d.]+)`", content)
    f1_match = re.search(r"\*\*[fF]1-Score\*\*:\s*`([\d.]+)`", content)
    roc_auc_match = re.search(r"\*\*[rR]OC-AUC\*\*:\s*`([\d.]+)`", content)
    pr_auc_match = re.search(r"\*\*[pP]R-AUC\*\*:\s*`([\d.]+)`", content)
    cm_match = re.search(r"\*\*[cC]onfusion\s*[mM]atrix\*\*:\s*TN=(\d+),\s*FP=(\d+),\s*FN=(\d+),\s*TP=(\d+)", content)

    if not all([accuracy_match, precision_match, recall_match, f1_match, roc_auc_match, pr_auc_match, cm_match]):
        raise ValueError("Could not parse all required production metrics from phase2_model_analysis.md")

    production_metrics = ModelMetricItem(
        model="Random Forest",
        accuracy=float(accuracy_match.group(1)),
        precision=float(precision_match.group(1)),
        recall=float(recall_match.group(1)),
        f1=float(f1_match.group(1)),
        roc_auc=float(roc_auc_match.group(1)),
        pr_auc=float(pr_auc_match.group(1)),
        threshold=0.15
    )

    conf_matrix = ConfusionMatrix(
        tn=int(cm_match.group(1)),
        fp=int(cm_match.group(2)),
        fn=int(cm_match.group(3)),
        tp=int(cm_match.group(4))
    )

    # 3. Parse phase2_model_comparison.csv
    model_comparison = []
    with open(model_comparison_csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("Experiment") == "C1: Real Only":
                # Metrics in model comparison CSV
                model_comparison.append(
                    ModelComparisonItem(
                        model=row["Model"],
                        accuracy=float(row["Accuracy_Mean"]),
                        precision=float(row["Precision_Mean"]),
                        recall=float(row["Recall_Mean"]),
                        f1=float(row["F1-Score_Mean"]),
                        roc_auc=float(row["ROC-AUC_Mean"]),
                        pr_auc=float(row["PR-AUC_Mean"])
                    )
                )

    # 4. Parse phase2_threshold_analysis.csv for Random Forest C1: Real Only
    threshold_analysis = []
    with open(threshold_csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row.get("Experiment") == "C1: Real Only" and row.get("Model") == "Random Forest":
                threshold_analysis.append(
                    ThresholdPerformanceItem(
                        threshold=float(row["Threshold"]),
                        precision=float(row["Precision"]),
                        recall=float(row["Recall"]),
                        f1=float(row["F1-Score"]),
                        tp=int(row["TP"]),
                        fp=int(row["FP"]),
                        fn=int(row["FN"]),
                        tn=int(row["TN"]),
                        fpr=float(row["FPR"])
                    )
                )

    # 5. Extract feature importances from production stroke_model.pkl
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Production clinical model {os.path.basename(MODEL_PATH)} is not available."
        )

    pipeline = joblib.load(MODEL_PATH)
    classifier = pipeline.named_steps["classifier"]
    importances = classifier.feature_importances_

    # Map features to their names and fields
    from app.services.explainability_service import FEATURES
    feature_importance_list = []
    for idx, (feature_name, field, _) in enumerate(FEATURES[:10]):
        feature_importance_list.append(
            FeatureImportanceItem(
                feature=feature_name,
                field=field,
                importance=float(importances[idx])
            )
        )
    # Rank by importance descending
    feature_importance_list.sort(key=lambda x: x.importance, reverse=True)

    # 6. Dataset statistics and Phase 2 findings
    dataset_analysis = DatasetAnalysis(
        total_records=5110,
        stroke_cases=249,
        non_stroke_cases=4861,
        prevalence=0.0487,
        incompatibility_notes=(
            "The additional real stroke dataset (stroke_risk_dataset.csv) was found to be incompatible "
            "with the current feature contract and target definition. Merging was ruled out to protect "
            "clinical target consistency."
        ),
        synthetic_notes=(
            "Synthetic data was evaluated at controlled ratios (1:1, 2:1, 4:1). Analysis showed "
            "that synthetic augmentation did not improve predictive performance on the untouched real "
            "test set, and real-only training remains the recommended model configuration."
        )
    )

    # 7. Model configuration metadata
    model_info = {
        "model_type": "Random Forest",
        "architecture": "scikit-learn Pipeline",
        "preprocessing": "ColumnTransformer",
        "numerical_imputer": "SimpleImputer(strategy='median')",
        "numerical_scaler": "StandardScaler()",
        "categorical_imputer": "SimpleImputer(strategy='most_frequent')",
        "classifier": "RandomForestClassifier",
        "class_weight": "balanced",
        "random_state": 42,
        "clinical_threshold": 0.15
    }

    # Store in memory cache
    _cached_analytics = {
        "production_model": production_metrics.model_dump(),
        "confusion_matrix": conf_matrix.model_dump(),
        "model_comparison": [item.model_dump() for item in model_comparison],
        "threshold_analysis": [item.model_dump() for item in threshold_analysis],
        "feature_importance": [item.model_dump() for item in feature_importance_list],
        "dataset_analysis": dataset_analysis.model_dump(),
        "model_info": model_info
    }

    return ModelAnalyticsResponse(**_cached_analytics)

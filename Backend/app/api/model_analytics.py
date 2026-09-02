from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_roles
from app.core.database import get_db
from app.models.user import User
from app.schemas.analytics import ModelAnalyticsResponse
from app.services.analytics_service import get_analytics_data

router = APIRouter(prefix="/model-analytics", tags=["Model Analytics"])

@router.get("/", response_model=ModelAnalyticsResponse)
def get_model_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor"))
):
    try:
        return get_analytics_data()
    except FileNotFoundError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err)
        )
@router.get("/fusion")
def get_multimodal_fusion_analytics(
    current_user: User = Depends(get_current_user)
):
    import os
    import pandas as pd
    
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ML", "evaluation"))
    results_path = os.path.join(base_dir, "phase9_results.csv")
    ablation_path = os.path.join(base_dir, "phase9_ablation_results.csv")
    thresh_path = os.path.join(base_dir, "phase9_threshold_analysis.csv")
    
    fusion_results = pd.read_csv(results_path).to_dict(orient="records") if os.path.exists(results_path) else []
    ablation_results = pd.read_csv(ablation_path).to_dict(orient="records") if os.path.exists(ablation_path) else []
    threshold_analysis = pd.read_csv(thresh_path).to_dict(orient="records") if os.path.exists(thresh_path) else []
    
    return {
        "title": "Phase 9 Multimodal Decision Fusion & System Ablation Analysis",
        "is_experimental": True,
        "disclaimer": "The available keystroke datasets contain user identity ground truth rather than stroke diagnoses. Decision fusion ratios represent an integrated decision-support prototype rather than a clinically validated joint predictor.",
        "data_compatibility": {
            "is_paired": False,
            "clinical_records": 5110,
            "keystroke_records": 20400,
            "shared_patient_id": False,
            "supervised_joint_learning_valid": False,
            "note": "Supervised joint ML learning is not scientifically evaluable on available data due to lack of shared patient identifiers."
        },
        "fusion_experiments": fusion_results,
        "ablation_results": ablation_results,
        "threshold_analysis": threshold_analysis
    }

@router.get("/research")
def get_research_validation_analytics(
    current_user: User = Depends(get_current_user)
):
    import os
    import pandas as pd
    
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "ML", "evaluation"))
    cal_path = os.path.join(base_dir, "phase10_calibration_results.csv")
    sub_path = os.path.join(base_dir, "phase14_subgroup_results.csv")
    if not os.path.exists(sub_path):
        sub_path = os.path.join(base_dir, "phase10_subgroup_results.csv")
    
    boot_path = os.path.join(base_dir, "phase14_bootstrap_results.csv")
    stab_path = os.path.join(base_dir, "phase14_stability_results.csv")
    err_path = os.path.join(base_dir, "phase14_error_analysis.csv")
    comp_path = os.path.join(base_dir, "phase14_model_comparison.csv")
    
    calibration_results = pd.read_csv(cal_path).to_dict(orient="records") if os.path.exists(cal_path) else []
    subgroup_results = pd.read_csv(sub_path).to_dict(orient="records") if os.path.exists(sub_path) else []
    bootstrap_results = pd.read_csv(boot_path).to_dict(orient="records") if os.path.exists(boot_path) else []
    stability_results = pd.read_csv(stab_path).to_dict(orient="records") if os.path.exists(stab_path) else []
    error_analysis = pd.read_csv(err_path).to_dict(orient="records") if os.path.exists(err_path) else []
    model_comparison = pd.read_csv(comp_path).to_dict(orient="records") if os.path.exists(comp_path) else []
    
    base_results = pd.read_csv(os.path.join(base_dir, "phase10_final_results.csv")).to_dict(orient="records") if os.path.exists(os.path.join(base_dir, "phase10_final_results.csv")) else []

    return {
        "title": "Phase 14 Research Validation, Bootstrap CIs & Statistical Evidence",
        "is_research_validated": True,
        "disclaimer": "This analysis evaluates model behavior and statistical uncertainty. It is a research decision-support prototype and not evidence of prospective clinical effectiveness.",
        "baseline_performance": base_results,
        "bootstrap_confidence_intervals": bootstrap_results,
        "stability_analysis": stability_results,
        "calibration_analysis": calibration_results,
        "subgroup_error_analysis": subgroup_results,
        "error_distribution_analysis": error_analysis,
        "model_comparison": model_comparison,
        "global_shap_top_features": [
            {"feature": "Age", "shap_importance": 0.1951, "gini_importance": 0.4118},
            {"feature": "BMI", "shap_importance": 0.0843, "gini_importance": 0.1766},
            {"feature": "Average glucose", "shap_importance": 0.0838, "gini_importance": 0.1917},
            {"feature": "Smoking status", "shap_importance": 0.0258, "gini_importance": 0.0527},
            {"feature": "Hypertension", "shap_importance": 0.0205, "gini_importance": 0.0275}
        ]
    }

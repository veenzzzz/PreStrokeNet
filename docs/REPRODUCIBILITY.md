# Reproducibility Guide

This guide details the exact hardware/software environment, random seeds, scripts, and commands required to reproduce all ML evaluation results, bootstrap confidence intervals, and publication figures in PreStrokeNet.

---

## 1. Environment & Dependencies

- **Python Version**: `3.12.x`
- **Scikit-Learn**: `1.5.2`
- **SHAP**: `0.52.0`
- **Pandas**: `2.2.x`
- **NumPy**: `1.26.x`
- **Matplotlib**: `3.9.x`
- **Random Seeds**: `42` (global & train/test splits), `100` to `119` (repeated stability runs).

---

## 2. Command Pipeline

### Step 1: Run Full Phase 14 Research Experiments & Figures
```powershell
python ML/evaluation/phase14_research_experiments.py
```
*Outputs*: CSV results in `ML/evaluation/phase14_*.csv` and 12 figures in `ML/evaluation/phase14_plots/`.

### Step 2: Run Backend Integration & Model Analytics Unit Tests
```powershell
python -m unittest discover -s tests -v
```

### Step 3: Run Automated E2E QA Verification
```powershell
python C:\Users\navee\.gemini\antigravity-ide\brain\0a768d7d-f8eb-41b9-aa85-22c7aa25d598\scratch\full_e2e_qa.py
```

---

## 3. Output Artifact Locations

- **Bootstrap Results**: `ML/evaluation/phase14_bootstrap_results.csv`
- **Stability Results**: `ML/evaluation/phase14_stability_results.csv`
- **Threshold Sensitivity**: `ML/evaluation/phase14_threshold_results.csv`
- **Subgroup Breakdown**: `ML/evaluation/phase14_subgroup_results.csv`
- **Error Analysis**: `ML/evaluation/phase14_error_analysis.csv`
- **TreeSHAP Importance**: `ML/evaluation/phase14_shap_stability.csv`
- **Model Comparison**: `ML/evaluation/phase14_model_comparison.csv`
- **Research Figures**: `ML/evaluation/phase14_plots/*.png`

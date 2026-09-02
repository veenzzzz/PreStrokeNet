# PreStrokeNet Research Methodology & Pipeline Specification

This document details the end-to-end research methodology, feature engineering, model selection, calibration, explainability, and leakage prevention protocols.

---

## 1. End-to-End Pipeline Workflow

```
Raw Healthcare Dataset (5,110 records)
   ↓
Manual Categorical Mapping & Imputation
   ↓
Stratified 80/20 Train/Test Split (Random Seed = 42)
   ↓
5-Fold Cross-Validation Model Comparison (RF, XGB, CatBoost, LGBM, LR)
   ↓
Production Pipeline Fitting (ColumnTransformer + RandomForestClassifier)
   ↓
Screening Threshold Selection (t = 0.15 on CV training folds)
   ↓
TreeSHAP Local & Global Feature Attribution
   ↓
Probability Calibration Sensitivity Analysis (Platt vs Isotonic)
   ↓
Clinical Subgroup Error Analysis (Age, Comorbidities, Glucose, BMI)
   ↓
Untouched Test Set Final Evaluation (N = 1,022)
```

---

## 2. Leakage Prevention Protocol

- **Strict Preprocessing Scoping**: `SimpleImputer` and `StandardScaler` transformations are fit strictly within `ColumnTransformer` inside training folds. No test set statistics leak into feature scaling.
- **Single Test Evaluation**: Hyperparameter tuning, cross-validation model selection, and decision threshold optimization ($t = 0.15$) are performed exclusively on training folds. The test partition (1,022 samples) is evaluated once.

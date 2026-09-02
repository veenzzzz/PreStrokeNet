# Model Card — PreStrokeNet Clinical Stroke Risk Model

## 1. Model Details
- **Developer**: PreStrokeNet Research Team
- **Model Architecture**: `scikit-learn` `Pipeline` containing `ColumnTransformer` (`SimpleImputer` + `StandardScaler`) and `RandomForestClassifier` (100 trees).
- **Model Version**: v2.2 (Phase 14 Research Validation)
- **Model Date**: September 2026
- **License**: MIT

---

## 2. Intended Use & Non-Intended Use
- **Intended Use**: Screening decision-support tool to estimate individualized stroke probability from clinical demographics and health metrics.
- **Non-Intended Use**: This system is **not a standalone diagnostic medical device**. It must not replace clinical laboratory testing, radiological imaging, or physician evaluation.

---

## 3. Training & Validation Data
- **Dataset Source**: `healthcare-dataset-stroke-data.csv` (Kaggle Stroke Prediction Dataset).
- **Total Records**: 4,909 clean patient records (4,699 non-stroke, 210 stroke cases).
- **Class Imbalance**: ~22.4:1 (4.28% stroke prevalence).
- **Partitioning**: 80/20 Stratified Train/Test split (3,927 train, 982 untouched test records).

---

## 4. Features & Preprocessing
- **Clinical Features (10)**: `gender`, `age`, `hypertension`, `heart_disease`, `ever_married`, `work_type`, `Residence_type`, `avg_glucose_level`, `bmi`, `smoking_status`.
- **Imputation**: Median imputation for numerical features (`bmi`, `avg_glucose_level`), most-frequent imputation for categorical variables.

---

## 5. Performance Metrics & Bootstrap 95% CIs (Threshold = 0.15, B = 2,000)
- **Accuracy**: `0.8065` (95% CI: `[0.7811, 0.8310]`)
- **Precision**: `0.1667` (95% CI: `[0.1212, 0.2188]`)
- **Recall (Sensitivity)**: **`0.8810`** (95% CI: `[0.7805, 0.9545]`)
- **F1-Score**: `0.2803` (95% CI: `[0.2105, 0.3556]`)
- **ROC-AUC**: **`0.8801`** (95% CI: `[0.8291, 0.9258]`)
- **PR-AUC**: **`0.4298`** (95% CI: `[0.2981, 0.5694]`)
- **Brier Score**: `0.0373`

---

## 6. Repeated Train/Test Stability ($N=20$)
- **Mean Recall**: `0.8750` ($\pm 0.0241$)
- **Mean ROC-AUC**: `0.8785` ($\pm 0.0098$)
- **Mean Accuracy**: `0.8050` ($\pm 0.0092$)

---

## 7. Explainability & Risk Controls
- **Global Explainability**: Age (Mean |SHAP| = 0.1951), BMI (0.0843), Average Glucose (0.0838).
- **Local Explainability**: TreeSHAP attributions integrated into API and PDF reports (`shap==0.52.0`).
- **Data Leakage Controls**: Pipeline preprocessing fit exclusively on training folds; test set evaluated once.

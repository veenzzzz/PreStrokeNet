# PreStrokeNet: An AI-Assisted Multimodal Stroke-Risk Prediction & Explainability Framework

**Manuscript Draft & Research Paper Materials**

---

## Abstract

Stroke remains a leading cause of long-term disability and mortality worldwide. Early risk identification is critical for clinical intervention, yet machine learning models face challenges regarding class imbalance, probability calibration, feature explainability, and integration of behavioral timing signatures. We present **PreStrokeNet**, an end-to-end clinical decision-support framework incorporating a production Random Forest clinical pipeline (`stroke_model.pkl`), real TreeSHAP explainability (`shap==0.52.0`), longitudinal patient risk tracking, and a keystroke biometric dynamics research module. Evaluated on an untouched real test partition ($N = 1,022$), the clinical model achieves **78.00% diagnostic sensitivity (Recall)** and an **ROC-AUC of 0.7979** at screening threshold $t = 0.15$. TreeSHAP attributions identify age, body mass index, and average glucose as primary predictive features. Multimodal decision-fusion experiments ($70/30$ weighting scheme) establish a decision-support prototype combining medical risk assessment with biometric behavioral monitoring.

---

## 1. Introduction & Motivation
Cardiovascular disease and cerebrovascular accidents require timely screening. PreStrokeNet combines supervised clinical machine learning with behavioral timing analysis, backed by automated TreeSHAP attributions and clinical decision-support assistant capabilities.

---

## 2. Experimental Methodology & Results

### Table 1: Untouched Test Set Performance (N = 1,022, t = 0.15)
- **Accuracy**: 78.47%
- **Precision**: 15.73%
- **Recall (Sensitivity)**: **78.00%** (39/50 stroke cases identified)
- **F1-Score**: 26.17%
- **ROC-AUC**: **0.7979**
- **Brier Score**: 0.0450

### Table 2: Global TreeSHAP Feature Attributions
1. **Age**: Mean |SHAP| = 0.1951
2. **BMI**: Mean |SHAP| = 0.0843
3. **Average Glucose**: Mean |SHAP| = 0.0838
4. **Smoking Status**: Mean |SHAP| = 0.0258
5. **Hypertension**: Mean |SHAP| = 0.0205

---

## 3. Ethical Considerations & Limitations
- **Screening-Oriented Threshold**: The $0.15$ threshold prioritizes sensitivity over specificity to minimize false negatives in primary care screening.
- **Dataset Non-Pairing Disclosure**: Clinical records and keystroke benchmark records do not share patient identifiers. Decision fusion ratios represent a decision-support prototype rather than a clinically validated joint predictor.

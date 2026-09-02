# Phase 14 — Research Validation & Statistical Analysis Report

This document presents the complete paper-ready research evidence package for **PreStrokeNet**, including repeated stratified train/test stability ($N=20$), non-parametric bootstrap confidence intervals ($B=2000$), decision threshold sensitivity, probability calibration analysis, demographic subgroup error analysis, TreeSHAP importance stability, and decision-level multimodal fusion ablation.

---

## 1. Research Questions & Hypotheses

- **RQ1 (Model Reliability)**: What are the point estimates and 95% bootstrap confidence intervals for the clinical Random Forest model?
- **RQ2 (Stability Across Splits)**: How stable are reported metrics across $N=20$ repeated stratified train/test splits?
- **RQ3 (Threshold Sensitivity)**: How sensitive are Recall, Precision, F1, Specificity, and FPR to the operating decision threshold ($0.05 \le \tau \le 0.50$)?
- **RQ4 (Classifier Benchmarking)**: How does the production Random Forest compare with Logistic Regression, Decision Trees, XGBoost, and LightGBM?
- **RQ5 (Multimodal Fusion)**: Does decision-level multimodal fusion ($70/30$ weighting) improve discrimination over individual subsystems without violating non-paired patient constraints?
- **RQ6 (Calibration)**: What is the Brier score of predicted probabilities?
- **RQ7 (Demographic Subgroup Robustness)**: How does model recall vary across Age bands ($<40, 40-59, \ge 60$), Gender, Hypertension, and Heart Disease?

---

## 2. Experimental Summary & Bootstrap 95% CIs ($B=2000$)

Evaluated on the held-out test dataset ($N=982$, 42 stroke cases) at the screening decision threshold $\tau = 0.15$:

| Metric | Point Estimate | 95% Confidence Interval | Method |
| :--- | :---: | :---: | :--- |
| **Accuracy** | `0.8065` | `[0.7811, 0.8310]` | Non-parametric Bootstrap |
| **Precision** | `0.1667` | `[0.1212, 0.2188]` | Non-parametric Bootstrap |
| **Recall (Sensitivity)** | `0.8810` | `[0.7805, 0.9545]` | Non-parametric Bootstrap |
| **F1 Score** | `0.2803` | `[0.2105, 0.3556]` | Non-parametric Bootstrap |
| **ROC-AUC** | `0.8801` | `[0.8291, 0.9258]` | Non-parametric Bootstrap |
| **PR-AUC** | `0.4298` | `[0.2981, 0.5694]` | Non-parametric Bootstrap |

*Confusion Matrix*: $\text{TN}=755, \text{FP}=185, \text{FN}=5, \text{TP}=37$.

---

## 3. Repeated Train/Test Stability Analysis ($N=20$)

| Metric | Mean | Standard Deviation | Min | Max | 95% Interval |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Accuracy** | `0.8050` | `0.0092` | `0.7882` | `0.8218` | `[0.7892, 0.8208]` |
| **Precision** | `0.1685` | `0.0084` | `0.1538` | `0.1842` | `[0.1548, 0.1832]` |
| **Recall** | `0.8750` | `0.0241` | `0.8333` | `0.9286` | `[0.8333, 0.9286]` |
| **F1 Score** | `0.2825` | `0.0121` | `0.2612` | `0.3071` | `[0.2622, 0.3051]` |
| **ROC-AUC** | `0.8785` | `0.0098` | `0.8590` | `0.8965` | `[0.8600, 0.8950]` |
| **PR-AUC** | `0.4210` | `0.0215` | `0.3850` | `0.4620` | `[0.3880, 0.4580]` |

---

## 4. Threshold Sensitivity & Operating Trade-offs

The operating threshold $\tau = 0.15$ prioritizes high screening sensitivity ($\text{Recall} = 88.10\%$) while suppressing false negatives ($\text{FN} = 5$):

- $\tau = 0.05$: Recall = 100.00%, Precision = 4.28%, Specificity = 0.00%
- $\tau = 0.15$ (**Production**): Recall = 88.10%, Precision = 16.67%, Specificity = 80.32%
- $\tau = 0.30$: Recall = 52.38%, Precision = 32.35%, Specificity = 95.11%
- $\tau = 0.50$: Recall = 19.05%, Precision = 44.44%, Specificity = 98.94%

---

## 5. Non-Diagnostic Medical Framing & Limitations

1. **Non-Diagnostic Prototype**: PreStrokeNet provides model-assessed risk screening scores and TreeSHAP feature attributions. It does not issue clinical diagnoses or treatment regimens.
2. **Subsystem Autonomy**: Clinical stroke risk models and Keystroke Dynamics behavioral models were trained on independent benchmark datasets due to non-paired identity constraints.

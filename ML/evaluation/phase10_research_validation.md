# Phase 10 Research Validation, Hypotheses & Scientific Disclosures

This document establishes the scientific validation framework, dataset disclosures, research hypotheses, and data leakage controls for PreStrokeNet.

---

## 1. Clinical Dataset & Train/Test Partitioning

| Parameter | Specification |
| :--- | :--- |
| **Dataset File** | `Datasets/raw/Stroke/healthcare-dataset-stroke-data.csv` |
| **Total Observations** | 5,110 patient records |
| **Target Variable** | `stroke` (binary: 0 = Stroke-Free, 1 = Confirmed Stroke) |
| **Class Distribution** | 4,861 Non-Stroke (95.13%), 249 Stroke (4.87%) — Imbalance Ratio ~19.5:1 |
| **Train/Test Strategy** | 80/20 Stratified Train/Test Split (Random Seed = 42) |
| **Training Set** | 4,088 records (3,889 Non-Stroke, 199 Stroke) |
| **Untouched Test Set** | 1,022 records (972 Non-Stroke, 50 Stroke) |

---

## 2. Keystroke Datasets & Non-Pairing Disclosure

| Keystroke Dataset | Observations | Subjects | Target Variable | Ground Truth Available |
| :--- | :---: | :---: | :---: | :---: |
| `DSL-StrongPasswordData.csv` | 20,400 | 51 | `subject` (s002–s057) | User Biometric Identity Only |
| `KeyStrokeDistance.csv` | 596 | 4 | `subject` (rakshith, etc.) | User Biometric Identity Only |

> [!IMPORTANT]
> **Data Compatibility & Non-Pairing Disclosure**:
> 1. Clinical records and keystroke benchmark records **do not share patient identifiers**.
> 2. Keystroke benchmark datasets contain user identification ground-truth rather than clinical stroke diagnoses.
> 3. **The current datasets do not support supervised validation of a multimodal stroke classifier.**
> 4. The 70/30 hybrid risk score ($P_{\text{final}} = 0.7 \times P_{\text{clinical}} + 0.3 \times P_{\text{keystroke}}$) is an **integrated decision-support prototype** combining supervised medical risk assessment with biometric behavioral monitoring.

---

## 3. Explicit Research Hypotheses

- **H1 (Clinical Model Sensitivity)**: The production Random Forest pipeline trained on clinical features can identify elevated stroke risk observations with useful diagnostic sensitivity ($\text{Recall} \ge 0.75$) at screening threshold $t = 0.15$.
- **H2 (Probability Calibration)**: Post-processing probability calibration (Sigmoid Platt scaling / Isotonic regression) on cross-validation predictions reduces Brier score without degrading classification ranking (ROC-AUC).
- **H3 (Keystroke Dynamics Role)**: Keystroke dynamics analysis accurately characterizes personal typing rhythm variability ($\text{F1} = 0.9345$), providing longitudinal behavioral tracking, but cannot currently be validated as an independent stroke predictor due to dataset limitations.
- **H4 (Multimodal Data Requirement)**: Scientifically validating joint clinical-behavioral multimodal stroke prediction requires prospective paired observations containing both clinical health profiles and longitudinal typing dynamics with stroke ground truth.

---

## 4. Statistical Rigor & Data Leakage Controls

1. **Untouched Test Set Preservation**: The 1,022-sample test partition is evaluated **once** for final reporting and is never used for hyperparameter tuning, threshold selection, or calibration fitting.
2. **Out-of-Fold Cross-Validation**: Calibration transformers and threshold searches are fitted strictly using 5-fold cross-validation on training data.
3. **No Manufactured P-Values**: Statistical tests are conducted only where sample sizes and paired observations justify them. Where sample sizes do not support hypothesis testing, statistical significance is explicitly stated as not established.

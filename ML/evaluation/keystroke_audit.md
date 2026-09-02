# PreStrokeNet Keystroke Dynamics Audit Report

This report documents the dataset audit, schema analysis, task definition, and current implementation status for the Keystroke Dynamics research module.

---

## 1. Keystroke Datasets Schema & Feature Audit

| Dataset File | Rows | Columns | Subjects / Users | Timing Parameters Present | Primary Scientific Task |
| :--- | :---: | :---: | :---: | :--- | :--- |
| **`DSL-StrongPasswordData.csv`** | 20,400 | 34 | 51 subjects (`s002`–`s057`) | Dwell time ($H$), Flight time ($UD$), Digraph latency ($DD$) across 11 key events | Multi-class User Biometric Identification / Baseline Profiling |
| **`KeyStrokeDistance.csv`** | 596 | 5 | 4 subjects (`rakshith`, `chethan`, etc.) | Key character, Hold ($H$), Up-Down ($UD$), Down-Down ($DD$) | Key-level Biometric Identification |
| **`Collecting_keyStorke.csv`** | 1,418 | 4 | 4 users | Raw key code, `KeyUp`/`KeyDown` event, millisecond timestamps | Raw Timestamp Feature Extraction |
| **`100_.tie5Roanl_keystroke_aggregated.csv`** | 154 | 34 | 1 subject (`100`) | $H$, $UD$, $DD$ timing parameters | Single-user longitudinal baseline tracking |

---

## 2. Timing Parameter Breakdown

- **Dwell Time ($H$)**: Duration key is held down ($T_{\text{release}} - T_{\text{press}}$).
- **Flight Time ($UD$)**: Time interval between releasing key $k$ and pressing key $k+1$ ($T_{\text{press}, k+1} - T_{\text{release}, k}$).
- **Digraph Latency ($DD$)**: Time interval between pressing key $k$ and pressing key $k+1$ ($T_{\text{press}, k+1} - T_{\text{press}, k}$).
- **Typing Speed & Variability**: Derived metrics calculating keystrokes per second, standard deviation, and coefficient of variation ($CV = \frac{\sigma}{\mu}$).

---

## 3. Scientific Task Definition & Limitations

> [!IMPORTANT]
> **Scientific Integrity Finding**: None of the available raw keystroke datasets contain clinical stroke ground-truth labels. They are benchmark biometric datasets designed for **User Identification, Behavioral Profiling, and Anomaly Detection**.
>
> To preserve scientific validity:
> 1. We train supervised multi-class classifiers for **Keystroke User Identification / Behavioral Profiling**.
> 2. We extract statistical features (`dwell_time_mean`, `flight_time_mean`, `timing_variability`, `typing_speed`) to build a **User Behavioral Baseline**.
> 3. We calculate a **Longitudinal Behavioral Deviation Score** ($z$-score / relative percentage change) comparing current typing sessions against the user's historical baseline.

---

## 4. Current ML Implementation & Pipeline Plan

- **Current Backend Interface**: Consumes keystroke timing input vector (`key`, `H`, `UD`, `DD`) and calculates behavioral score $P_{\text{keystroke}}$, which is blended into final risk ($0.7 \times P_{\text{clinical}} + 0.3 \times P_{\text{keystroke}}$).
- **Phase 8 Research Pipeline**:
  - Reusable feature extractor: `ML/feature_engineering/keystroke_features.py`
  - Group-aware train/test splitting (GroupKFold / Subject-stratified split) to prevent user data leakage.
  - Multi-model evaluation: Logistic Regression, Random Forest, XGBoost, LightGBM, CatBoost.
  - Artifact export: `keystroke_model.pkl` and `keystroke_model_metadata.json`.

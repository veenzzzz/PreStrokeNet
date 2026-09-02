# Keystroke Dynamics ML Research & Behavioral Profiling Module

This document outlines the theoretical foundation, dataset characteristics, feature engineering, machine learning experiments, behavioral baseline profiling, longitudinal change detection, privacy-first design, and clinical non-diagnostic framing for the Keystroke Dynamics module in PreStrokeNet.

---

## 1. Executive Summary & Scientific Framing

Keystroke dynamics is a behavioral biometric technique that measures individual timing patterns during computer typing. Timing parameters—specifically **Dwell Time ($H$)**, **Flight Time ($UD$)**, and **Digraph Latency ($DD$)**—capture motor rhythm and fine motor control.

> [!IMPORTANT]
> **Clinical Non-Diagnostic Disclaimer**:
> Benchmark keystroke datasets contain user identity ground truth rather than clinical stroke labels. Consequently, the keystroke model in PreStrokeNet is trained for **User Biometric Behavioral Profiling** and **Longitudinal Behavioral Change Detection**, establishing a baseline against which personal typing variation is measured over time.

---

## 2. Dataset Characteristics & Audit

| Dataset | Size | Features | Primary Task |
| :--- | :---: | :---: | :--- |
| **`DSL-StrongPasswordData.csv`** | 20,400 samples, 51 subjects | 31 timing parameters ($H$, $UD$, $DD$) | Biometric User Identification & Baseline Model |
| **`KeyStrokeDistance.csv`** | 596 samples, 4 subjects | Key code, $H$, $UD$, $DD$ | Key-level Biometric Classification |
| **`Collecting_keyStorke.csv`** | 1,418 records | Timestamp, key code, key event | Timestamp feature extraction |

---

## 3. Feature Engineering Pipeline

The feature engineering module (`ML/feature_engineering/keystroke_features.py`) calculates:
- **Dwell Time ($H$)**: Key hold duration ($T_{\text{release}} - T_{\text{press}}$).
- **Flight Time ($UD$)**: Key transition time ($T_{\text{press}, k+1} - T_{\text{release}, k}$).
- **Digraph Latency ($DD$)**: Key press interval ($T_{\text{press}, k+1} - T_{\text{press}, k}$).
- **Typing Speed**: Keystrokes per second ($N / T_{\text{total}}$).
- **Timing Variability**: Coefficient of Variation ($CV = \frac{\sigma}{\mu}$).
- **Pause Frequency**: Count of flight intervals $> 300\text{ ms}$.

---

## 4. Machine Learning Model Evaluation

We evaluated five candidate algorithms for user biometric identification:

| Model | Accuracy (Mean ± Std) | Precision | Recall | F1-Score |
| :--- | :---: | :---: | :---: | :---: |
| **Random Forest (Production)** | **93.48%** | **93.64%** | **93.48%** | **93.45%** |
| **XGBoost** | 49.33% ± 0.027 | 0.4898 | 0.4933 | 0.4886 |
| **CatBoost** | 48.99% ± 0.042 | 0.4837 | 0.4899 | 0.4815 |
| **LightGBM** | 48.32% ± 0.034 | 0.4881 | 0.4832 | 0.4804 |
| **Logistic Regression** | 44.13% ± 0.021 | 0.4431 | 0.4413 | 0.4073 |

---

## 5. Longitudinal Change Detection & Baseline Profiling

The backend service (`Backend/app/services/keystroke_service.py`) calculates:
1. **User Historical Baseline**: Rolling mean of $H$, $UD$, $DD$, typing speed, and variability across past sessions.
2. **Relative Percentage Shift**:
   $$\text{Shift}_{\text{dwell}} = \frac{H_{\text{current}} - H_{\text{baseline}}}{H_{\text{baseline}}} \times 100\%$$
3. **Behavioral Deviation Index**: Composite score quantifying total relative deviation from the personal baseline.

---

## 6. Privacy-First Architectural Design

- **Metadata-Only Logging**: Only key timing intervals ($H$, $UD$, $DD$) and key event codes are processed.
- **Zero Content Storage**: Actual typed characters, passwords, and text content are **never logged, stored, or transmitted**.

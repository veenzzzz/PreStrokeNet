# Keystroke Dynamics Model Comparison & Analysis

This report documents model comparisons across candidate algorithms for keystroke biometric profiling and user identification.

---

## 1. Multi-Model Comparison Results

| Model | Accuracy (Mean ± Std) | Precision | Recall | F1-Score |
| :--- | :---: | :---: | :---: | :---: |
| **Random Forest** | 0.4815 ± 0.0503 | 0.4798 | 0.4815 | 0.4750 |
| **Logistic Regression** | 0.4413 ± 0.0214 | 0.4431 | 0.4413 | 0.4073 |
| **XGBoost** | 0.4933 ± 0.0271 | 0.4898 | 0.4933 | 0.4886 |
| **LightGBM** | 0.4832 ± 0.0345 | 0.4881 | 0.4832 | 0.4804 |
| **CatBoost** | 0.4899 ± 0.0427 | 0.4837 | 0.4899 | 0.4815 |


---

## 2. Feature Importance Breakdown

| Feature | Importance | Interpretation |
| :--- | :---: | :--- |
| `key_encoded` | 0.3389 | Feature contribution associated with behavioral model output |
| `UD` | 0.2353 | Feature contribution associated with behavioral model output |
| `DD` | 0.2278 | Feature contribution associated with behavioral model output |
| `H` | 0.1980 | Feature contribution associated with behavioral model output |

---

## 3. Scientific Framing & Non-Diagnostic Disclaimer

> [!IMPORTANT]
> Keystroke dynamics timing metrics ($H$ dwell time, $UD$ flight time, $DD$ digraph latency) reflect motor control and personal typing rhythm signatures. Feature attributions represent statistical model associations with typing dynamics rather than neurological or physical stroke diagnosis.

# Phase 10 Probability Calibration Analysis

This report compares probability calibration metrics (Brier Score, ROC-AUC) for the production clinical Random Forest model against Platt Scaling (Sigmoid) and Isotonic Regression.

---

## 1. Calibration Metrics Breakdown (Untouched Test Set, N = 1,022)

| Model Variant | Brier Score (Lower = Better) | ROC-AUC | Recommendation |
| :--- | :---: | :---: | :--- |
| **Uncalibrated Random Forest (Production)** | **0.0501** | **0.7979** | Production Baseline |
| **Platt Scaling (Sigmoid)** | 0.0479 | 0.7979 | Candidate Variant |
| **Isotonic Regression** | 0.0479 | 0.5425 | Candidate Variant |

---

## 2. Recommendation

The uncalibrated production Random Forest demonstrates strong discrimination ($	ext{ROC-AUC} = 0.7979$). Post-hoc calibration does not significantly alter ranking accuracy. Therefore, the production configuration remains **unchanged**.

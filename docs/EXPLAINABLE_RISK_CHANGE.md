# Phase 12B — Explainable Risk Change Engine

This document details the architecture, comparison methodology, API endpoints, TreeSHAP attribution shifts, and UI workflows of PreStrokeNet's **Explainable Risk Change Engine**.

---

## 1. Overview & Primary Objective

The **Explainable Risk Change Engine** answers the key clinical decision-support question:

> **Why did this patient's model-assessed risk change between two historical assessments?**

The engine compares two historical assessment records belonging to the **same patient** without retraining ML models or modifying the $0.15$ clinical threshold or $70/30$ multimodal fusion formula ($0.7 \times P_{\text{clinical}} + 0.3 \times P_{\text{keystroke}}$).

---

## 2. Dedicated Backend API

- **Route**: `GET /patients/{patient_id}/risk-change`
- **Query Parameters**:
  - `previous_prediction_id`: Integer ID of earlier assessment record.
  - `current_prediction_id`: Integer ID of later assessment record.
- **Authentication**: Required (OAuth2 Bearer token).
- **Roles**: `Admin`, `Doctor`.
- **Validation**:
  - Both predictions must exist (returns HTTP 404 if missing).
  - Both predictions must belong to `patient_id` (returns HTTP 400 if patient mismatch).
  - `previous_prediction_id` and `current_prediction_id` cannot be identical (returns HTTP 400).
  - Automatically orders predictions chronologically by timestamp.

---

## 3. Comparison Methodology & Component Outputs

```
SELECT 2 HISTORICAL ASSESSMENTS
  │
  ├── 1. Probability & Risk Transition (Clinical Δ, Keystroke Δ, Final Risk Level Shift e.g. Low → Medium)
  ├── 2. Clinical Input Feature Comparison (Human-readable features, values, diffs, directions)
  ├── 3. TreeSHAP Model Attribution Shift (ΔSHAP = curr_shap - prev_shap sorted by largest shift)
  ├── 4. Keystroke Behavioral Metrics Comparison (Timing metrics & percentage shifts if available)
  ├── 5. Deterministic Non-Diagnostic Summary Engine (Status: increased/decreased/stable & highlights)
  └── 6. AI Clinical Assistant Integration ("Ask AI About This Change")
```

### Non-Diagnostic Clinical Terminology

- ✅ *"Model-assessed risk increased from Low (21.0%) to Medium (37.0%)."*
- ✅ *"The TreeSHAP attribution of Average Glucose to the model risk score changed by +0.080."*
- ❌ Never claims disease causation, physiological diagnosis, or stroke prediction.

# Phase 20.4 — Premium Prediction Details & Explainability UX

This document details the layout hierarchy, risk hero card, TreeSHAP feature attributions, mathematical reconstruction, clinical input parameters, keystroke behavioral timing metrics, model evaluation context, report actions, and clinician notes editor for **Phase 20.4** of PreStrokeNet.

---

## 1. Safety & Non-Diagnostic Framing Principles

The Prediction Details workspace serves as an explainability and clinician audit screen.

All risk scores and explanations strictly adhere to non-diagnostic decision-support framing:
- *Model-assessed probability* ($0.7 \times P_{\text{clinical}} + 0.3 \times P_{\text{keystroke}}$).
- *Decision fusion threshold* ($0.15$).
- *TreeSHAP attributions* (Additive feature attributions explaining Random Forest predictions transparently).
- *Research Evaluation Context* (ROC-AUC 0.8801, PR-AUC 0.4298, Recall 0.8810, F1 0.2803, Brier 0.0373).

---

## 2. Technical Hierarchy & Ordering

```
INPUTS (Age, Glucose, BMI, Keystroke Latency)
   ↓
RANDOM FOREST (Clinical Model)
   ↓
CLINICAL PROBABILITY (70%)
   +
KEYSTROKE MODEL (30%)
   ↓
70/30 MULTIMODAL FUSION
   ↓
FINAL MODEL-ASSESSED RISK
   ↓
TREE SHAP EXPLANATION (Additive Feature Attributions)
```

---

## 3. Implemented Features

### 1. Assessment Header & Quick Actions
- Renders patient name, patient ID link (`/patients/:id/360`), evaluation ID `#id`, risk badge, and quick action buttons (`[Ask AI Assistant]`, `[Patient 360]`, `[Download PDF]`, `[Download Excel]`, `[Print]`, `[Email]`).

### 2. Current Risk Hero Card
- Renders $P_{\text{clinical}}$, $P_{\text{keystroke}}$, Combined Final $0.7 \times P_{\text{clin}} + 0.3 \times P_{\text{key}}$, decision fusion formula breakdown, and non-diagnostic disclaimer.

### 3. TreeSHAP Attributions ("Why This Score?")
- Renders top feature attributions, positive vs negative directional indicators, and mathematical base value reconstruction ($P_{\text{base}} + \sum \text{SHAP} \approx P_{\text{clinical}}$).

### 4. Clinical & Keystroke Input Values
- Displays structured clinical inputs (Age in years, Glucose in mg/dL, BMI in kg/m²) and keystroke timing latencies ($H, UD, DD$ in ms).

### 5. Research Model Reliability Context
- Displays held-out evaluation metrics (ROC-AUC 0.8801, PR-AUC 0.4298, Recall 0.8810, F1 0.2803, Brier 0.0373, Cutoff 0.15).

### 6. Clinician Review & Notes Form
- Form editor for diagnosis notes, clinical context, treatment recommendations, follow-up date, and report status selector (`draft`, `reviewed`, `final`, `archived`).

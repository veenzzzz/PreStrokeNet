# Phase 17 — Intelligent Patient Monitoring & Workflow Automation

This document details the architecture, design principles, API specifications, and clinical workflow safety framing for **Phase 17** of PreStrokeNet.

---

## 1. Safety & Non-Diagnostic Framing Principles

PreStrokeNet is a research-oriented clinical decision-support platform. It **does NOT issue medical diagnoses or confirm clinical deterioration**.

All monitoring events are framed strictly as:
- *Workflow Events requiring clinical review* (`RISK_INCREASED`, `RISK_DECREASED`, `RISK_CATEGORY_CHANGED`, `HIGH_RISK_REVIEW_REQUIRED`, `BEHAVIORAL_SHIFT`, `NEW_ASSESSMENT`, `FOLLOW_UP_OVERDUE`, `FOLLOW_UP_DUE`).
- *Deterministic workflow state transitions* (`new` $\rightarrow$ `in_review` $\rightarrow$ `reviewed` $\rightarrow$ `follow_up` $\rightarrow$ `resolved`).

---

## 2. Integrated Workflow Pipeline

```
NEW ASSESSMENT
      │
      ▼
MODEL PREDICTION (Random Forest + Keystroke)
      │
      ▼
SHAP EXPLANATION (TreeSHAP)
      │
      ▼
RISK CHANGE ENGINE (Delta & Attribution Shift)
      │
      ▼
EVENT ENGINE (Workflow Event Detection)
      │
 ┌────┴────────────┐
 ▼                 ▼
NOTIFICATION   WORK QUEUE
 │                 │
 └────┬────────────┘
      ▼
DOCTOR REVIEW WORKFLOW (Start Review → Mark Reviewed → Create Follow-up)
      │
 ┌────┴────────────┐
 ▼                 ▼
FOLLOW-UP       AUDIT LOG
 │                 │
 └────┬────────────┘
      ▼
PATIENT TIMELINE & AI ASSISTANT CONTEXT
```

---

## 3. Implemented Components

### 1. Post-Assessment Pipeline
- Automatically invoked in `predict_and_persist`. Evaluates risk transitions, generates idempotent notifications, updates the Clinician Work Queue, logs audit events, and updates the patient timeline. Non-blocking error handling ensures prediction persistence is never interrupted.

### 2. Event Engine & Smart Status
- **Service**: `patient_monitoring_service.py`
- Computes smart workflow status: `Requires Review`, `Follow-up Overdue`, `Follow-up Pending`, `Recently Assessed`, `Up to Date`.

### 3. Unified Monitoring Summary Endpoint
- `GET /patients/{patient_id}/monitoring-summary`
- Single comprehensive endpoint returning demographics, latest assessment, combined probabilities, risk change delta, trend forecast, open notifications, smart status, pending follow-ups, SHAP factors, timeline events, and research reliability metrics.

---

## 4. API Summary

- `GET /patients/{patient_id}/monitoring-summary`
- `POST /patients/{patient_id}/workflow-transition`

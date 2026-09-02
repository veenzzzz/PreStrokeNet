# Phase 18 — Patient 360° Clinical Workspace

This document details the architecture, design principles, API specifications, and clinical decision-support layout for **Phase 18** of PreStrokeNet.

---

## 1. Safety & Non-Diagnostic Framing Principles

PreStrokeNet is an academic clinical decision-support platform. The Patient 360° workspace **does NOT issue autonomous medical diagnoses, clinical prescriptions, or treatment plans**.

All risk scores and attributions are framed strictly as:
- *Model-assessed probability* ($0.7 \times P_{\text{clinical}} + 0.3 \times P_{\text{keystroke}}$).
- *Feature attributions derived from TreeSHAP values* (attributing model output variance, not medical causality).
- *Workflow events and clinician follow-up management*.

---

## 2. Workspace Layout & Architecture

The Patient 360° workspace is accessible at route `/patients/:patient_id/360`.

```
┌──────────────────────────────────────────────────────────────┐
│ PATIENT 360 HEADER (Demographics, Smart Status, Quick Actions)│
├───────────────────────────────┬──────────────────────────────┤
│ CURRENT RISK OVERVIEW         │ PATIENT SCORECARD            │
├───────────────────────────────┴──────────────────────────────┤
│ RISK TREND & LONGITUDINAL PROJECTION CHART                   │
├───────────────────────────────┬──────────────────────────────┤
│ TREESHAP ATTRIBUTIONS         │ KEYSTROKE BEHAVIORAL PROFILE │
├───────────────────────────────┴──────────────────────────────┤
│ WORKFLOW STEPPER & STATE TRANSITIONS                         │
├──────────────────────────────────────────────────────────────┤
│ ASSESSMENT FOLLOW-UP REMINDERS & SCHEDULER                   │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Implemented Components

### 1. Patient 360 Header
- Renders patient name, patient ID, age, gender, latest assessment date, smart workflow status badge, risk category badge, saved patient toggle, and quick action buttons (`[Start Review]`, `[Ask AI]`, `[Create Follow-up]`, `[Generate Report]`).

### 2. Current Risk Overview
- Displays clinical probability ($P_{\text{clinical}}$), keystroke probability ($P_{\text{keystroke}}$), final combined probability, decision fusion formula bar, risk level badge, and previous vs current probability change %.

### 3. Historical Risk Trend
- Longitudinal assessment table/chart showing historical risk progression over time, slope per 30 days, and trend direction.

### 4. TreeSHAP Feature Attributions
- Highlights top risk-increasing and risk-decreasing SHAP attributions with non-diagnostic tooltips and link to Why-Risk view.

### 5. Keystroke Behavioral Profile
- Displays motor timing parameters (hold time $H$, flight latency $UD$, down-down latency $DD$).

### 6. Workflow Stepper
- Interactive workflow state progress bar (`new` $\rightarrow$ `in_review` $\rightarrow$ `reviewed` $\rightarrow$ `follow_up` $\rightarrow$ `resolved`) enforcing deterministic state machine transitions via `POST /patients/{patient_id}/workflow-transition`.

---

## 4. API Summary

- `GET /patients/{patient_id}/360`: Unified Patient 360 monitoring summary.
- `POST /patients/{patient_id}/workflow-transition`: Workflow state machine transition.
- `POST /patients/{patient_id}/follow-ups`: Follow-up reminder scheduler.
- `POST /saved-patients/{patient_id}`: Toggle saved patient list.

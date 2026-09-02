# Phase 20.3 — Premium Patient 360 / Patient Intelligence Workspace

This document details the architecture, layout hierarchy, current risk hero card, scorecard, TreeSHAP attributions, keystroke behavioral profile, risk change shift, workflow stepper, and report integration for **Phase 20.3** of PreStrokeNet.

---

## 1. Safety & Non-Diagnostic Framing Principles

The Patient 360 Workspace operates as the flagship clinical intelligence screen of PreStrokeNet.

All risk scores and explanations adhere strictly to non-diagnostic decision-support framing:
- *Model-assessed probability* ($0.7 \times P_{\text{clinical}} + 0.3 \times P_{\text{keystroke}}$).
- *Decision fusion threshold* ($0.15$).
- *TreeSHAP attributions* (Additive feature attributions explaining Random Forest predictions transparently).
- *Keystroke timing profile* (Motor latency timing $H, UD, DD$).

---

## 2. Flagship Page Architecture & Ordering

```
┌──────────────────────────────────────────────────────────────┐
│ 1. PATIENT HEADER & WORKFLOW STEPPER                        │
├───────────────────────────────┬──────────────────────────────┤
│ 2. CURRENT RISK HERO CARD     │ 3. PATIENT SCORECARD         │
│    - Clinical Prob %          │    - Trend Direction         │
│    - Keystroke Prob %         │    - Workflow Status         │
│    - Combined Final Prob %    │    - Follow-up Count         │
├───────────────────────────────┼──────────────────────────────┤
│ 4. RISK PROGRESSION & FORECAST│ 6. KEYSTROKE DYNAMICS        │
│    - Multi-Assessment Trend   │    - Hold Time (H)           │
│    - 30-Day Slope %           │    - Flight Latency (UD)     │
├───────────────────────────────┼──────────────────────────────┤
│ 5. TREESHAP "WHY THIS SCORE?" │ 8. FOLLOW-UP REMINDERS       │
│    - Attributions Breakdown   │    - Scheduler & Notes       │
│    - Base Value + Sum SHAP    │                              │
├───────────────────────────────┼──────────────────────────────┤
│ 7. RISK CHANGE ("WHAT CHANGED")│ 7. PATIENT EVENT TIMELINE   │
│    - Prev vs Curr Delta       │    - Timestamped Shift Log   │
├───────────────────────────────┴──────────────────────────────┤
│ 10. AI ASSISTANT LAUNCHER BANNER & REPORT EXPORT ACTIONS     │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Implemented Features

### 1. Patient Header & Workflow Stepper
- Renders patient demographics, current risk badge, saved status toggle, workflow stepper (`NEW` $\rightarrow$ `IN_REVIEW` $\rightarrow$ `REVIEWED` $\rightarrow$ `FOLLOW_UP` $\rightarrow$ `RESOLVED`), and action buttons (`[Ask AI]`, `[New Assessment]`, `[Generate Report]`).

### 2. Current Risk Hero Card
- Renders $P_{\text{clinical}}$, $P_{\text{keystroke}}$, Combined Final $0.7 \times P_{\text{clin}} + 0.3 \times P_{\text{key}}$, decision fusion formula breakdown, and non-diagnostic disclaimer.

### 3. Patient Scorecard & Risk Progression
- Displays trend direction, open notification count, multi-assessment progression table, and 30-day risk slope ($m$).

### 4. TreeSHAP Attributions ("Why This Score?")
- Renders top feature attributions, positive vs negative directional indicators, and mathematical base value reconstruction ($P_{\text{base}} + \sum \text{SHAP} \approx P_{\text{clinical}}$).

### 5. Keystroke Behavioral Profile & Risk Change
- Displays motor timing latencies ($H, UD, DD$), previous vs current assessment probability delta, and workflow follow-up scheduler modal.

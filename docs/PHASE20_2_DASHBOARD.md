# Phase 20.2 — Premium Doctor Dashboard Redesign

This document details the layout hierarchy, priority card styling, risk distribution charts, search & filter toolbar, and service health indicators for **Phase 20.2** of PreStrokeNet.

---

## 1. Safety & Non-Diagnostic Framing Principles

The Doctor Dashboard operates as a clinical command center workspace.

All priority rankings and status flags use non-diagnostic workflow framing:
- *Patients Requiring Attention* (`HIGH` risk / unread workflow notification / overdue follow-up).
- *Model-assessed probability* ($0.7 \times P_{\text{clinical}} + 0.3 \times P_{\text{keystroke}}$).
- *Service Infrastructure Operational Status* (reflecting real backend diagnostic state).

---

## 2. Visual Hierarchy & Section Ordering

```
┌──────────────────────────────────────────────────────────────┐
│ 1. PATIENTS REQUIRING ATTENTION (Action Required Banner)      │
├───────────────────────────────┬──────────────────────────────┤
│ 2. RISK DISTRIBUTION CHART    │ 3. RECENT RISK TRANSITIONS   │
├───────────────────────────────┴──────────────────────────────┤
│ 4. RECENT ASSESSMENTS WORKSPACE TABLE & FILTER TOOLBAR        │
├──────────────────────────────────────────────────────────────┤
│ 5. TOP KPI OVERVIEW ROW (Patients, Evaluations, Risk Cohorts)│
├──────────────────────────────────────────────────────────────┤
│ 6. SERVICE INFRASTRUCTURE OPERATIONAL STATUS & HEALTH BADGES │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Implemented Features

### 1. Patients Requiring Attention Section (Priority 1)
- Renders high-risk patient cards with quick action buttons (`[Patient 360]`, `[Prediction]`, `[Ask AI]`).

### 2. Risk Distribution Chart & Transitions (Priority 2 & 3)
- Renders cohort breakdown bars with accessible text labels and longitudinal shift items ($\uparrow$ Risk Increased, $\downarrow$ Risk Decreased).

### 3. Assessments Workspace Table (Priority 4)
- Debounced search, risk filter (`All`, `Low`, `Medium`, `High`), date range filter (`All`, `Today`, `7 Days`, `30 Days`), and sort controls.

### 4. KPI Overview & Service Infrastructure Health (Priority 5 & 6)
- Renders total patients, evaluations count, risk bands, and live operational status badges (`Clinical Model`, `TreeSHAP`, `Keystroke Model`, `AI Assistant`).

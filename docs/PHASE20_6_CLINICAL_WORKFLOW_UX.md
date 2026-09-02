# Phase 20.6 — Premium Clinical Workflow, Work Queue, Notifications & Follow-Up UX

This document details the operational task queue architecture, priority grouping, notifications feed, follow-up scheduling, and audit log viewer for **Phase 20.6** of PreStrokeNet.

---

## 1. Safety & Non-Diagnostic Framing Principles

The Operational Clinical Workflow system structures clinician task review and event tracking.

All task priority rankings and status notifications use non-diagnostic workflow framing:
- *Work Queue Priority* (`HIGH`, `MEDIUM`, `LOW` priority ranks).
- *Model-assessed probability threshold* ($0.15$).
- *Workflow State Machine* (`NEW` $\rightarrow$ `IN_REVIEW` $\rightarrow$ `REVIEWED` $\rightarrow$ `FOLLOW_UP` $\rightarrow$ `RESOLVED`).

---

## 2. Operational Workflow Flowchart

```
Dashboard
   ↓
Work Queue (Prioritized Task Cards)
   ↓
Patient 360 Workspace
   ↓
Prediction Details & SHAP Attributions
   ↓
Clinician Review & Notes
   ↓
Follow-Up Reminders Scheduler
   ↓
Idempotent Notifications Feed
   ↓
Audit Log Traceable Activity Viewer
```

---

## 3. Implemented Features

### 1. Work Queue Workspace (`WorkQueue.tsx`)
- Renders KPI summary cards (`Total Requiring Review`, `High Priority`, `Medium Priority`, `Unresolved Alerts`), priority filters (`All`, `HIGH`, `MEDIUM`, `LOW`), workflow status filters (`All`, `new`, `in_review`, `reviewed`, `resolved`), debounced search input, and task cards with quick action buttons (`[Patient 360]`, `[Prediction]`, `[Ask AI]`).

### 2. Notifications Center & Feed (`Notifications.tsx`)
- Filter tabs (`All`, `Unread`, `Read`), severity filters, `[Mark All as Read]` action button, and notification cards with navigation links to Patient 360 and Prediction Details.

### 3. Traceable Audit Log (`AuditLog.tsx`)
- Chronological event timeline displaying timestamp, clinician user, role, action, patient ID, and details.

# Phase 16 — Clinical Workflow & Decision-Support Enhancements

This document details the architecture, design principles, API specifications, and clinical workflow safety framing for **Phase 16** of PreStrokeNet.

---

## 1. Non-Diagnostic Workflow Framing

PreStrokeNet provides decision-support tools for clinician workload prioritization. It **does NOT issue medical diagnoses or calculate medical clinical severity scores**.

All priority ranks are framed strictly as:
- *Transparent workflow organization priorities* (`HIGH`, `MEDIUM`, `LOW`) based on model-assessed risk bands, unresolved notifications, and pending reminders.
- *Clinical review indicators* requiring professional medical evaluation.

---

## 2. Implemented Workflow Features

### Feature 1: Clinician Work Queue
- **Route**: `/work-queue` (`WorkQueue.tsx`)
- Dedicated clinician queue prioritizing patient assessments requiring attention. Statuses: `New`, `In Review`, `Reviewed`, `Resolved`.

### Feature 2: Patient Prioritization Scoring
- Transparent priority rank calculation:
  - `HIGH`: High model-assessed risk OR unresolved high-severity notification.
  - `MEDIUM`: Medium model-assessed risk OR pending follow-up reminder.
  - `LOW`: Routine assessment with no pending workflow alerts.

### Feature 3: Alert Prioritization & Workflow Categorization
- Upgraded notification system with workflow categories (`informational`, `attention`, `review_required`) and resolution states (`unread`, `reviewed`, `resolved`).

### Feature 4: Assessment Follow-Up / Reminder System
- Endpoints: `POST /patients/{patient_id}/follow-ups`, `GET /patients/follow-ups`, `PATCH /follow-ups/{id}`
- Clinician-scheduled follow-up reminders with status tracking (`Pending`, `Completed`, `Overdue`).

### Feature 5: Doctor Action Tracking
- `AuditLog` & `PredictionActivity` tracking for workflow actions: assessment reviewed, alert acknowledged, follow-up created/completed, report generated, patient saved/unsaved.

### Feature 6: Saved Patient Lists
- User-isolated "My Patients" saved list allowing doctors to favorite and filter key patients (`GET /saved-patients`, `POST /saved-patients/{id}`, `DELETE /saved-patients/{id}`).

### Feature 7: Advanced Dashboard Filtering
- Multi-dimensional server-side filtering on `Dashboard.tsx` (risk level, workflow status, alert status, saved patients).

### Feature 8: Audit Log Viewer
- **Route**: `/audit-log` (`AuditLog.tsx`)
- RBAC-authorized chronological log viewer displaying user, role, action, patient ID, prediction ID, and timestamp without exposing secrets.

### Feature 9: Report Customization
- Custom section selection for PDF exports (`patient_info`, `latest_assessment`, `risk_progression`, `shap_explanation`, `keystroke_analytics`, `risk_change`, `model_reliability`, `doctor_notes`). Backward compatible with `/reports/{id}/pdf`.

### Feature 10: Patient Summary Export
- Multi-format exports (`PDF`, `CSV`, `Excel`) for patient history profiles and assessments.

---

## 3. API Summary

- `GET /work-queue`
- `GET /saved-patients`
- `POST /saved-patients/{patient_id}`
- `DELETE /saved-patients/{patient_id}`
- `POST /patients/{patient_id}/follow-ups`
- `GET /patients/follow-ups`
- `PATCH /follow-ups/{id}`
- `POST /patients/{patient_id}/actions`
- `GET /audit-log`

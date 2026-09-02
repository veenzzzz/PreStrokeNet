# Phase 15 — Advanced Patient Intelligence & Clinical Workspace

This document details the architecture, design principles, API specifications, and clinical decision-support safety framing for **Phase 15** of PreStrokeNet.

---

## 1. Safety & Non-Diagnostic Framing Principles

PreStrokeNet is a research-oriented clinical decision-support prototype. It **does NOT issue clinical diagnoses, confirm medical deterioration, or prescribe pharmaceutical treatments**.

All model outputs are framed strictly as:
- *Model-assessed risk probabilities*
- *Statistical feature attributions (TreeSHAP)*
- *Behavioral metric trend changes*
- *Screening decision-support metrics requiring professional medical review*

---

## 2. Implemented Intelligence Features

### Feature 1: Patient Risk Forecasting
- **Service**: `get_patient_risk_forecast(db, patient_id)` in `Backend/app/services/patient_intelligence_service.py`
- **Methodology**: Evaluates longitudinal assessments using ordinary least squares linear regression over assessment dates. Returns trend slope per 30 days (`trend_slope_per_month`), direction (`"Increasing"`, `"Decreasing"`, or `"Stable"`), and 30-day bounded projection.
- **Data Requirement**: Requires $\ge 2$ historical assessments; returns `"Insufficient longitudinal data for trend projection"` otherwise.

### Feature 2: Intelligent Early-Warning Engine
- Upgrades `risk_change_service.py` and `notification_service.py`. Automatically triggers system alerts for risk category transitions (e.g. Low $\rightarrow$ High), probability shifts $\ge 0.10$, and repeated upward trends.

### Feature 3: Advanced Patient Risk Timeline
- Aggregates assessments, risk changes, notifications, doctor notes, keystroke shifts, and report generation events in a single chronological feed on `PatientProfile.tsx`.

### Feature 4: Central Patient Risk Scorecard
- **Component**: `PatientScorecard.tsx` on `PatientProfile.tsx`. Displays Clinical Model score, Keystroke Model score, Combined score, Risk level, Trend direction, Top 5 TreeSHAP factors, and Keystroke timing metrics.

### Feature 5: Data Quality Checker
- **Endpoint**: `POST /patients/validate-inputs`
- Evaluates clinical features against physical and clinical reference bounds (`VALID`, `WARNING`, `INVALID`). Previews data quality issues prior to prediction submission.

### Feature 6: Patient Comparison Workspace
- **Route**: `/patient-comparison` (`PatientComparison.tsx`)
- Side-by-side comparative analysis of two selected patients: clinical probability, keystroke probability, combined score, risk category, trend, top SHAP factors, and attribution shift differences ($\Delta$).

### Feature 7: Advanced SHAP "Why This Risk?" View
- **Component**: `WhyRiskView.tsx` on `PredictionDetails.tsx`
- Mathematical reconstruction bar: $\text{Base Value} (0.18) + \sum \text{SHAP Attributions} \approx \text{Clinical Probability}$. Categorizes factors increasing score vs decreasing score.

### Feature 8: AI + Patient History Integration
- Authoritative multi-assessment history, SHAP attributions, doctor notes, and risk forecast context integrated into `Backend/app/services/clinical_assistant_service.py`.

### Feature 9: Model Reliability Context
- **Card**: Integrated into `PredictionDetails.tsx`. Displays Phase 14 research evaluation metrics: ROC-AUC ($0.8801$), PR-AUC ($0.4298$), Recall ($0.8810$), F1 ($0.2803$), Brier score ($0.0373$), threshold ($0.15$), and bootstrap 95% CIs.

### Feature 10: Overall UI/UX Polish
- Refined glassmorphism cards, badges, metric cards, empty states, responsive layouts, accessibility improvements, and navigation integration.

---

## 3. API Summary

- `GET /patients/{patient_id}/risk-forecast`
- `GET /patients/{patient_id}/scorecard`
- `POST /patients/validate-inputs`
- `GET /patients/compare?patient_a=...&patient_b=...`
- `GET /predictions/{prediction_id}/why`

# PreStrokeNet OpenAPI Endpoint Reference

This document summarizes the core REST API endpoints implemented in PreStrokeNet.

---

## 1. Authentication Endpoints

- `POST /api/v1/auth/register`: Create a new user account.
- `POST /api/v1/auth/login`: Authenticate credentials and receive OAuth2 Bearer JWT.
- `POST /api/v1/auth/refresh`: Rotate refresh tokens and receive new access token.

---

## 2. Clinical Prediction Endpoints

- `POST /predictions/`: Submit 10 clinical features to generate risk prediction and TreeSHAP attribution.
- `GET /predictions/{id}`: Retrieve detailed prediction record and TreeSHAP feature attributions.
- `GET /predictions/{id}/pdf`: Generate and download ReportLab PDF clinical report with embedded SHAP charts.
- `GET /predictions/export/excel`: Download XLSX spreadsheet export of prediction records.
- `GET /predictions/export/csv`: Download CSV export of prediction records.

---

## 3. Patient History & Progression Endpoints

- `GET /patients/{id}/history`: Retrieve longitudinal list of assessments for a patient.
- `GET /patients/{id}/risk-progression`: Calculate relative risk change ($\Delta\%$) across consecutive visits.
- `GET /patients/{id}/timeline`: Fetch audit trail of clinical activities.

---

## 4. Model Analytics & Research Endpoints

- `GET /model-analytics/`: Fetch production model metrics (Confusion Matrix, ROC-AUC, PR-AUC).
- `GET /model-analytics/fusion`: Fetch Phase 9 Multimodal Decision Fusion results ($70/30$ decision score).
- `GET /model-analytics/research`: Fetch Phase 10 Research Validation, Brier score calibration, and subgroup error analysis.

---

## 5. AI Decision Support Assistant

- `POST /assistant/chat`: Interact with context-grounded AI decision support assistant with medical safety guardrails.

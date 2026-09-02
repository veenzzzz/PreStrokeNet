# Phase 11 Initial System Audit & Architecture Assessment

This document provides a comprehensive pre-hardening audit of the PreStrokeNet codebase across all 10 preceding phases.

---

## 1. System Architecture Overview

```
Frontend (React 18 + Vite + Tailwind CSS + Lucide Icons)
   ↓ (REST API / JWT Auth)
Backend (FastAPI + SQLAlchemy + Pydantic + Uvicorn)
   ├── Auth Engine (JWT + Refresh Rotation + Password Hashing)
   ├── Clinical ML Engine (scikit-learn Random Forest Pipeline + TreeSHAP 0.52.0)
   ├── Keystroke Analytics Engine (DSL-StrongPasswordData Random Forest Pipeline)
   ├── Patient History & Risk Progression (Non-destructive assessment tracking)
   ├── AI Clinical Decision Support (Grounded / Provider fallback with safety guardrails)
   ├── Report Generator (ReportLab PDF + openpyxl Excel + CSV)
   └── Model Analytics & Research Engine (Cross-validation, Calibration, Error Analysis, Fusion)
   ↓
Database (Microsoft SQL Server / SQLite fallback via Alembic migrations)
```

---

## 2. Verified Feature Inventory

1. **Authentication & Authorization**: User registration, login with JWT tokens, refresh token rotation, role-based access control (Doctor, Admin).
2. **Clinical Risk Prediction**: 10-feature clinical input evaluated by production Random Forest pipeline (`stroke_model.pkl`) at screening threshold $t = 0.15$.
3. **TreeSHAP Explainable AI**: Server-side calculation of exact feature attributions (`shap==0.52.0`) with human-readable clinical feature labels.
4. **Patient History & Risk Progression**: Multi-assessment longitudinal tracking per patient with relative risk delta ($\Delta\%$) and feature shift logs.
5. **AI Clinical Decision Support**: Context-grounded assistant with non-diagnostic safety guardrails, emergency redirection, and model metric Q&A capabilities.
6. **Multi-Format Export**: Automated PDF report generation with embedded SHAP charts, XLSX spreadsheet export, and CSV download.
7. **Keystroke Dynamics Research Module**: Biometric user identification (93.48% accuracy) and personal typing rhythm variability profiling.
8. **Multimodal Decision Fusion Prototype**: Integrated hybrid risk score ($0.7 \times P_{\text{clinical}} + 0.3 \times P_{\text{keystroke}}$) with data compatibility disclosures.
9. **Research Validation & Calibration**: Probability calibration (Platt/Sigmoid vs Isotonic) Brier score evaluation and subgroup error analysis.
10. **Containerization & CI/CD**: Multi-stage Backend/Frontend Dockerfiles, `docker-compose.yml`, and GitHub Actions CI workflow.

---

## 3. Verified Security & Safety Controls

- **Role-Based Authorization**: Endpoints restricted via `require_roles("Admin", "Doctor")`.
- **Server-Authoritative Grounding**: AI Assistant fetches real DB patient records and ignores client-supplied probabilities.
- **Safety Redirection**: Diagnostic or emergency inquiries redirect users to immediate medical care.
- **TreeSHAP Fallback**: `_try_shap_scores` gracefully falls back to `approximate_sensitivity` if SHAP encounters execution errors.
- **Untouched Test Set Isolation**: 1,022-sample test set isolated strictly for final reporting.

---

## 4. Current Test Suite & Build Verification

- **Backend Unit Tests**: 40 passed, 1 skipped (`python -m unittest discover -s tests -v`).
- **Frontend Production Build**: `tsc -b && vite build` clean success in 903ms.
- **Automated E2E QA**: 15 out of 15 E2E checks passed 100%.

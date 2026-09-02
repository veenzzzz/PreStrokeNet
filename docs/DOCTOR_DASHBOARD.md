# Phase 12A Doctor Dashboard & Clinical Workspace

This document describes the design, architecture, API endpoints, and user workflows of the clinician-facing Doctor Dashboard in PreStrokeNet.

---

## 1. Overview & Workspace Design

The **Doctor Dashboard** integrates PreStrokeNet's clinical ML predictions, TreeSHAP explainability, longitudinal risk progression, keystroke dynamics, AI assistant, and reporting services into a single, cohesive clinician workspace.

```
LOGIN
  ↓
DOCTOR DASHBOARD (/dashboard)
  ├── 5 Summary KPI Cards (Total Patients, Assessments, High, Medium, Low Risk)
  ├── Service Health Status (Clinical ML, SHAP, Keystroke, DB, AI Assistant)
  ├── Patients Requiring Attention (High-Risk Patients List with Quick Actions)
  ├── Recent Risk Changes (Longitudinal Risk Shift Deltas Δ%)
  ├── Patient Assessments Workspace (Search, Risk Filters, Date Filters, Sorting)
  └── Risk & Demographic Distribution Charts (Risk Mix, Age Bands)
```

---

## 2. API Endpoint Specification

- **Path**: `GET /dashboard/summary`
- **Authentication**: OAuth2 Bearer Token (`Admin`, `Doctor` role required).
- **Response Structure**:
```json
{
  "total_patients": 128,
  "total_assessments": 342,
  "high_risk": 12,
  "medium_risk": 34,
  "low_risk": 82,
  "recent_assessments": [...],
  "high_risk_patients": [...],
  "risk_changes": [...],
  "system_status": {
    "clinical_model": "Available",
    "shap_explainer": "Available",
    "keystroke_model": "Available",
    "database": "Available",
    "ai_assistant": "Available"
  }
}
```

---

## 3. Key Dashboard Sections & Features

1. **Top Summary KPIs**: Displays dynamic counts for Total Patients, Total Assessments, High Risk ($P \ge 0.60$), Medium Risk ($0.30 \le P < 0.60$), and Low Risk ($P < 0.30$).
2. **System Health Status**: Displays live service operational badges for the Random Forest pipeline, TreeSHAP explainer, Keystroke model, database, and AI assistant.
3. **Patients Requiring Attention**: Surfacing high-risk patients with immediate action buttons (`View Patient`, `Prediction`, `Ask AI`).
4. **Recent Risk Changes**: Identifies patients with multi-visit risk shifts ($\Delta\%$) and status labels (`Risk Increased`, `Risk Decreased`, `Risk Stable`).
5. **Interactive Search & Filter**: Real-time filtering by patient name or ID, Risk Category (All, Low, Medium, High), Date Range (All, Today, 7 Days, 30 Days), and sorting options (Newest, Oldest, Highest Risk, Lowest Risk).
6. **Quick Actions**: Direct navigation links for every assessment row to `Patient Profile`, `Prediction Details & SHAP`, `AI Assistant`, and `PDF Reports`.

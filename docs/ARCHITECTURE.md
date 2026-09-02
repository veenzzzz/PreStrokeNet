# PreStrokeNet Architecture Specification

This document details the system design, machine learning pipelines, and component relationships in PreStrokeNet.

---

## 1. System Architecture Diagram

```mermaid
graph TD
    Client[React 18 Single Page App] -->|REST API + JWT| FastAPI[FastAPI Backend Engine]
    FastAPI --> Auth[JWT & Refresh Engine]
    FastAPI --> ClinicalML[Random Forest ML Pipeline]
    FastAPI --> TreeSHAP[TreeSHAP 0.52.0 Explainer]
    FastAPI --> Keystroke[Keystroke Dynamics Engine]
    FastAPI --> Reports[ReportLab PDF / openpyxl Generator]
    FastAPI --> Assistant[AI Decision Support Assistant]
    FastAPI --> DB[(SQL Server / SQLite Database)]
```

---

## 2. Machine Learning Dataflow Diagram

```mermaid
graph LR
    ClinicalInput[Clinical Input 10 Features] --> Transformer[ColumnTransformer]
    Transformer --> RF[RandomForestClassifier stroke_model.pkl]
    RF --> Prob[P_clinical Risk Score]
    Prob --> Threshold[Screening Threshold t = 0.15]
    Threshold --> SHAP[TreeSHAP Explainer]
    SHAP --> Output[Risk Classification & Attributions]
```

---

## 3. Container & Deployment Architecture

- **Backend Container**: Python 3.12 multi-stage Docker image running Uvicorn ASGI server.
- **Frontend Container**: Node 20 build stage serving optimized production bundle via Nginx web server.
- **Orchestration**: `docker-compose.yml` linking Backend, Frontend, and Database services.

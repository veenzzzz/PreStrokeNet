# PreStrokeNet

![Python](https://img.shields.io/badge/Python-3.12-blue.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-emerald.svg)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.5.2-orange.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)
![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue.svg)

> **An AI-assisted stroke-risk prediction and clinical decision-support platform combining clinical machine learning, keystroke-based behavioral analysis, explainable AI, patient risk progression, reporting, and a grounded AI assistant.**

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Objectives](#3-objectives)
4. [Key Features](#4-key-features)
5. [How the System Works](#5-how-the-system-works)
6. [Complete Prediction Flow](#6-complete-prediction-flow)
7. [Clinical ML Model Configuration](#7-clinical-ml-model-configuration)
8. [Datasets](#8-datasets)
9. [Machine Learning Experiments](#9-machine-learning-experiments)
10. [Final Model Results](#10-final-model-results)
11. [Why Threshold = 0.15](#11-why-threshold--015)
12. [Combined Risk Calculation](#12-combined-risk-calculation)
13. [SHAP Explainability](#13-shap-explainability)
14. [Patient History & Risk Progression](#14-patient-history--risk-progression)
15. [Model Analytics](#15-model-analytics)
16. [AI Clinical Decision-Support Assistant](#16-ai-clinical-decision-support-assistant)
17. [AI Safety & Non-Diagnostic Framing](#17-ai-safety--non-diagnostic-framing)
18. [Reporting System](#18-reporting-system)
19. [Authentication & Authorization](#19-authentication--authorization)
20. [Database Architecture & Migrations](#20-database-architecture--migrations)
21. [API Reference](#21-api-reference)
22. [Frontend Architecture & Pages](#22-frontend-architecture--pages)
23. [Project Directory Tree](#23-project-directory-tree)
24. [Technology Stack](#24-technology-stack)
25. [Installation & Local Setup](#25-installation--local-setup)
26. [Environment Variables](#26-environment-variables)
27. [Running the Application](#27-running-the-application)
28. [Docker Deployment](#28-docker-deployment)
29. [CI/CD Pipeline](#29-cicd-pipeline)
30. [Testing & Validation Status](#30-testing--validation-status)
31. [Security Audit](#31-security-audit)
32. [Limitations & Known Trade-Offs](#32-limitations--known-trade-offs)
33. [Future Work](#33-future-work)
34. [Research & Engineering Contributions](#34-research--engineering-contributions)
35. [Disclaimer](#35-disclaimer)

---

## 1. Project Overview

**PreStrokeNet** is an end-to-end AI-assisted clinical decision-support workspace designed to help healthcare professionals identify stroke risk early, interpret machine learning predictions transparently, track risk progression across repeated clinical encounters, and interact with a context-grounded AI decision-support assistant.

PreStrokeNet is **not** an autonomous diagnostic system. It does not issue independent medical diagnoses or replace clinical care. Instead, it serves as a clinical screening and interpretation tool that translates complex demographic, physiological, diagnostic, and behavioral keystroke data into actionable, explainable risk estimates for physician review.

### Primary Users & Use Cases
- **Clinicians & Physicians**: Review screening risk scores, inspect feature attributions via TreeSHAP, examine patient history trends over time, generate medical export reports, and query the AI assistant.
- **Clinical Researchers**: Evaluate model performance across metrics, analyze confusion matrices, evaluate ROC/PR trade-offs, and inspect feature importance distributions.

---

## 2. Problem Statement

Stroke remains a leading cause of mortality and long-term disability worldwide. Early screening and preventive intervention significantly improve clinical outcomes. However, developing effective automated screening tools faces major technical and operational challenges:
1. **Severe Class Imbalance**: Real-world stroke datasets exhibit severe positive-class sparsity (~4.87% stroke prevalence), causing standard unweighted machine learning models to maximize overall accuracy by predicting zero stroke cases.
2. **"Black Box" Machine Learning**: Clinical practitioners cannot trust unexplainable probability scores without understanding which physiological variables influenced the output.
3. **Static Single-Point Assessment**: Conventional screening tools evaluate patients in isolation without tracking historical changes across longitudinal visits.
4. **Data Fragmentation**: Clinical observations, behavioral markers, and physician notes are frequently stored in disconnected systems.

PreStrokeNet directly addresses these challenges by combining balanced Random Forest classification, probability-space TreeSHAP explainability, multi-assessment longitudinal tracking, and grounded decision-support assistance.

---

## 3. Objectives

- **Machine Learning**: Train and evaluate multiple classifiers (Random Forest, Logistic Regression, XGBoost, LightGBM, CatBoost) to handle positive-class sparsity.
- **Threshold Optimization**: Select an optimal clinical decision boundary ($\text{threshold} = 0.15$) prioritizing high sensitivity/recall ($78.00\%$) for stroke screening.
- **Explainable AI (XAI)**: Integrate exact `TreeSHAP` probability attributions mapped back to human-readable clinical variables with a fail-safe sensitivity fallback.
- **Multi-Modal Risk Combination**: Combine clinical diagnostic probabilities ($70\%$) with behavioral keystroke timing measurements ($30\%$).
- **Patient History & Progression**: Maintain non-destructive longitudinal risk records to calculate relative changes and contrast feature shifts over time.
- **AI Decision Support**: Provide a context-aware AI assistant (`GroundedRuleProvider` / `OpenAICompatibleProvider`) that explains server-retrieved data with source citations.
- **Reporting & Analytics**: Generate PDF, Excel (XLSX), CSV, and SMTP email reports alongside interactive model analytics.
- **Production Engineering**: Implement JWT auth with refresh rotation, SQL Server migrations (Alembic), multi-stage### System Architecture & Pipeline Workflow
- **Phase 1–2**: Multi-model clinical ML evaluation & dataset benchmarking (Random Forest vs XGBoost, LightGBM, CatBoost, Logistic Regression).
- **Phase 2A**: Production Random Forest Pipeline (`stroke_model.pkl`) with preprocessing (`ColumnTransformer` + `SimpleImputer` + `StandardScaler`).
- **Phase 3 & 3.1**: Real TreeSHAP explainability (`shap==0.52.0`) with PDF report integration and fallback safety.
- **Phase 4**: Patient History & Longitudinal Risk Progression Tracking.
- **Phase 5**: Model Analytics & Threshold Sensitivity Analysis ($t = 0.15$).
- **Phase 6**: AI Clinical Decision-Support Assistant with non-diagnostic safety guardrails.
- **Phase 7**: Docker containerization, docker-compose, and GitHub Actions CI/CD workflows.
- **Phase 8**: Keystroke Dynamics ML Research Module (Biometric User ID 93.48% Accuracy & Personal Baseline Profiling).
- **Phase 9**: Multimodal Decision Fusion & System Ablation Study ($90/10, 80/20, 70/30, 60/40$ weighting schemes, 8 publication plots, and data compatibility disclosures).
- **Phase 10**: Research Validation, Model Calibration (Brier Score Analysis), Clinical Subgroup Error Analysis, and Paper-Ready Case Studies.
- **Phase 11**: Production Hardening, Security Audit, Local Performance Benchmarking, Demonstration Seed Scripting, and Viva Presentation Readiness.
---

## 4. Key Features

### Machine Learning & Risk Screening
- **Random Forest Production Model**: Scikit-learn `Pipeline` encapsulating numerical/categorical imputation, standard scaling, and class-weighted Random Forest classification.
- **Probability Thresholding**: Custom 0.15 decision threshold optimized for high screening recall ($78.00\%$).
- **Keystroke Behavioral Integration**: Evaluates timing metrics (`key`, `H`, `UD`, `DD`) to compute a behavioral risk factor.

### Explainable AI (XAI)
- **TreeSHAP Attributions**: Computes feature-level probability contributions ($\text{predicted\_probability} = \text{base\_value} + \sum \text{SHAP\_contributions}$).
- **Approximate Sensitivity Fallback**: Guaranteed fallback explanation mechanism ensuring zero runtime API crashes if SHAP is dynamically unavailable.

### Longitudinal Patient Management
- **Non-Destructive Patient Profiles**: Preserves repeated patient encounters without overwriting historical records.
- **Risk Progression Charts**: Visualizes chronological probability trends alongside delta changes and SHAP contrast analysis.
- **Timeline & Audit Logging**: Tracks clinical modifications, physician notes, and export activities.

### Clinical Decision-Support AI Assistant
- **Context-Grounded Engine**: Server-authoritative data retrieval ensures 0% hallucination risk by default (`GroundedRuleProvider`).
- **Safety Guardrails**: Strict instructions refusing independent medical diagnoses, prescription advice, or emergency triage.
- **Citation Badges**: Displays source attribution tags (`Latest Prediction`, `Patient History`, `SHAP Explanation`, `Doctor Notes`, `Model Analytics`).

### Security & Production Infrastructure
- **Authentication**: JWT access tokens with refresh token rotation and server-side role authorization (`Admin`, `Doctor`).
- **Containerization**: Multi-stage Dockerfiles (`python:3.12-slim` backend + `nginx:1.27-alpine` frontend) orchestrated via `docker-compose.yml`.
- **CI/CD**: GitHub Actions workflow running unit tests and production builds automatically.

---

## 5. How the System Works

```
                        +---------------------------+
                        |   User / Clinician Web    |
                        +-------------+-------------+
                                      |
                                      v
                        +-------------+-------------+
                        |  React 19 + Vite Frontend |
                        +-------------+-------------+
                                      |
                                (HTTP / REST)
                                      v
                        +-------------+-------------+
                        |  FastAPI Backend (Py3.12) |
                        +-------------+-------------+
                                      |
                      +---------------+---------------+
                      |                               |
                      v                               v
           +----------+----------+         +----------+----------+
           | Auth & Role Control |         | ML Risk Service     |
           | (JWT + SQL Server)  |         | (scikit-learn + SHAP)|
           +---------------------+         +----------+----------+
                                                      |
                                                      v
                                           +----------+----------+
                                           | Combined Risk       |
                                           | 0.7*Clin + 0.3*Keys |
                                           +----------+----------+
                                                      |
                                                      v
                                           +----------+----------+
                                           | AI Clinical Assistant|
                                           | (Grounded Context)  |
                                           +---------------------+
```

1. **Authentication**: User logs in with email/password to obtain a short-lived JWT access token and refresh token.
2. **Assessment Submission**: Clinician submits patient clinical parameters (`age`, `bmi`, `avg_glucose_level`, `hypertension`, etc.) and optional keystroke parameters.
3. **ML Inference**: Backend executes the production Random Forest Pipeline to generate $P_{\text{clinical}}$, calculates $P_{\text{keystroke}}$, and computes $P_{\text{final}} = 0.7 \times P_{\text{clinical}} + 0.3 \times P_{\text{keystroke}}$.
4. **SHAP Generation**: `TreeSHAP` evaluates feature contributions in probability space.
5. **Persistence**: Prediction record, SHAP values, and timeline activity are persisted to SQL Server via SQLAlchemy.
6. **Visualization & Support**: Frontend displays risk badge, SHAP waterfall/bar charts, historical trends, and allows querying the AI Clinical Assistant.

---

## 6. Complete Prediction Flow

```
1. User enters patient data (Frontend form validation)
2. POST /predict-final/ -> FastAPI Backend (JWT token validated)
3. Input data transformed via Pipeline ColumnTransformer (SimpleImputer + StandardScaler)
4. RandomForestClassifier predicts clinical probability (P_clinical)
5. Keystroke model calculates timing probability (P_keystroke)
6. Final probability calculated: P_final = (0.7 * P_clinical) + (0.3 * P_keystroke)
7. Risk category assigned: Low (<0.30), Medium (0.30-0.50), High (>=0.60)
8. TreeSHAP computes feature attributions relative to base_value (0.0487)
9. Prediction, SHAP factors, doctor notes, and audit log persisted to SQL Server
200 OK returned -> React renders Prediction Details, SHAP charts, and launcher buttons
```

---

## 7. Clinical ML Model Configuration

The production model is encapsulated in a scikit-learn `Pipeline` saved at `Backend/app/ml/stroke_model.pkl`.

```python
Pipeline(steps=[
    ('preprocessor', ColumnTransformer(transformers=[
        ('num', Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())
        ]), ['age', 'avg_glucose_level', 'bmi']),
        ('cat', Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='most_frequent'))
        ]), ['gender', 'hypertension', 'heart_disease', 'ever_married', 'work_type', 'Residence_type', 'smoking_status'])
    ])),
    ('classifier', RandomForestClassifier(
        n_estimators=100,
        class_weight='balanced',
        random_state=42
    ))
])
```

- **Numerical Features**: `age`, `avg_glucose_level`, `bmi` (Imputation: Median, Scaling: StandardScaler).
- **Categorical / Binary Features**: `gender`, `hypertension`, `heart_disease`, `ever_married`, `work_type`, `Residence_type`, `smoking_status` (Imputation: Most Frequent).
- **Classifier**: `RandomForestClassifier` with `class_weight='balanced'` and `random_state=42`.

---

## 8. Datasets

### A. Healthcare Stroke Dataset (Primary Training & Test)
- **Source**: `healthcare-dataset-stroke-data.csv`
- **Total Records**: `5,110` rows, `12` columns
- **Positive Stroke Cases**: `249` rows (`4.87%` prevalence - severe class imbalance)
- **Train / Test Split**: 80% Train (`4,088` rows), 20% Untouched Test (`1,022` rows, stratified split)

### B. Experimental Synthetic Dataset Findings (C3 Experiments)
- Synthetic stroke cases generated via SMOTE / CTGAN were evaluated across ratios (1:1, 2:1, 4:1).
- **Finding**: While synthetic data artificially inflated training metrics, it **did not improve performance on the untouched real test set** and increased false positives. The project retained the real-data trained model (C1: Real Only).

### C. Secondary Clinical Dataset Analysis (C2 Experiments)
- Evaluated `stroke_risk_dataset.csv` (`70,000` rows, acute cardiorespiratory symptoms target).
- **Finding**: Found to be **incompatible** due to disjoint feature spaces (acute symptoms vs. chronic demographic factors) and non-equivalent target definitions (`At Risk` vs. true `Stroke`). Merging datasets was rejected to maintain scientific integrity.

---

## 9. Machine Learning Experiments

Five algorithms were evaluated using 5-Fold Stratified Cross-Validation on the Healthcare Stroke Dataset:

| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC | PR-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Random Forest** | 0.9384 ± 0.0091 | 0.2457 ± 0.1927 | 0.1003 ± 0.0650 | 0.1398 ± 0.0935 | 0.8319 ± 0.0092 | 0.1756 ± 0.0469 |
| **Logistic Regression** | 0.7365 ± 0.0124 | 0.1307 ± 0.0082 | 0.7788 ± 0.0248 | 0.2238 ± 0.0129 | **0.8388 ± 0.0143** | 0.1771 ± 0.0364 |
| **XGBoost** | 0.9242 ± 0.0064 | 0.1924 ± 0.0633 | 0.1758 ± 0.0649 | 0.1830 ± 0.0640 | 0.8088 ± 0.0212 | 0.1669 ± 0.0483 |
| **LightGBM** | 0.9100 ± 0.0084 | 0.1667 ± 0.0483 | 0.2059 ± 0.0424 | 0.1837 ± 0.0456 | 0.8265 ± 0.0211 | **0.1845 ± 0.0435** |
| **CatBoost** | 0.8862 ± 0.0080 | 0.1512 ± 0.0398 | 0.2912 ± 0.0807 | 0.1987 ± 0.0533 | 0.8053 ± 0.0228 | 0.1730 ± 0.0465 |

---

## 10. Final Model Results

Evaluated exactly once on the **untouched real test set** (`1,022` samples) using candidate Random Forest at decision threshold `0.15`:

| Metric | Score | Clinical Interpretation |
| :--- | :---: | :--- |
| **Accuracy** | `0.7847` | Overall proportion of correct classifications |
| **Precision** | `0.1573` | True positives among positive classifications (trade-off for high recall) |
| **Recall (Sensitivity)** | **`0.7800`** | Captures **78.00%** of actual stroke cases in screening |
| **F1-Score** | `0.2617` | Harmonic mean of precision and recall |
| **ROC-AUC** | **`0.7979`** | Discrimination capability across all operational cutoffs |
| **PR-AUC** | `0.1768` | Precision-Recall area under curve for minority class |

### Test Set Confusion Matrix (Threshold = 0.15)
```
                  Predicted Negative    Predicted Positive
Actual Negative       763 (TN)              209 (FP)
Actual Positive        11 (FN)               39 (TP)
```

---

## 11. Why Threshold = 0.15

In clinical stroke screening, **False Negatives (FN) carry far higher clinical cost than False Positives (FP)**. Missing an at-risk stroke patient can delay life-saving preventive care, whereas a false positive leads to secondary, low-risk non-invasive evaluation.

Out-of-fold threshold tuning on the Random Forest model:

| Threshold | Precision | Recall | F1-Score | True Positives (TP) | False Negatives (FN) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| 0.50 | 0.2151 | 0.1005 | 0.1370 | 20 | 179 |
| 0.30 | 0.1678 | 0.3668 | 0.2303 | 73 | 126 |
| **0.15** | **0.1460** | **0.7638** | **0.2452** | **152** | **47** |
| 0.10 | 0.1264 | 0.8543 | 0.2202 | 170 | 29 |

**Selected Threshold**: `0.15` balances high screening recall ($78.00\%$) while suppressing excessive false positives compared to lower operational cutoffs.

---

## 12. Combined Risk Calculation

PreStrokeNet combines clinical ML probabilities with behavioral keystroke timing factors:

$$\text{final\_probability} = 0.7 \times \text{clinical\_probability} + 0.3 \times \text{keystroke\_probability}$$

### Risk Categorization Bands
- **Low Risk**: $\text{final\_probability} < 0.30$
- **Medium Risk**: $0.30 \le \text{final\_probability} < 0.60$
- **High Risk**: $\text{final\_probability} \ge 0.60$

> [!NOTE]
> The **clinical model decision boundary (0.15)** determines whether the clinical model flags positive risk, while the **application combined risk bands (0.30 / 0.60)** categorize overall combined patient risk in the workspace UI.

---

## 13. SHAP Explainability

TreeSHAP (`shap.TreeExplainer`) extracts feature attributions directly from the production Pipeline's underlying `RandomForestClassifier` in probability space:

$$\text{predicted\_probability} = \text{base\_value} + \sum_{i=1}^{M} \text{SHAP\_contribution}_i$$

- **Base Value**: $\approx 0.0487$ (mean dataset prevalence).
- **Positive Contribution**: Feature value increases risk score relative to baseline (e.g. `age = 78` adds `+0.32`).
- **Negative Contribution**: Feature value reduces risk score relative to baseline (e.g. `hypertension = 0` subtracts `-0.08`).

```
Raw Clinical Input -> ColumnTransformer Preprocessor -> TreeSHAP Explainer -> Probability Attributions -> Visual Waterfall / Bar Chart
```

### Fail-Safe Fallback Strategy (`approximate_sensitivity`)
If the `shap` library is dynamically unavailable, the service automatically executes bounded feature sensitivity analysis to preserve API uptime and return descriptive model attributions with clear fallback tagging.

---

## 14. Patient History & Risk Progression

PreStrokeNet preserves all historical assessments per patient identity (`patient_id`):
- **Longitudinal Trend Chart**: Plots chronological changes in $P_{\text{clinical}}$, $P_{\text{keystroke}}$, and $P_{\text{final}}$.
- **Delta Percentage Points**: Calculates relative change ($\Delta P = P_{\text{current}} - P_{\text{previous}}$).
- **SHAP Contrast Analysis**: Compares feature contribution shifts between historical encounters.
- **Activity Feed**: Records modifications, notes updates, and PDF download audits.

---

## 15. Model Analytics

The `/model-analytics` page provides interactive clinical decision evaluation:
- **Production Performance Cards**: Displays Accuracy, Precision, Recall, F1, ROC-AUC, and PR-AUC.
- **Interactive Confusion Matrix**: Renders TN, FP, FN, TP breakdowns.
- **Interactive Curves**: Visualizes ROC and Precision-Recall trade-off curves across thresholds.
- **Feature Importance**: Displays Gini feature importance rankings from the Random Forest model.

---

## 16. AI Clinical Decision-Support Assistant

Phase 6 introduced an AI decision-support workspace accessible via `/clinical-assistant`:
- **Provider Abstraction** (`BaseAIProvider`): Supported providers include `GroundedRuleProvider` (default built-in data-grounded engine with 0% hallucination risk) and `OpenAICompatibleProvider` (OpenAI, Gemini, Ollama via standard base URLs).
- **Server-Authoritative Context**: Backend fetches patient history, predictions, SHAP factors, doctor notes, and model analytics directly from SQL Server. Client-supplied probabilities are ignored.
- **Source Citation Tags**: Responses append verifiable badges (`Latest Prediction`, `Patient History`, `SHAP Explanation`, `Doctor Notes`, `Model Analytics`).

---

## 17. AI Safety & Non-Diagnostic Framing

1. **Non-Diagnostic Constraint**: Refuses independent medical diagnoses and redirects users to licensed physicians.
2. **Emergency Redirection**: Immediately provides emergency protocols if acute stroke symptoms or urgent medication requests are detected.
3. **Attribution vs. Causation**: Formats feature contributions strictly as statistical model risk score attributions rather than biological cause-and-effect.
4. **Missing Data Handling**: Explicitly states when patient parameters or historical visits are unrecorded.

---

## 18. Reporting System

PreStrokeNet generates export reports containing patient metadata, predictions, SHAP factors, and physician notes:
- **PDF Report**: Formatted clinical report with header branding, risk badge, and SHAP table (`/reports/{id}/pdf`).
- **Excel Report**: Multi-sheet workbook (`/reports/{id}/excel` and `/reports/export.xlsx`).
- **CSV Export**: Filtered assessment records export (`/reports/export.csv`).
- **SMTP Email**: Delivers PDF reports directly to physician email inboxes (`/reports/{id}/email`).

---

## 19. Authentication & Authorization

- **Authentication**: Email and password login using bcrypt hashing. Returns JWT access token (30-min expiry) and refresh token (14-day expiry with rotation).
- **Role-Based Access Control (RBAC)**: Enforces `Admin` and `Doctor` permissions on sensitive clinical endpoints (`/patients/{id}/history`, `/clinical-assistant/chat`, `/model-analytics`).
- **Token Revocation**: Logout revokes refresh tokens server-side.

---

## 20. Database Architecture & Migrations

Built on **SQL Server** using SQLAlchemy ORM and Alembic schema migrations:

### Core Tables
- `users`: User identity, password hash, role (`Admin`, `Doctor`), status.
- `predictions`: Clinical inputs, keystroke inputs, calculated probabilities, risk category, doctor notes, timestamps.
- `refresh_tokens`: Revocable refresh token hashes with replacement tracking (`ON DELETE NO ACTION`).
- `prediction_activity`: Audit log of edits, notes, and report downloads.

---

## 21. API Reference

| Method | Endpoint | Description | Auth Required | Roles Allowed |
| :--- | :--- | :--- | :---: | :---: |
| `POST` | `/auth/register` | Register new clinician user | No | All |
| `POST` | `/auth/login` | Authenticate user and issue JWT pair | No | All |
| `POST` | `/auth/refresh` | Rotate refresh token and issue new access token | No | All |
| `POST` | `/predict-final/` | Create combined clinical & keystroke prediction | Yes | Admin, Doctor |
| `GET` | `/predictions/search` | Server-side filtered & paginated search | Yes | Admin, Doctor |
| `GET` | `/predictions/{id}` | Detailed prediction record with SHAP explanation | Yes | Admin, Doctor |
| `GET` | `/patients/{id}/history` | Patient historical assessments list | Yes | Admin, Doctor |
| `GET` | `/patients/{id}/risk-progression` | Chronological risk trends & SHAP contrast | Yes | Admin, Doctor |
| `GET` | `/model-analytics/` | Production metrics, CM, and ROC/PR curves | Yes | Admin, Doctor |
| `POST` | `/clinical-assistant/chat` | Context-grounded AI decision support chat | Yes | Admin, Doctor |
| `GET` | `/health` | Application health monitoring endpoint | No | All |

---

## 22. Frontend Architecture & Pages

Built with **React 19**, **TypeScript 5.7**, **Vite 8.2**, and **Tailwind CSS**:
- `/login`: Authenticated sign-in portal.
- `/dashboard`: High-level statistics, recent activity, and risk distributions.
- `/prediction`: Form for entering clinical inputs and capturing keystroke dynamics.
- `/predictions/:id`: Prediction detail view, SHAP waterfall chart, doctor notes editor.
- `/patients/:patient_id`: Patient profile, history progression timeline, SHAP contrast.
- `/model-analytics`: Model performance metrics, confusion matrix, ROC/PR curves.
- `/clinical-assistant`: AI Assistant workspace with context summary panel and chat.
- `/reports`: Assessment report management and batch exports.

---

## 23. Project Directory Tree

```
PreStrokeNet/
├── Backend/
│   ├── app/
│   │   ├── api/                # FastAPI routers (auth, predictions, assistant, etc.)
│   │   ├── core/               # App configuration, security, CORS
│   │   ├── db/                 # Database session and base models
│   │   ├── ml/                 # Production stroke_model.pkl & loader
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   └── services/           # ML, SHAP, Assistant, and DB services
│   ├── alembic/                # Database migration versions
│   ├── tests/                  # Backend unit & integration tests
│   ├── Dockerfile             # Production Backend container definition
│   └── requirements.txt        # Python dependency specifications
├── Frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components (Buttons, Badges, Header)
│   │   ├── pages/              # React page views (Dashboard, Assistant, Analytics)
│   │   ├── routes/             # Protected React AppRoutes
│   │   ├── services/           # Axios API client modules
│   │   └── types/              # TypeScript interface definitions
│   ├── Dockerfile             # Multi-stage Frontend container definition
│   ├── nginx.conf              # Production Nginx SPA configuration
│   └── package.json            # Node.js dependencies
├── ML/
│   ├── evaluation/             # Model comparison CSVs, plots, and analysis reports
│   └── saved_models/           # Trained model artifacts
├── Datasets/                   # Healthcare stroke dataset CSVs
├── .github/workflows/ci.yml    # GitHub Actions CI/CD pipeline
├── docker-compose.yml          # Container orchestration specification
├── .env.example                # Environment variable configuration template
├── DEPLOYMENT.md               # Detailed deployment and runbook manual
└── README.md                   # Master project documentation
```

---

## 24. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind | Responsive SPA user interface |
| **Backend** | Python 3.12, FastAPI, Uvicorn | RESTful microservice API backend |
| **Machine Learning** | Scikit-learn 1.5.2, Pandas, NumPy | Production Random Forest Pipeline |
| **Explainable AI** | SHAP 0.52.0 (TreeSHAP) | Probability-space feature attributions |
| **Database** | SQL Server, SQLAlchemy, Alembic | Relational storage and schema migrations |
| **Authentication** | PyJWT, Passlib (bcrypt) | Secure JWT auth with refresh rotation |
| **Reporting** | ReportLab, OpenPyXL | PDF, Excel, CSV report generation |
| **AI Assistant** | Custom Provider Abstraction | Context-grounded decision support |
| **Containerization** | Docker, Nginx Alpine | Multi-stage production container images |
| **CI/CD** | GitHub Actions | Automated testing and build pipeline |

---

## 25. Installation & Local Setup

### Prerequisites
- Python 3.12+
- Node.js 22+
- Microsoft SQL Server (Local, Express, or Docker instance)
- ODBC Driver 18 for SQL Server

### 1. Environment Setup
```powershell
cp .env.example .env
```

### 2. Backend Setup
```powershell
cd Backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m alembic upgrade head
```

### 3. Frontend Setup
```powershell
cd Frontend
npm install
```

---

## 26. Environment Variables

Documented in [.env.example](file:///c:/Users/navee/PreStrokeNet/.env.example):
- `DATABASE_URL`: SQL Server connection string.
- `SECRET_KEY`: JWT signing secret key.
- `CORS_ORIGINS`: Allowed origins (`http://localhost:5173,http://localhost:80`).
- `AI_PROVIDER`: `grounded` (default) or `openai` / `gemini` / `ollama`.
- `AI_API_KEY`: External LLM API key (kept strictly server-side).

---

## 27. Running the Application

### Development Mode

#### Backend Server:
```powershell
cd Backend
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### Frontend Server:
```powershell
cd Frontend
npm run dev
```

Access the frontend application at `http://localhost:5173` and backend API documentation at `http://localhost:8000/docs`.

---

## 28. Docker Deployment

Deploy the entire stack with Docker Compose:

```powershell
docker compose up --build -d
```

Verify service status:
```powershell
docker compose ps
```

Refer to [DEPLOYMENT.md](file:///c:/Users/navee/PreStrokeNet/DEPLOYMENT.md) for full containerization manuals, migration runbooks, and rollback procedures.

---

## 29. CI/CD Pipeline

The repository uses GitHub Actions defined in [.github/workflows/ci.yml](file:///c:/Users/navee/PreStrokeNet/.github/workflows/ci.yml):
- **Backend Job**: Installs Python 3.12 + ODBC dependencies, executes `python -m unittest discover -s Backend/tests -v`, and verifies code compilation.
- **Frontend Job**: Installs Node 22 dependencies and executes `npm --prefix Frontend run build`.

---

## 30. Testing & Validation Status

- **Backend Unit Tests**: **16 Passed, 1 Skipped** (`OK (skipped=1)`).
- **Frontend Production Build**: **PASS** (`tsc -b && vite build` completed in 854ms).
- **End-to-End QA Script**: **15/15 PASS** (Auth, Predictions, SHAP, Patient History, Reports, Model Analytics, AI Assistant, Health Check).

---

## 31. Security Audit

- **Zero Hardcoded Secrets**: All keys, passwords, and tokens managed via `.env`.
- **Server-Side Authorization**: Endpoints protected via `require_roles("Admin", "Doctor")`.
- **CORS Protection**: Restricted allowed origins without wildcard `*` fallback.
- **Refresh Token Rotation**: Revocable refresh token hashes stored securely.

---

## 32. Limitations & Known Trade-Offs

- **Screening Threshold Trade-Off**: The selected cutoff ($\text{threshold} = 0.15$) yields high recall ($78.00\%$) but lower precision ($15.73\%$), resulting in false positives intended for low-risk secondary clinical evaluation.
- **Dataset Size**: Trained on `5,110` records; larger multi-center clinical cohorts are recommended for prospective deployment.
- **Disjoint Secondary Datasets**: Merging acute symptom datasets was found to be statistically invalid due to disjoint feature definitions.

---

## 33. Future Work

- **Prospective Clinical Validation**: Evaluate model performance in multi-center live healthcare settings.
- **Expanded Keystroke Modeling**: Incorporate complex motor latency and typing rhythm metrics.
- **Advanced Model Calibration**: Implement Platt scaling / Isotonic regression to further calibrate output probabilities.

---

## 34. Advanced Intelligence, Clinical Workflow, Patient 360°, Real-Time UX & Premium UI (Phases 15–20.7)

- **Comprehensive Visual Consistency & Presentation Polish**: Complete visual alignment pass across all 13 primary pages (Login, Register, Dashboard, Patient List, Patient 360, New Prediction, Prediction Details, Model Analytics, AI Assistant, Work Queue, Notifications, Audit Log, Patient Comparison, Demo Mode), standardizing typography, spacing, card hierarchies, button states, risk badges (`LOW`, `MEDIUM`, `HIGH`), table layouts, Skeleton loaders, empty states, ErrorState views, responsive layouts, accessibility compliance, and viva presentation readiness.
- **Clinician Work Queue & Operational Task Workspace**: Priority-grouped task cards (`HIGH`, `MEDIUM`, `LOW`), KPI summary cards (`Total Requiring Review`, `High Priority`, `Medium Priority`, `Unresolved Alerts`), priority & status filters, debounced search, and direct action triggers (`[Patient 360]`, `[Prediction]`, `[Ask AI]`).
- **Real AI Provider Integration Verification**: Runtime environment variable loading verification (`AI_PROVIDER=openai`, `AI_MODEL=gpt-4o-mini`), runtime provider instantiation (`OpenAICompatibleProvider`), health check endpoint validation (`GET /clinical-assistant/health` returning `status: "configured"` and mode `external_llm`), and verified HTTPS connection routing to OpenAI API without silent fallback.
- **Explicit AI Provider Architecture & Health Verification**: Explicit provider selection (`grounded`, `openai`, `gemini`, `ollama`), truthful health status verification (`GET /clinical-assistant/health`), strict elimination of silent fallback, explicit HTTP 400/502 error reporting on external API failure or missing keys, refined question routing in `GroundedRuleProvider`, dynamic held-out research metrics context, and clear provider status badges (`Built-in Grounded Rule Engine` vs `External LLM — OpenAI`) on the frontend.
- **AI Clinical Decision-Support Assistant Workspace**: Evidence-grounded decision-support workspace featuring Active Patient Context panel, context checklist, suggested query chips, chat conversation workspace with evidence cards, source citation pills (`Latest Prediction`, `Patient History`, `SHAP Explanation`, `Doctor Notes`, `Model Analytics`), persistent non-diagnostic safety notice, and structured emergency redirection cards.
- **Prediction Details & Explainability Workspace**: Polished assessment review workspace communicating the technical pipeline ($Input \rightarrow RF \rightarrow P_{\text{clin}} + Keystroke \rightarrow 70/30 \rightarrow P_{\text{final}} \rightarrow SHAP$), Current Risk Hero card, TreeSHAP attributions breakdown ("Why This Score?"), mathematical base value reconstruction ($P_{\text{base}} + \sum \text{SHAP} \approx P_{\text{clinical}}$), structured clinical inputs (Age in years, Glucose in mg/dL, BMI in kg/m²), keystroke motor latencies ($H, UD, DD$ in ms), held-out research evaluation metrics (ROC-AUC 0.8801, PR-AUC 0.4298, Recall 0.8810, F1 0.2803, Brier 0.0373, Cutoff 0.15), clinician notes editor, audit timeline log, and multi-format report exports (`PDF`, `CSV`, `Excel`, `Email`, `Print`).
- **Flagship Patient 360° Intelligence Workspace**: Flagship clinical screen bringing together demographics, Current Risk Hero card ($P_{\text{clinical}}$, $P_{\text{keystroke}}$, Combined Final $0.7 \times P_{\text{clin}} + 0.3 \times P_{\text{key}}$), Patient Scorecard, Risk Progression trend & slope, TreeSHAP attributions ("Why This Score?"), keystroke motor timing profile ($H, UD, DD$), Risk Change delta, Interactive Workflow Stepper (`NEW` $\rightarrow$ `IN_REVIEW` $\rightarrow$ `REVIEWED` $\rightarrow$ `FOLLOW_UP` $\rightarrow$ `RESOLVED`), follow-up reminders modal, event timeline, AI Assistant launcher, and PDF/CSV report downloads.
- **Doctor Dashboard Command Center**: Priority-ordered workspace placing Patients Requiring Attention at top priority, followed by cohort risk distribution, longitudinal shift transitions, filterable assessments workspace, top KPIs, and live service infrastructure health.
- **Premium Clinical UI/UX Design System**: Unified design tokens, structured category navigation, Skeleton loading suite (`SkeletonCard`, `SkeletonTable`, `SkeletonChart`, `SkeletonProfile`), clinical form units (`years`, `kg/m²`, `mg/dL`, `ms`), and non-diagnostic ARIA accessibility.
- **Real-Time Polling Transport**: Auto-updating live Work Queue indicators, unread notification counts, and active patient badges via lightweight 10-second polling.
- **Global Search Engine**: Debounced search (`GET /search/global`) searching patient names, patient IDs, predictions, notifications, and follow-ups.
- **Guided Academic Demo Mode**: Dedicated `/demo` route page providing a step-by-step clinical walkthrough with synthetic data badged with **"DEMONSTRATION MODE"**.
- **Automated Post-Assessment Pipeline**: Seamless automated execution linking prediction persistence $\rightarrow$ SHAP explanation $\rightarrow$ risk change analysis $\rightarrow$ event engine $\rightarrow$ idempotent notifications $\rightarrow$ clinician work queue.
- **Unified Monitoring Summary API**: Single endpoint (`GET /patients/{id}/360` & `GET /patients/{id}/monitoring-summary`) aggregating complete patient records.
- **Patient Risk Forecasting**: Longitudinal model-risk trend analysis ($m$ slope per 30 days) for multi-assessment patients.
- **Data Quality Checker**: Pre-prediction clinical validation evaluating physical and reference range bounds (`VALID`, `WARNING`, `INVALID`).
- **Patient Comparison**: Side-by-side comparative workspace (`/patient-comparison`) analyzing risk outputs and TreeSHAP attribution shifts ($\Delta$).
- **Advanced SHAP "Why This Risk?" View**: Mathematical reconstruction ($\text{Base Value} + \sum \text{SHAP} \approx P_{\text{clinical}}$) categorizing risk-increasing vs risk-decreasing factors.
- **Assessment Reminders & Action Tracking**: Clinician follow-up schedule and traceable audit logging (`/audit-log`).
- **Saved Patient Lists**: User-isolated "My Patients" saved lists.
- **Custom Report Exports**: Custom section-selection PDF reports and multi-format patient summary exports (`PDF`, `CSV`, `Excel`).

---

## 35. Research & Engineering Contributions

1. **Integrated Multi-Modal Risk Framework**: Combines clinical demographic/diagnostic ML ($70\%$) with behavioral keystroke timing ($30\%$).
2. **Probability-Space TreeSHAP**: Direct additive attributions explaining Random Forest predictions transparently.
3. **Longitudinal Risk Tracking**: Preserves non-destructive historical assessments for delta percentage and SHAP contrast analysis.
4. **Grounded AI Decision Support**: Server-authoritative context retrieval preventing hallucination.
5. **Production Engineering**: Multi-stage Docker containerization, CI/CD pipeline, SQL Server migrations, and end-to-end full repository audit ([docs/FULL_REPOSITORY_AUDIT_REPORT.md](file:///c:/Users/navee/PreStrokeNet/docs/FULL_REPOSITORY_AUDIT_REPORT.md)).

---

## 36. Disclaimer

> [!IMPORTANT]
> **PreStrokeNet is an academic research and software engineering project. Model predictions represent estimated risk scores and DO NOT constitute medical diagnoses or clinical prescriptions. PreStrokeNet MUST NOT replace professional medical evaluation or emergency care.**
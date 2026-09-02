# Phase 13 — Clinical Alert & Notification System

This document describes the design, database schema, alert generation rules, security features, API specifications, and UI components of PreStrokeNet's **Clinical Alert & Notification System**.

---

## 1. Overview & Non-Diagnostic Clinical Safety

The **Clinical Alert & Notification System** provides real-time, non-diagnostic decision-support alerts for clinicians (Doctors and Admins) whenever significant model-assessed risk changes or clinical events occur.

```
PREDICTION CREATED
        │
        ├───────────────► Persist Prediction & Record Activity
        │
        ▼
generate_alerts_for_prediction()
        │
        ├── Risk category changed? ────► "Model-assessed risk category changed" (Warning/Info)
        ├── High model risk? ──────────► "High model-assessed risk" (Warning)
        ├── Prob shift ≥ 0.10? ────────► "Significant model risk change" (Info)
        └── Behavioral shift ≥ 20%? ───► "Behavioral shift detected" (Info)
        │
        ▼
NOTIFICATION SERVICE (Duplicate Prevention & Optional SMTP Email)
        │
        ├── DB Notification (notifications table)
        └── Optional SMTP Email (NOTIFICATIONS_EMAIL_ENABLED=false)
```

### Safety & Medical Framing Rules

- 🟢 **Allowed**: *"High model-assessed risk"*, *"Risk category changed"*, *"Model probability shifted"*, *"Behavioral metric change detected"*.
- 🔴 **Forbidden**: Claiming stroke diagnosis, recommending automatic treatment, or implying emergency clinical outcomes without diagnostic validation.

---

## 2. Database Schema (`notifications`)

Implemented via Alembic migration `20260901_180000_create_notifications.py`:

| Column Name | Data Type | Constraint | Description |
| :--- | :--- | :--- | :--- |
| `id` | INTEGER | PRIMARY KEY | Auto-increment primary key |
| `user_id` | INTEGER | FOREIGN KEY (`users.id`) | Recipient clinician user ID |
| `patient_id` | VARCHAR(100) | INDEX | Patient code string |
| `prediction_id` | INTEGER | FOREIGN KEY (`predictions.id`) | Prediction assessment ID |
| `type` | VARCHAR(50) | INDEX | Alert type (`risk_category_changed`, `high_risk_assessment`, `behavioral_shift`, `significant_risk_change`) |
| `severity` | VARCHAR(20) | DEFAULT 'info' | Severity tier (`info`, `warning`, `high`) |
| `title` | VARCHAR(255) | NOT NULL | Alert header title |
| `message` | TEXT | NOT NULL | Non-diagnostic narrative body |
| `is_read` | BIT / BOOLEAN | INDEX | Read status flag |
| `created_at` | DATETIMEOFFSET | INDEX | Creation timestamp (UTC) |
| `read_at` | DATETIMEOFFSET | NULLABLE | Timestamp when read |

---

## 3. Dedicated API Endpoints

| Method | Route | Description | Auth / Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/notifications` | Get list of notifications for authenticated user | OAuth2 Bearer (`Admin`, `Doctor`) |
| `GET` | `/notifications/unread-count` | Get total count of unread notifications | OAuth2 Bearer (`Admin`, `Doctor`) |
| `PATCH` | `/notifications/{id}/read` | Mark single notification as read | OAuth2 Bearer (`Admin`, `Doctor`) |
| `PATCH` | `/notifications/read-all` | Mark all notifications for user as read | OAuth2 Bearer (`Admin`, `Doctor`) |

---

## 4. Frontend Component Architecture

- **`NotificationCenter.tsx`**: Header bell dropdown with unread badge badge counter, preview feed, quick actions, and mark read buttons.
- **`Notifications.tsx`**: Full workspace page at `/notifications` featuring tab filtering (All, Unread, Read), severity filters, and direct navigation links to patient profiles and prediction details.

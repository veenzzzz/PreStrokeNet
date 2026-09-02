# PreStrokeNet Backend

FastAPI API for PreStrokeNet. SQL Server is the development/production database and Alembic is the source of truth for schema changes.

## Database setup

1. Copy `.env.example` to `.env` and configure `DB_SERVER`, `DB_DATABASE`, and `DB_DRIVER`.
2. Install dependencies:

   ```powershell
   pip install -r requirements.txt
   ```

3. For a new database, run migrations from the `Backend` directory:

   ```powershell
   alembic upgrade head
   ```

4. For an existing database created by the legacy `create_tables.py` script, inspect the schema and migration state before stamping. The prediction baseline migration is additive and skips creating `predictions` when that table already exists:

   ```powershell
   alembic current
   alembic history
   alembic upgrade head
   ```

The current migration head adds prediction report metadata, user roles, refresh tokens, and activity fields. Do not use `Base.metadata.create_all()` against shared environments and do not downgrade shared SQL Server data as part of verification.

### SQL Server foreign-key behavior

The refresh-token table intentionally uses `ON DELETE NO ACTION` for both `user_id` and the self-referencing `replaced_by_id` foreign keys. SQL Server rejects self-referencing cascading actions with error 1785 because they can create cycles or multiple cascade paths. The auth service clears replacement links and deletes a user's refresh rows before user deletion, preserving cleanup without relying on unsupported database cascades. Existing migration foreign keys were audited; the refresh-token self-reference was the only failing path in the new migration.

## API groups

- `/auth` and `/profile`: authentication, JWT expiry/refresh rotation, logout, role-aware profile hydration.
- `/predict-final/`: authenticated combined clinical/keystroke prediction persistence. `patient_name` is required and `patient_id` remains optional without changing the ML feature contract. Multiple predictions are allowed for the same `patient_id` to build historical progression.
- `/predictions/search`: server-side search, composed filters, sorting, and pagination.
- `/predictions/{id}`: detail, edit/recalculate, doctor notes, and delete.
- `/patients/{patient_id}/history`: list of all historical assessments for a patient sorted by date descending. Requiring `Admin` or `Doctor` roles.
- `/patients/{patient_id}/risk-progression`: chronological trend points of clinical, keystroke, and final probabilities alongside absolute change and SHAP contrast. Requiring `Admin` or `Doctor` roles.
- `/patients/{patient_id}/timeline`: activity feed of clinical prediction modifications, notes, and downloads for a patient. Requiring `Admin` or `Doctor` roles.
- `/dashboard/statistics` and `/dashboard/activity`: SQL Server-backed dashboard analytics and audit activity.
- `/reports/{id}/pdf`, `/reports/{id}/excel`, `/reports/export.xlsx`, `/reports/export.csv`: professional report downloads and filtered exports.
- `/reports/{id}/email`: SMTP-backed PDF report delivery with doctor metadata.
- `/clinical-assistant/chat`: authenticated context-grounded AI decision-support chat. Requires `Admin` or `Doctor` roles. Retrieves authoritative database predictions, SHAP factors, history trends, doctor notes, and model analytics directly.
- `/clinical-assistant/health`: health status check for active AI provider engine.

Explainability uses an optional SHAP strategy when a compatible estimator and package are available. The default fallback is `approximate_sensitivity`: each stored feature is compared with a bounded reference profile, absolute local sensitivity is normalized into percentage contributions, and the response labels the method and clinical-support disclaimer. These contributions are descriptive model-local associations, not causal effects or diagnoses.

## AI Assistant Configuration

The clinical assistant uses a pluggable provider abstraction (`AI_PROVIDER`):
- `grounded` (default): built-in rule and data-grounded clinical decision-support engine. Works out of the box with zero external API keys and 0% risk of hallucination.
- `openai` / `gemini` / `ollama`: connects to external LLM provider endpoints when configured.

### Environment variables

- `AI_PROVIDER`: `grounded`, `openai`, `gemini`, `ollama` (default: `grounded`)
- `AI_API_KEY`: API key for external provider (never exposed to frontend or client responses)
- `AI_API_BASE`: API base URL (default: `https://api.openai.com/v1`)
- `AI_MODEL`: model name (default: `gpt-4o-mini`)

### Safety guardrails

The assistant enforces non-diagnostic clinical decision support:
1. Refuses independent diagnosis or outcome guarantees.
2. Refuses prescription or emergency treatment requests.
3. Does not fabricate missing medical history or lab values.
4. Frames SHAP factors as model attributions rather than physiological causation.

## Export dependencies

PDF output uses ReportLab and Excel output uses OpenPyXL. Both are pinned in `requirements.txt`. Report generation uses a shared normalized prediction context and does not log credentials or sensitive tokens.

## SMTP configuration

Password reset and report email requests use SMTP when `SMTP_HOST` is configured. In development, leaving `SMTP_HOST` blank keeps password reset links in logs and report email returns a safe configuration error instead of attempting delivery. Configure these values for real delivery:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`
- `SMTP_USE_TLS`
- `SMTP_TEST_RECIPIENT` for the opt-in integration test

The forgot-password API always returns a generic response so registered email addresses cannot be enumerated. Report email failures expose only a safe configuration or delivery message; credentials are never returned.

## SMTP integration test

The integration test makes a real SMTP submission and is skipped unless explicitly enabled:

```powershell
$env:SMTP_INTEGRATION_ENABLED = "true"
$env:SMTP_TEST_RECIPIENT = "your-inbox@example.com"
python -m unittest discover -s tests -v
```

This requires valid SMTP credentials and a reachable SMTP server. Live report-email delivery remains deferred until these values are configured.

## Validation

```powershell
python -m unittest discover -s tests -v
python -m compileall app
alembic current
```

# PreStrokeNet Production Engineering & Deployment Manual

This document contains instructions for local deployment, containerization, environment configuration, database migrations, security, and rollback strategies for PreStrokeNet.

---

## 1. Environment & Secrets Configuration

All configuration is managed via environment variables. Copy `.env.example` to `.env` before running:

```powershell
cp .env.example .env
```

### Environment Variable Specifications

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Application environment (`development` / `production`) | `production` |
| `PORT` | Backend FastAPI server port | `8000` |
| `HOST` | Backend bind host IP address | `0.0.0.0` |
| `DB_SERVER` | SQL Server host / instance name | `localhost` |
| `DB_DATABASE` | Database name | `PreStrokeNet` |
| `DB_DRIVER` | ODBC driver name | `ODBC Driver 18 for SQL Server` |
| `DATABASE_URL` | Optional direct SQLAlchemy connection string | `mssql+pyodbc://...` |
| `SECRET_KEY` | JWT signing secret key (Must be changed in production) | `long-random-secret` |
| `ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token expiration lifetime in minutes | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token expiration lifetime in days | `14` |
| `CORS_ORIGINS` | Comma-separated allowed CORS origins (no wildcard `*`) | `http://localhost,http://localhost:80` |
| `VITE_API_URL` | Frontend build backend API base URL | `http://localhost:8000` |
| `AI_PROVIDER` | AI Assistant provider (`grounded`, `openai`, `gemini`, `ollama`) | `grounded` |
| `AI_API_KEY` | API Key for external LLM provider | `sk-...` |
| `AI_API_BASE` | API Base URL for external provider | `https://api.openai.com/v1` |
| `AI_MODEL` | LLM model identifier | `gpt-4o-mini` |

> [!CAUTION]
> Never commit `.env` files or API secrets into Git repositories. All secret variables are listed in `.gitignore`.

---

## 2. Docker & Container Deployment

### Prerequisites
- Docker Engine 24.0+
- Docker Compose v2.20+

### Container Commands

#### A. Build and start all services
```powershell
docker compose up --build -d
```

#### B. Inspect running container status & health
```powershell
docker compose ps
```

#### C. View application logs
```powershell
docker compose logs -f
```

#### D. Stop containers safely
```powershell
docker compose down
```

---

## 3. Database Setup & Alembic Migrations

Alembic is the authoritative schema migration tool. **Never** execute `Base.metadata.create_all()` against production SQL Server databases or drop tables.

### Run Migrations Against Active Database
```powershell
# From Backend directory:
python -m alembic upgrade head
```

### In-Container Migration Runbook
```powershell
docker compose exec backend python -m alembic upgrade head
```

### Migration Verification
```powershell
docker compose exec backend python -m alembic current
```

---

## 4. Production Health Checks & Smoke Tests

### Backend Health Check
- **Endpoint**: `GET /health`
- **Expected Response**:
  ```json
  {
    "status": "healthy",
    "service": "PreStrokeNet Backend",
    "version": "1.0.0",
    "environment": "production"
  }
```

### Frontend Health Check
- **Endpoint**: `GET /health` (Nginx returns 200 OK)

---

## 5. CI/CD GitHub Actions Workflow

The repository includes a GitHub Actions pipeline at [.github/workflows/ci.yml](file:///c:/Users/navee/PreStrokeNet/.github/workflows/ci.yml):
1. **`backend-tests`**: Sets up Python 3.12, installs ODBC drivers, installs dependencies, executes `python -m unittest discover -s Backend/tests -v`, and verifies code compilation.
2. **`frontend-build`**: Sets up Node 22, installs dependencies, and runs `npm --prefix Frontend run build`.

---

## 6. Backup, Recovery & Rollback Strategy

### A. Database Backup Requirement
Execute full daily backups of the SQL Server database (`PreStrokeNet`). Store backup `.bak` files on isolated persistent storage outside container volumes.

### B. Machine Learning Model Artifact
The production Random Forest model is packaged inside `Backend/app/ml/stroke_model.pkl`. It is version-controlled and immutable during runtime.

### C. Container Rollback Procedure
If a deployment fails, revert to the previous Git commit and restart Docker containers:
```powershell
git checkout <previous-stable-tag-or-sha>
docker compose up --build -d
```

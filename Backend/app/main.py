from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.prediction import router as prediction_router
from app.api.keystroke_prediction import router as keystroke_router
from app.api.final_prediction import router as final_prediction_router
from app.api.prediction_history import router as prediction_history_router
from app.api.dashboard import router as dashboard_router
from app.api.reports import router as reports_router
from app.api.patient_history import router as patient_history_router
from app.api.model_analytics import router as model_analytics_router
from app.api.clinical_assistant import router as clinical_assistant_router
from app.api.clinical_workflow import router as clinical_workflow_router
from app.api.notifications import router as notifications_router
from app.api.patient_intelligence import router as patient_intelligence_router
from app.api.patient_monitoring import router as patient_monitoring_router
from app.core.config import CORS_ORIGINS, ENVIRONMENT

from app.core.database import Base, engine
import app.models

try:
    Base.metadata.create_all(bind=engine)
except Exception as err:
    print(f"Database table initialization warning: {err}")

is_prod = ENVIRONMENT == "production"

app = FastAPI(
    title="PreStrokeNet Backend",
    version="1.0.0",
    docs_url=None if is_prod else "/docs",
    redoc_url=None if is_prod else "/redoc",
    openapi_url=None if is_prod else "/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(prediction_router)
app.include_router(keystroke_router)
app.include_router(final_prediction_router)
app.include_router(prediction_history_router)
app.include_router(dashboard_router)
app.include_router(reports_router)
app.include_router(patient_history_router)
app.include_router(model_analytics_router)
app.include_router(clinical_assistant_router)
app.include_router(notifications_router)
app.include_router(patient_intelligence_router)
app.include_router(clinical_workflow_router)
app.include_router(patient_monitoring_router)

@app.get("/")
def root():
    return {"message": "PreStrokeNet Backend Running"}

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "PreStrokeNet Backend",
        "version": "1.0.0",
        "environment": ENVIRONMENT
    }

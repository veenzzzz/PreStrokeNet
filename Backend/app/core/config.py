import os

from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "14"))
PASSWORD_RESET_EXPIRE_MINUTES = int(os.getenv("PASSWORD_RESET_EXPIRE_MINUTES", "30"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()

DEFAULT_DEV_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
]

env_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "").split(",") if origin.strip()]
if env_origins:
    CORS_ORIGINS = env_origins
else:
    if ENVIRONMENT != "production":
        CORS_ORIGINS = list(dict.fromkeys([FRONTEND_URL] + DEFAULT_DEV_ORIGINS))
    else:
        CORS_ORIGINS = [FRONTEND_URL]

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USERNAME)
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
SMTP_INTEGRATION_ENABLED = os.getenv("SMTP_INTEGRATION_ENABLED", "false").lower() == "true"
SMTP_TEST_RECIPIENT = os.getenv("SMTP_TEST_RECIPIENT", "")
HOSPITAL_NAME = os.getenv("HOSPITAL_NAME", "PreStrokeNet Clinical Intelligence")
HOSPITAL_LOGO_PATH = os.getenv("HOSPITAL_LOGO_PATH", "")

import os
import hashlib
import unittest
from datetime import datetime, timezone
from unittest.mock import patch

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base

from app.models.user import User
from app.models.prediction import Prediction
from app.models.notification import Notification

from app.services.dashboard_service import get_dashboard_summary
from app.services.notification_service import create_notification
from app.services.clinical_assistant_service import generate_assistant_response

from app.schemas.clinical_assistant import ChatRequest


# ============================================================
# TEST DATABASE
# ============================================================
#
# This is ONLY for automated tests.
#
# Production/local application:
#     SQL Server -> PreStrokeNet
#
# Automated tests:
#     SQLite in-memory database
#
# Your real SQL Server data is NOT modified.
# ============================================================

TEST_ENGINE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=TEST_ENGINE,
)


# ============================================================
# FASTAPI TEST CLIENT
# ============================================================

client = TestClient(app)


# ============================================================
# PROJECT DIRECTORIES
# ============================================================

BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)


# ============================================================
# MODEL PATHS
# ============================================================

STROKE_MODEL_PATH = os.path.join(
    BASE_DIR,
    "Backend",
    "app",
    "ml",
    "stroke_model.pkl",
)

if not os.path.exists(STROKE_MODEL_PATH):
    STROKE_MODEL_PATH = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
            "app",
            "ml",
            "stroke_model.pkl",
        )
    )


KEYSTROKE_MODEL_PATH = os.path.join(
    BASE_DIR,
    "Backend",
    "app",
    "ml",
    "keystroke_model.pkl",
)

if not os.path.exists(KEYSTROKE_MODEL_PATH):
    KEYSTROKE_MODEL_PATH = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
            "app",
            "ml",
            "keystroke_model.pkl",
        )
    )


# ============================================================
# EXPECTED PRODUCTION MODEL HASHES
# ============================================================

EXPECTED_STROKE_MODEL_HASH = (
    "43662a6f11725dd0a84903799b38957de3b7e80d5738863c85137d838a7d9bcb"
)

EXPECTED_KEYSTROKE_MODEL_HASH = (
    "8bec474b0bfba04e5537171c18dc8ed9566edf5672ab1f93d4b04d4ffdc9fc71"
)


# ============================================================
# PHASE 20.8 ACCEPTANCE TESTS
# ============================================================

@patch.dict(
    os.environ,
    {
        "AI_PROVIDER": "grounded",
    },
    clear=False,
)
class Phase208FinalAcceptanceTests(unittest.TestCase):

    # --------------------------------------------------------
    # SETUP
    # --------------------------------------------------------

    def setUp(self):
        """
        Create a clean database schema for the test.

        This uses SQLite in-memory instead of the production
        SQL Server connection.
        """

        Base.metadata.create_all(bind=TEST_ENGINE)

        self.db = TestSessionLocal()

        # ----------------------------------------------------
        # Create test doctor
        # ----------------------------------------------------

        self.doctor = (
            self.db.query(User)
            .filter(
                User.email == "dr.phase20_8@clinic.com"
            )
            .first()
        )

        if not self.doctor:
            self.doctor = User(
                full_name="Dr. Phase 20.8 Test",
                email="dr.phase20_8@clinic.com",
                password="hashed",
                role="Doctor",
            )

            self.db.add(self.doctor)
            self.db.commit()
            self.db.refresh(self.doctor)

    # --------------------------------------------------------
    # TEARDOWN
    # --------------------------------------------------------

    def tearDown(self):
        """
        Close the test database session and remove all
        test tables/data.
        """

        self.db.close()

        Base.metadata.drop_all(bind=TEST_ENGINE)

    # ========================================================
    # TEST 1
    # ========================================================

    def test_01_production_models_hash_integrity(self):
        """
        Verify production ML models have not been modified.
        """

        # ----------------------------------------------------
        # Stroke model
        # ----------------------------------------------------

        self.assertTrue(
            os.path.exists(STROKE_MODEL_PATH),
            "stroke_model.pkl must exist",
        )

        with open(STROKE_MODEL_PATH, "rb") as f:
            stroke_hash = hashlib.sha256(
                f.read()
            ).hexdigest()

        self.assertEqual(
            stroke_hash,
            EXPECTED_STROKE_MODEL_HASH,
            (
                "stroke_model.pkl SHA256 hash changed. "
                "Production model must remain untouched."
            ),
        )

        # ----------------------------------------------------
        # Keystroke model
        # ----------------------------------------------------

        self.assertTrue(
            os.path.exists(KEYSTROKE_MODEL_PATH),
            "keystroke_model.pkl must exist",
        )

        with open(KEYSTROKE_MODEL_PATH, "rb") as f:
            keystroke_hash = hashlib.sha256(
                f.read()
            ).hexdigest()

        self.assertEqual(
            keystroke_hash,
            EXPECTED_KEYSTROKE_MODEL_HASH,
            (
                "keystroke_model.pkl SHA256 hash changed. "
                "Production model must remain untouched."
            ),
        )

    # ========================================================
    # TEST 2
    # ========================================================

    def test_02_dashboard_summary_deduplicates_high_risk_patients(self):
        """
        Verify high-risk patients are not duplicated in the
        dashboard summary.
        """

        # ----------------------------------------------------
        # First prediction
        # ----------------------------------------------------

        prediction_1 = Prediction(
            patient_name="Duplicate Test Patient",
            patient_id="P-DUB-999",
            age=65,
            gender=1,
            clinical_probability=0.75,
            keystroke_probability=0.80,
            final_probability=0.765,
            risk="High",
            status="new",
            created_at=datetime.now(timezone.utc),
        )

        # ----------------------------------------------------
        # Second prediction for same patient
        # ----------------------------------------------------

        prediction_2 = Prediction(
            patient_name="Duplicate Test Patient",
            patient_id="P-DUB-999",
            age=65,
            gender=1,
            clinical_probability=0.85,
            keystroke_probability=0.90,
            final_probability=0.865,
            risk="High",
            status="reviewed",
            created_at=datetime.now(timezone.utc),
        )

        self.db.add_all(
            [
                prediction_1,
                prediction_2,
            ]
        )

        self.db.commit()

        # ----------------------------------------------------
        # Generate dashboard summary
        # ----------------------------------------------------

        summary = get_dashboard_summary(self.db)

        high_risk_patients = summary.get(
            "high_risk_patients",
            [],
        )

        patient_ids = [
            item["patient_code"]
            for item in high_risk_patients
        ]

        # ----------------------------------------------------
        # Verify uniqueness
        # ----------------------------------------------------

        self.assertEqual(
            len(patient_ids),
            len(set(patient_ids)),
            (
                "high_risk_patients must contain "
                "unique patient IDs."
            ),
        )

    # ========================================================
    # TEST 3
    # ========================================================

    def test_03_notification_duplicate_prevention(self):
        """
        Verify duplicate notifications are prevented.
        """

        # ----------------------------------------------------
        # First notification
        # ----------------------------------------------------

        notification_1 = create_notification(
            self.db,
            self.doctor.id,
            "Test Title",
            "Test Message",
            "dup_test",
            "info",
            patient_id="P-DUB-100",
        )

        # ----------------------------------------------------
        # Second identical notification
        # ----------------------------------------------------

        notification_2 = create_notification(
            self.db,
            self.doctor.id,
            "Test Title",
            "Test Message",
            "dup_test",
            "info",
            patient_id="P-DUB-100",
        )

        # ----------------------------------------------------
        # Both calls should return the same record
        # ----------------------------------------------------

        self.assertEqual(
            notification_1.id,
            notification_2.id,
            (
                "Duplicate notification creation must "
                "return the existing notification."
            ),
        )

    # ========================================================
    # TEST 4
    # ========================================================

    def test_04_ai_assistant_datetime_json_serialization(self):
        """
        Verify AI assistant handles datetime values in
        patient context without JSON serialization errors.
        """

        request = ChatRequest(
            message="Summarize patient assessment",
            patient_id="P-DUB-999",
        )

        response = generate_assistant_response(
            self.db,
            request,
            self.doctor,
        )

        self.assertIsNotNone(
            response,
            "AI assistant response must not be None.",
        )

        self.assertIsNotNone(
            response.answer,
            "AI assistant answer must not be None.",
        )

    # ========================================================
    # TEST 5
    # ========================================================

    def test_05_notification_service_duplicate_prevention(self):
        """
        Additional verification that duplicate notification
        prevention works at the database/service level.
        """

        first = create_notification(
            self.db,
            self.doctor.id,
            "Phase 20.8 Alert",
            "Duplicate prevention test",
            "phase20_8_duplicate",
            "info",
            patient_id="P-PHASE20-8",
        )

        second = create_notification(
            self.db,
            self.doctor.id,
            "Phase 20.8 Alert",
            "Duplicate prevention test",
            "phase20_8_duplicate",
            "info",
            patient_id="P-PHASE20-8",
        )

        self.assertIsNotNone(first)
        self.assertIsNotNone(second)

        self.assertEqual(
            first.id,
            second.id,
            "Duplicate notifications must reuse the existing record.",
        )


# ============================================================
# DIRECT TEST EXECUTION
# ============================================================

if __name__ == "__main__":
    unittest.main()
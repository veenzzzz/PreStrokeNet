import unittest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base

from app.models.notification import Notification
from app.models.prediction import Prediction
from app.models.user import User

from app.services.notification_service import (
    create_notification,
    get_unread_count,
    mark_as_read,
)


# ============================================================
# TEST DATABASE
# ============================================================
# Production application continues to use SQL Server.
# These automated tests use an isolated in-memory SQLite DB.
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
# NOTIFICATION SYSTEM TESTS
# ============================================================

class NotificationSystemTests(unittest.TestCase):

    # --------------------------------------------------------
    # SETUP
    # --------------------------------------------------------

    def setUp(self):
        """
        Create the test database schema before each test.
        """

        Base.metadata.create_all(bind=TEST_ENGINE)

        self.db = TestSessionLocal()

    # --------------------------------------------------------
    # TEARDOWN
    # --------------------------------------------------------

    def tearDown(self):
        """
        Close the test session and remove test tables.
        """

        self.db.close()

        Base.metadata.drop_all(bind=TEST_ENGINE)

    # ========================================================
    # TEST 1
    # ========================================================

    def test_01_unauthenticated_notifications_return_401(self):
        """
        Unauthenticated GET /notifications must return 401.
        """

        response = client.get("/notifications")

        self.assertEqual(
            response.status_code,
            401,
        )

    # ========================================================
    # TEST 2
    # ========================================================

    def test_02_unauthenticated_unread_count_returns_401(self):
        """
        Unauthenticated GET /notifications/unread-count
        must return 401.
        """

        response = client.get(
            "/notifications/unread-count"
        )

        self.assertEqual(
            response.status_code,
            401,
        )

    # ========================================================
    # TEST 3
    # ========================================================

    def test_03_unauthenticated_mark_read_returns_401(self):
        """
        Unauthenticated PATCH /notifications/{id}/read
        must return 401.
        """

        response = client.patch(
            "/notifications/1/read"
        )

        self.assertEqual(
            response.status_code,
            401,
        )

    # ========================================================
    # TEST 4
    # ========================================================

    def test_04_unauthenticated_mark_all_read_returns_401(self):
        """
        Unauthenticated PATCH /notifications/read-all
        must return 401.
        """

        response = client.patch(
            "/notifications/read-all"
        )

        self.assertEqual(
            response.status_code,
            401,
        )

    # ========================================================
    # TEST 5
    # ========================================================

    def test_05_notification_service_duplicate_prevention(self):
        """
        Verify notification creation prevents duplicate
        notifications for the same event.
        """

        # ----------------------------------------------------
        # Create synthetic test user
        # ----------------------------------------------------

        user = User(
            email="notif_test@example.com",
            full_name="Notification Tester",
            password="hash",
            role="Doctor",
            is_active=True,
        )

        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        self.assertIsNotNone(user.id)

        # ----------------------------------------------------
        # Find existing prediction if one exists.
        #
        # This test does not require a prediction, so None
        # is valid.
        # ----------------------------------------------------

        prediction = (
            self.db.query(Prediction)
            .first()
        )

        prediction_id = (
            prediction.id
            if prediction
            else None
        )

        # ----------------------------------------------------
        # Create first notification
        # ----------------------------------------------------

        notification_1 = create_notification(
            self.db,
            user_id=user.id,
            title="Test High Risk Alert",
            message="Patient TEST-PATIENT-1 high risk",
            notification_type="high_risk_assessment",
            severity="warning",
            patient_id="TEST-PATIENT-1",
            prediction_id=prediction_id,
        )

        self.assertIsNotNone(
            notification_1,
            "First notification should be created.",
        )

        self.assertIsNotNone(
            notification_1.id,
            "First notification should have an ID.",
        )

        # ----------------------------------------------------
        # Create identical notification again
        # ----------------------------------------------------

        notification_2 = create_notification(
            self.db,
            user_id=user.id,
            title="Test High Risk Alert",
            message="Patient TEST-PATIENT-1 high risk",
            notification_type="high_risk_assessment",
            severity="warning",
            patient_id="TEST-PATIENT-1",
            prediction_id=prediction_id,
        )

        self.assertIsNotNone(
            notification_2,
            "Duplicate notification call should return a record.",
        )

        # ----------------------------------------------------
        # Duplicate must return same notification
        # ----------------------------------------------------

        self.assertEqual(
            notification_1.id,
            notification_2.id,
            (
                "Duplicate notification creation must "
                "return the existing notification."
            ),
        )

        # ----------------------------------------------------
        # Verify unread count
        # ----------------------------------------------------

        unread_count = get_unread_count(
            self.db,
            user.id,
        )

        self.assertGreaterEqual(
            unread_count,
            1,
            "User should have at least one unread notification.",
        )

        # ----------------------------------------------------
        # Mark notification as read
        # ----------------------------------------------------

        marked_notification = mark_as_read(
            self.db,
            user.id,
            notification_1.id,
        )

        self.assertIsNotNone(
            marked_notification,
            "Notification should be returned after marking read.",
        )

        self.assertTrue(
            marked_notification.is_read,
            "Notification should be marked as read.",
        )

        # ----------------------------------------------------
        # Verify unread count after marking read
        # ----------------------------------------------------

        unread_count_after_read = get_unread_count(
            self.db,
            user.id,
        )

        self.assertEqual(
            unread_count_after_read,
            0,
            "Unread notification count should be zero.",
        )


# ============================================================
# DIRECT TEST EXECUTION
# ============================================================

if __name__ == "__main__":
    unittest.main()
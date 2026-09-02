import unittest
from unittest.mock import patch

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.database import Base
from app.models.prediction import Prediction
from app.models.prediction_activity import PredictionActivity
from app.models.user import User
from app.schemas.prediction import FinalPredictionRequest, PredictionSearchParams, PredictionUpdate
from app.services.dashboard_service import get_dashboard_statistics
from app.services.prediction_service import predict_and_persist, search_predictions, update_doctor_notes, update_prediction


class PredictionWorkflowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=cls.engine)

    def setUp(self):
        self.db = Session(self.engine)
        self.db.query(PredictionActivity).delete()
        self.db.query(Prediction).delete()
        self.db.query(User).delete()
        self.db.commit()
        self.user = User(full_name="Dr. Test User", email="doctor@example.com", password="hashed")
        self.db.add(self.user)
        self.db.commit()
        self.db.refresh(self.user)

    def tearDown(self):
        self.db.close()

    def request(self, patient_name: str, patient_id: str):
        return FinalPredictionRequest(
            patient_name=patient_name,
            patient_id=patient_id,
            gender=1,
            age=64,
            hypertension=1,
            heart_disease=0,
            ever_married=1,
            work_type=0,
            Residence_type=1,
            avg_glucose_level=135.5,
            bmi=27.4,
            smoking_status=0,
            key=65,
            H=0.11,
            UD=0.12,
            DD=0.23,
        )

    @patch("app.services.prediction_service.predict_keystroke")
    @patch("app.services.prediction_service.predict")
    def test_prediction_persists_identity_and_activity(self, predict, predict_keystroke):
        predict.return_value = {"probability": 0.2}
        predict_keystroke.return_value = {"probability": 0.4}

        saved = predict_and_persist(self.db, self.request("  Alex Morgan ", " PT-1001 "), self.user.id)

        self.assertEqual(saved.patient_name, "Alex Morgan")
        self.assertEqual(saved.patient_id, "PT-1001")
        self.assertAlmostEqual(saved.final_probability, 0.26)
        activity = self.db.query(PredictionActivity).one()
        self.assertEqual(activity.activity_type, "prediction_created")
        self.assertEqual(activity.prediction_id, saved.id)

    @patch("app.services.prediction_service.predict_keystroke")
    @patch("app.services.prediction_service.predict")
    def test_search_update_and_dashboard_statistics(self, predict, predict_keystroke):
        predict.return_value = {"probability": 0.2}
        predict_keystroke.return_value = {"probability": 0.4}
        predict_and_persist(self.db, self.request("Alex Morgan", "PT-1001"), self.user.id)
        predict.return_value = {"probability": 0.8}
        predict_and_persist(self.db, self.request("Jamie Lee", "PT-1002"), self.user.id)

        result = search_predictions(self.db, PredictionSearchParams(q="PT-1002", page=1, page_size=10, sort="latest"))
        self.assertEqual(result.total, 1)
        self.assertEqual(result.items[0].patient_name, "Jamie Lee")

        updated = update_prediction(self.db, result.items[0].id, PredictionUpdate(doctor_notes="Reviewed by care team"), self.user.id)
        self.assertEqual(updated.doctor_notes, "Reviewed by care team")
        updated_notes = update_doctor_notes(self.db, result.items[0].id, "Final note", self.user.id)
        self.assertEqual(updated_notes.doctor_notes, "Final note")

        stats = get_dashboard_statistics(self.db, days=7)
        self.assertEqual(stats.total_predictions, 2)
        self.assertEqual(stats.high_count, 1)
        self.assertEqual(len(stats.latest_predictions), 2)


if __name__ == "__main__":
    unittest.main()

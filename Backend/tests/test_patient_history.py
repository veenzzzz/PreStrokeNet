import unittest
from unittest.mock import patch
from datetime import date
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.database import Base
from app.models.prediction import Prediction
from app.models.prediction_activity import PredictionActivity
from app.models.user import User
from app.schemas.prediction import FinalPredictionRequest, PredictionUpdate
from app.services.prediction_service import predict_and_persist, update_prediction, update_doctor_notes
from app.api.patient_history import get_patient_history, get_patient_risk_progression, get_patient_timeline

class PatientHistoryTests(unittest.TestCase):
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
        
        self.user = User(
            full_name="Dr. Clinical User",
            email="doctor@example.com",
            password="hashed",
            role="Doctor"
        )
        self.db.add(self.user)
        self.db.commit()
        self.db.refresh(self.user)

    def tearDown(self):
        self.db.close()

    def request(self, patient_name: str, patient_id: str, age: float, glucose: float, bmi: float):
        return FinalPredictionRequest(
            patient_name=patient_name,
            patient_id=patient_id,
            gender=1,
            age=age,
            hypertension=0,
            heart_disease=0,
            ever_married=1,
            work_type=2,
            Residence_type=1,
            avg_glucose_level=glucose,
            bmi=bmi,
            smoking_status=1,
            key=65,
            H=0.11,
            UD=0.12,
            DD=0.23
        )

    @patch("app.services.prediction_service.predict_keystroke")
    @patch("app.services.prediction_service.predict")
    def test_multi_assessment_creation_and_history(self, predict, predict_keystroke):
        predict.return_value = {"probability": 0.1}
        predict_keystroke.return_value = {"probability": 0.2}
        
        # 1. Create first assessment
        p1 = predict_and_persist(self.db, self.request("John Doe", "PT-9999", 50.0, 100.0, 25.0), self.user.id)
        
        # 2. Create second assessment for the same patient ID (should not raise DuplicatePatientIdError now!)
        predict.return_value = {"probability": 0.3}
        p2 = predict_and_persist(self.db, self.request("John Doe", "PT-9999", 51.0, 150.0, 28.0), self.user.id)
        
        self.assertEqual(p1.patient_id, "PT-9999")
        self.assertEqual(p2.patient_id, "PT-9999")
        
        # Verify history retrieval
        history = get_patient_history("PT-9999", self.db, self.user)
        self.assertEqual(len(history), 2)
        # Order should be descending (latest first)
        self.assertEqual(history[0].id, p2.id)
        self.assertEqual(history[1].id, p1.id)

    @patch("app.services.prediction_service.predict_keystroke")
    @patch("app.services.prediction_service.predict")
    def test_risk_progression_calculations(self, predict, predict_keystroke):
        # First assessment: low probability
        predict.return_value = {"probability": 0.1}
        predict_keystroke.return_value = {"probability": 0.0}
        p1 = predict_and_persist(self.db, self.request("John Doe", "PT-9999", 50.0, 90.0, 24.0), self.user.id)
        
        # Second assessment: higher probability
        predict.return_value = {"probability": 0.5}
        predict_keystroke.return_value = {"probability": 0.0}
        p2 = predict_and_persist(self.db, self.request("John Doe", "PT-9999", 51.0, 180.0, 32.0), self.user.id)
        
        # Verify risk progression calculation
        prog = get_patient_risk_progression("PT-9999", self.db, self.user)
        self.assertEqual(len(prog.progression), 2)
        # Progression points sorted ascending (earliest first)
        self.assertEqual(prog.progression[0].prediction_id, p1.id)
        self.assertEqual(prog.progression[1].prediction_id, p2.id)
        
        # Check trend calculations
        latest_change = prog.latest_assessment
        self.assertIsNotNone(latest_change)
        self.assertEqual(latest_change.direction, "Increased")
        self.assertIn("increased", latest_change.status_message)
        self.assertAlmostEqual(latest_change.current_probability, 0.35)  # 0.7*0.5 + 0.3*0.0 = 0.35
        self.assertAlmostEqual(latest_change.previous_probability, 0.07)  # 0.7*0.1 + 0.3*0.0 = 0.07
        self.assertAlmostEqual(latest_change.absolute_change, 0.28)
        self.assertAlmostEqual(latest_change.percentage_change, 28.0)
        
        # SHAP comparison list must exist
        self.assertEqual(len(latest_change.shap_comparison), 10)

    @patch("app.services.prediction_service.predict_keystroke")
    @patch("app.services.prediction_service.predict")
    def test_timeline_activity_logging(self, predict, predict_keystroke):
        predict.return_value = {"probability": 0.1}
        predict_keystroke.return_value = {"probability": 0.2}
        p = predict_and_persist(self.db, self.request("John Doe", "PT-9999", 50.0, 100.0, 25.0), self.user.id)
        
        # Update notes & status
        update_prediction(self.db, p.id, PredictionUpdate(status="final"), self.user.id)
        update_doctor_notes(self.db, p.id, "Patient needs close monitoring", self.user.id)
        
        timeline = get_patient_timeline("PT-9999", self.db, self.user)
        # Should record: prediction_created, prediction_updated, report_generated (due to final status), doctor_notes_added
        activity_types = [event.activity_type for event in timeline]
        self.assertIn("prediction_created", activity_types)
        self.assertIn("report_generated", activity_types)
        self.assertIn("doctor_notes_added", activity_types)

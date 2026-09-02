import unittest
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.database import Base
from app.models.prediction import Prediction
from app.services.keystroke_service import (
    calculate_behavioral_baseline,
    get_keystroke_analytics
)


class KeystrokeDynamicsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=cls.engine)

    def setUp(self):
        self.db = Session(self.engine)
        self.prediction = Prediction(
            patient_name="John Keystroke Doe",
            patient_id="PT-KEY-001",
            gender=1,
            age=65.0,
            hypertension=0,
            heart_disease=0,
            ever_married=1,
            work_type=2,
            Residence_type=1,
            avg_glucose_level=120.0,
            bmi=28.5,
            smoking_status=1,
            key=65,
            H=0.12,
            UD=0.08,
            DD=0.20,
            clinical_probability=0.30,
            keystroke_probability=0.25,
            final_probability=0.285,
            risk="Low",
            status="draft",
            created_by=1
        )
        self.db.add(self.prediction)
        self.db.commit()
        self.db.refresh(self.prediction)

    def tearDown(self):
        self.db.close()

    def test_calculate_behavioral_baseline(self):
        history = [
            {"dwell_time_mean": 0.10, "flight_time_mean": 0.12, "digraph_latency_mean": 0.22, "typing_speed": 4.5, "timing_variability": 0.20},
            {"dwell_time_mean": 0.14, "flight_time_mean": 0.08, "digraph_latency_mean": 0.22, "typing_speed": 4.5, "timing_variability": 0.20}
        ]
        baseline = calculate_behavioral_baseline(history)
        self.assertEqual(baseline["dwell_time_mean"], 0.12)

    def test_get_keystroke_analytics_service(self):
        analytics = get_keystroke_analytics(self.prediction, self.db)
        self.assertEqual(analytics["prediction_id"], self.prediction.id)
        self.assertIn("current_session", analytics)
        self.assertIn("historical_baseline", analytics)
        self.assertIn("baseline_deviations", analytics)
        self.assertIn("disclaimer", analytics)


if __name__ == "__main__":
    unittest.main()

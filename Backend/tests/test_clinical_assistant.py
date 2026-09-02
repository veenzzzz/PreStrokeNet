import os
import unittest
from unittest.mock import patch
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.database import Base
from app.models.user import User
from app.schemas.clinical_assistant import ChatRequest
from app.services.clinical_assistant_service import generate_assistant_response
from app.services.ai_provider import GroundedRuleProvider

@patch.dict(os.environ, {"AI_PROVIDER": "grounded"}, clear=False)
class ClinicalAssistantTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=cls.engine)

    def setUp(self):
        self.db = Session(self.engine)
        self.db.query(User).delete()
        self.db.commit()
        
        self.doctor = User(
            full_name="Dr. Assistant Test",
            email="dr.assistant@clinic.com",
            password="hashed",
            role="Doctor"
        )
        self.db.add(self.doctor)
        self.db.commit()
        self.db.refresh(self.doctor)

    def tearDown(self):
        self.db.close()

    def test_assistant_safety_redirection_on_diagnosis_query(self):
        payload = ChatRequest(message="Does this patient definitely have a stroke and what medication should I prescribe?")
        response = generate_assistant_response(self.db, payload, self.doctor)
        
        self.assertIsNotNone(response.answer)
        self.assertIn("does NOT establish a medical diagnosis", response.answer)
        self.assertIn("PreStrokeNet", response.answer)
        self.assertIsNotNone(response.disclaimer)

    def test_assistant_model_analytics_query(self):
        payload = ChatRequest(message="What is the model accuracy, recall, and decision threshold?")
        response = generate_assistant_response(self.db, payload, self.doctor)
        
        self.assertIn("Random Forest", response.answer)
        self.assertIn("ROC-AUC", response.answer)
        self.assertIn("0.7800", response.answer)
        self.assertIn("0.15", response.answer)
        
        # Verify Model Analytics citation attached
        sources = [c.source for c in response.citations]
        self.assertIn("Model Analytics", sources)

    def test_grounded_provider_health_check(self):
        provider = GroundedRuleProvider()
        health = provider.health_check()
        self.assertEqual(health["status"], "healthy")
        self.assertEqual(health["provider"], "grounded_rule_engine")

    def test_unsupported_patient_info_message(self):
        payload = ChatRequest(message="What was the patient's blood pressure trend in 2015?", patient_id="NONEXISTENT-999")
        response = generate_assistant_response(self.db, payload, self.doctor)
        
        self.assertTrue(
            "don't have" in response.answer.lower() or 
            "patient" in response.answer.lower()
        )

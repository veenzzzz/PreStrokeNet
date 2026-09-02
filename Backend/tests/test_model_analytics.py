import unittest
from unittest.mock import patch
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.database import Base
from app.models.user import User
from app.api.model_analytics import get_model_analytics
import app.services.analytics_service as analytics_service

class ModelAnalyticsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=cls.engine)

    def setUp(self):
        self.db = Session(self.engine)
        self.db.query(User).delete()
        self.db.commit()
        
        self.doctor = User(
            full_name="Dr. Analytics User",
            email="doctor@example.com",
            password="hashed",
            role="Doctor"
        )
        self.user = User(
            full_name="Regular User",
            email="user@example.com",
            password="hashed",
            role="User"
        )
        self.db.add(self.doctor)
        self.db.add(self.user)
        self.db.commit()
        self.db.refresh(self.doctor)
        self.db.refresh(self.user)
        
        # Clear the global cache to force reading files
        analytics_service._cached_analytics.clear()

    def tearDown(self):
        self.db.close()

    def test_analytics_data_loading_and_structure(self):
        response = analytics_service.get_analytics_data()
        
        # Verify Production Metrics
        prod = response.production_model
        self.assertEqual(prod.model, "Random Forest")
        self.assertEqual(prod.accuracy, 0.7847)
        self.assertEqual(prod.precision, 0.1573)
        self.assertEqual(prod.recall, 0.7800)
        self.assertEqual(prod.f1, 0.2617)
        self.assertEqual(prod.roc_auc, 0.7979)
        self.assertEqual(prod.pr_auc, 0.1768)
        self.assertEqual(prod.threshold, 0.15)
        
        # Verify Confusion Matrix
        cm = response.confusion_matrix
        self.assertEqual(cm.tn, 763)
        self.assertEqual(cm.fp, 209)
        self.assertEqual(cm.fn, 11)
        self.assertEqual(cm.tp, 39)
        
        # Verify Feature Importance Rankings
        fi = response.feature_importance
        self.assertEqual(len(fi), 10)
        # Age should be ranked first as it has highest importance
        self.assertEqual(fi[0].field, "age")
        self.assertGreater(fi[0].importance, fi[1].importance)

        # Verify Threshold Curve exists
        tc = response.threshold_analysis
        self.assertGreater(len(tc), 0)
        
        # Verify model comparison list
        mc = response.model_comparison
        self.assertEqual(len(mc), 5)
        model_names = [m.model for m in mc]
        self.assertIn("Random Forest", model_names)
        self.assertIn("Logistic Regression", model_names)

    @patch("os.path.exists")
    def test_missing_evaluation_artifact_handling(self, mock_exists):
        # Force os.path.exists to return False for MD file
        mock_exists.side_effect = lambda path: not path.endswith("phase2_model_analysis.md")
        
        with self.assertRaises(FileNotFoundError) as ctx:
            analytics_service.get_analytics_data()
            
        self.assertIn("phase2_model_analysis.md", str(ctx.exception))

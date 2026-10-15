import os
import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.database import Base
from app.models.clinical_chat import ChatMessage, ChatSession
from app.models.prediction import Prediction
from app.models.user import User
from app.schemas.clinical_assistant import ChatRequest
from app.services.ai_provider import GroundedRuleProvider
from app.services.care_pathways_service import generate_care_pathway
from app.services.clinical_assistant_service import (
    delete_chat_session,
    generate_assistant_response,
    get_chat_session_detail,
    list_chat_sessions,
)
from app.services.fhir_service import export_prediction_to_fhir_bundle
from app.services.clinical_workflow_service import export_audit_logs_csv, get_audit_logs
from app.services.keystroke_service import get_keystroke_analytics
from app.services.patient_monitoring_service import (
    detect_subclinical_motor_degradation,
    get_patient_monitoring_summary,
    process_post_assessment_workflow,
)
from app.services.prediction_service import (
    compute_prediction_uncertainty,
    generate_batch_template_csv,
    get_prediction,
    predict_and_persist,
    process_batch_csv,
    simulate_counterfactual,
)
from app.schemas.prediction import FinalPredictionRequest
from app.services.referral_service import generate_specialist_referral
from app.services.report_service import build_pdf


class Phase21AdvancedEnhancementsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:")
        Base.metadata.create_all(bind=cls.engine)

    def setUp(self):
        self.db = Session(self.engine)
        self.user = User(
            id=101,
            email="dr.neurologist@hospital.org",
            full_name="Dr. Neurologist",
            password="hash",
            role="Doctor",
            phone="+1-555-0199",
            medical_license="MD-2024-9988",
            department="Stroke & Cerebrovascular Unit",
            institution="St. Jude Neuro Center"
        )
        self.db.add(self.user)

        self.patient_pred = Prediction(
            patient_name="Alice Vance",
            patient_id="PT-21-001",
            gender=0,
            age=68.0,
            hypertension=1,
            heart_disease=0,
            ever_married=1,
            work_type=2,
            Residence_type=1,
            avg_glucose_level=165.0,
            bmi=31.2,
            smoking_status=1,
            key=65,
            H=0.15,
            UD=0.10,
            DD=0.25,
            clinical_probability=0.45,
            keystroke_probability=0.35,
            final_probability=0.42,
            risk="Medium",
            status="reviewed",
            created_by=101
        )
        self.db.add(self.patient_pred)
        self.db.commit()
        self.db.refresh(self.patient_pred)

    def tearDown(self):
        self.db.query(ChatMessage).delete()
        self.db.query(ChatSession).delete()
        self.db.query(Prediction).delete()
        self.db.query(User).delete()
        self.db.commit()
        self.db.close()

    def test_01_keystroke_baseline_patient_isolation(self):
        """Verify baseline queries by patient_id so patients have isolated baselines."""
        analytics = get_keystroke_analytics(self.patient_pred, self.db)
        self.assertIn("historical_baseline", analytics)
        self.assertIn("current_session", analytics)
        self.assertEqual(analytics["current_session"]["dwell_time_mean"], 0.15)

    def test_02_adaptive_multimodal_decision_fusion(self):
        """Verify adaptive decision fusion weights custom keystroke_weight and skips."""
        # 1. Custom weight test
        req_custom = FinalPredictionRequest(
            patient_name="Bob Adaptive",
            patient_id="PT-ADAPT-01",
            gender=1,
            age=55.0,
            hypertension=0,
            heart_disease=0,
            ever_married=1,
            work_type=2,
            Residence_type=1,
            avg_glucose_level=110.0,
            bmi=26.0,
            smoking_status=0,
            key=65,
            H=0.12,
            UD=0.08,
            DD=0.20,
            keystroke_weight=0.10
        )
        pred_custom = predict_and_persist(self.db, req_custom, actor_id=101)
        expected_custom = round(0.90 * pred_custom.clinical_probability + 0.10 * pred_custom.keystroke_probability, 4)
        self.assertAlmostEqual(pred_custom.final_probability, expected_custom, places=3)

        # 2. Keystroke skipped fallback test (H=0, UD=0, DD=0 -> 100% clinical)
        req_skip = FinalPredictionRequest(
            patient_name="Carol Skip",
            patient_id="PT-ADAPT-02",
            gender=0,
            age=62.0,
            hypertension=1,
            heart_disease=0,
            ever_married=1,
            work_type=2,
            Residence_type=0,
            avg_glucose_level=140.0,
            bmi=29.0,
            smoking_status=0,
            key=0,
            H=0.0,
            UD=0.0,
            DD=0.0
        )
        pred_skip = predict_and_persist(self.db, req_skip, actor_id=101)
        self.assertAlmostEqual(pred_skip.final_probability, round(pred_skip.clinical_probability, 4), places=3)

    def test_03_clinical_chat_session_persistence_and_management(self):
        """Verify persistent chat sessions and messages stored in the database."""
        req = ChatRequest(
            message="What is the current patient risk level?",
            patient_id="PT-21-001",
            prediction_id=self.patient_pred.id
        )
        resp = generate_assistant_response(self.db, req, self.user)
        self.assertIsNotNone(resp.session_id)
        self.assertTrue(len(resp.answer) > 0)

        # List sessions
        sessions = list_chat_sessions(self.db, self.user.id, patient_id="PT-21-001")
        self.assertTrue(len(sessions) >= 1)
        target_session = sessions[0]
        self.assertEqual(target_session.id, resp.session_id)

        # Detail
        detail = get_chat_session_detail(self.db, target_session.id, self.user.id)
        self.assertIsNotNone(detail)
        self.assertTrue(len(detail.messages) >= 2)  # User + Assistant

        # Delete
        deleted = delete_chat_session(self.db, target_session.id, self.user.id)
        self.assertTrue(deleted)
        self.assertIsNone(get_chat_session_detail(self.db, target_session.id, self.user.id))

    def test_04_aha_asa_guidelines_grounding(self):
        """Verify assistant returns grounded AHA/ASA secondary prevention guidelines."""
        provider = GroundedRuleProvider()
        context = {
            "prediction": {
                "risk": "High",
                "avg_glucose_level": 170.0,
                "hypertension": 1
            }
        }
        res = provider.generate_response(
            system_instruction="Assistant instruction",
            user_message="What are the clinical guideline care recommendations for this patient?",
            context=context
        )
        self.assertIn("AHA/ASA", res)
        self.assertIn("< 130/80 mmHg", res)
        self.assertIn("FAST", res)

    def test_05_care_pathway_generation(self):
        """Verify personalized care pathway action plan based on patient risk & SHAP drivers."""
        pathway = generate_care_pathway(self.patient_pred, self.db)
        self.assertEqual(pathway["patient_id"], "PT-21-001")
        self.assertEqual(pathway["risk_level"], "Medium")
        self.assertTrue(len(pathway["diagnostic_workup"]) > 0)
        self.assertTrue(len(pathway["physiological_targets"]) > 0)
        self.assertTrue(len(pathway["neurological_surveillance"]) > 0)
        self.assertIn("disclaimer", pathway)

    def test_06_fhir_r4_bundle_export(self):
        """Verify FHIR Release 4 standard document bundle generation."""
        bundle = export_prediction_to_fhir_bundle(self.patient_pred)
        self.assertEqual(bundle["resourceType"], "Bundle")
        self.assertEqual(bundle["type"], "collection")
        
        types = [e["resource"]["resourceType"] for e in bundle["entry"]]
        self.assertIn("Patient", types)
        self.assertIn("Observation", types)
        self.assertIn("RiskAssessment", types)

        risk_res = next(e["resource"] for e in bundle["entry"] if e["resource"]["resourceType"] == "RiskAssessment")
        self.assertIn("prediction", risk_res)
        self.assertEqual(risk_res["prediction"][0]["qualitativeRisk"]["text"], "Medium Risk")

    def test_07_enhanced_pdf_with_credentials_and_care_pathway(self):
        """Verify build_pdf embeds physician credentials and AHA/ASA care pathway."""
        pdf_bytes = build_pdf(self.patient_pred, reviewer=self.user, db=self.db)
        self.assertIsInstance(pdf_bytes, bytes)
        self.assertGreater(len(pdf_bytes), 2000)
        # PDF binary starts with '%PDF-'
        self.assertTrue(pdf_bytes.startswith(b"%PDF-"))

    def test_08_batch_cohort_csv_screening(self):
        """Verify batch cohort CSV parsing, adaptive fallback, and triage summary."""
        template = generate_batch_template_csv()
        self.assertIn("patient_name,patient_id,gender,age", template)
        self.assertIn("Eleanor Vance", template)

        sample_csv = (
            "patient_name,patient_id,gender,age,hypertension,heart_disease,ever_married,work_type,residence_type,avg_glucose_level,bmi,smoking_status,H,UD,DD\n"
            "Cohort Patient A,PT-COH-01,Female,75,1,1,1,0,Urban,210.5,33.2,1,0.12,0.10,0.24\n"
            "Cohort Patient B,PT-COH-02,Male,52,0,0,1,1,Rural,105.0,24.5,0,0.0,0.0,0.0\n"
        )
        res = process_batch_csv(self.db, sample_csv, actor_id=101)
        self.assertEqual(res["total_submitted"], 2)
        self.assertEqual(res["total_processed"], 2)
        self.assertEqual(len(res["processed_records"]), 2)
        self.assertIn("mean_stroke_probability", res)
        self.assertGreater(res["mean_stroke_probability"], 0.0)

    def test_09_counterfactual_simulation(self):
        """Verify counterfactual 'what-if' risk reduction calculation and intervention rankings."""
        sim = simulate_counterfactual(
            self.patient_pred,
            modifications={
                "hypertension": 0,
                "smoking_status": 0,
                "avg_glucose_level": 95.0,
                "bmi": 24.0,
            }
        )
        self.assertEqual(sim["prediction_id"], self.patient_pred.id)
        self.assertIn("baseline", sim)
        self.assertIn("simulated", sim)
        self.assertGreaterEqual(sim["simulated"]["absolute_risk_reduction"], 0.0)
        self.assertTrue(len(sim["intervention_rankings"]) > 0)
        self.assertIn("primary_driver", sim)
        self.assertIn("counseling_message", sim)

    def test_10_subclinical_motor_degradation_alerting(self):
        """Verify longitudinal subclinical neuromotor degradation detector and notification generation."""
        # 1. Single session: insufficient data
        single_res = detect_subclinical_motor_degradation(self.db, "PT-SINGLE-MOTOR")
        self.assertFalse(single_res["is_degraded"])
        self.assertEqual(single_res["status"], "INSUFFICIENT_DATA")

        # 2. Setup patient with baseline visit (normal latency: H=0.10s, UD=0.08s)
        p1 = Prediction(
            patient_name="Motor Test Patient",
            patient_id="PT-MOTOR-99",
            gender=1,
            age=65.0,
            hypertension=1,
            heart_disease=0,
            ever_married=1,
            work_type=2,
            Residence_type=1,
            avg_glucose_level=130.0,
            bmi=28.0,
            smoking_status=0,
            key=65,
            H=0.10,
            UD=0.08,
            DD=0.18,
            clinical_probability=0.20,
            keystroke_probability=0.15,
            final_probability=0.185,
            risk="Low",
            created_by=101,
        )
        self.db.add(p1)
        self.db.commit()

        # Check with 1 session
        single_check = detect_subclinical_motor_degradation(self.db, "PT-MOTOR-99")
        self.assertFalse(single_check["is_degraded"])
        self.assertEqual(single_check["session_count"], 1)

        # 3. Add follow-up session exhibiting +40% dwell slowing (H=0.14s, UD=0.11s)
        p2 = Prediction(
            patient_name="Motor Test Patient",
            patient_id="PT-MOTOR-99",
            gender=1,
            age=65.0,
            hypertension=1,
            heart_disease=0,
            ever_married=1,
            work_type=2,
            Residence_type=1,
            avg_glucose_level=130.0,
            bmi=28.0,
            smoking_status=0,
            key=65,
            H=0.14,
            UD=0.11,
            DD=0.25,
            clinical_probability=0.20,
            keystroke_probability=0.35,
            final_probability=0.245,
            risk="Medium",
            created_by=101,
        )
        self.db.add(p2)
        self.db.commit()

        # Detector should now flag degradation
        degraded_res = detect_subclinical_motor_degradation(self.db, "PT-MOTOR-99")
        self.assertTrue(degraded_res["is_degraded"])
        self.assertEqual(degraded_res["severity"], "HIGH")
        self.assertGreaterEqual(degraded_res["dwell_shift_pct"], 35.0)
        self.assertIn("Brain MRI with Diffusion-Weighted Imaging", " ".join(degraded_res["recommended_workup"]))
        self.assertIn("subclinical", degraded_res["clinical_rationale"].lower())

        # Test workflow auto-event detection
        events = process_post_assessment_workflow(self.db, p2, self.user)
        self.assertIn("MOTOR_DEGRADATION_DETECTED", events)

        # Verify summary includes motor degradation alert
        summary = get_patient_monitoring_summary(self.db, "PT-MOTOR-99")
        self.assertIn("motor_degradation_alert", summary)
        self.assertTrue(summary["motor_degradation_alert"]["is_degraded"])

    def test_11_specialist_referral_letter_generation(self):
        """Verify specialist referral letter generation in Markdown and structured format."""
        ref = generate_specialist_referral(
            prediction=self.patient_pred,
            reviewer=self.user,
            target_specialty="Vascular Neurology & TIA Clinic",
            priority="URGENT",
            clinical_notes="Patient reported transient left hand numbness.",
            db=self.db,
        )
        self.assertIn("referral_id", ref)
        self.assertEqual(ref["urgency"], "URGENT")
        self.assertEqual(ref["target_specialty"], "Vascular Neurology & TIA Clinic")
        self.assertEqual(ref["referring_clinician"]["name"], "Dr. Neurologist")
        self.assertEqual(ref["patient"]["name"], "Alice Vance")
        self.assertIn("Brain MRI without contrast with Diffusion-Weighted Imaging", " ".join(ref["recommended_orders"]))
        self.assertIn("CLINICAL CONSULTATION & REFERRAL LETTER", ref["markdown_content"])
        self.assertIn("transient left hand numbness", ref["markdown_content"])

    def test_12_audit_log_filtering_and_compliance_export(self):
        """Verify HIPAA/GDPR audit log queries, action filtering, and cryptographic SHA-256 CSV export."""
        # Query with filters
        res = get_audit_logs(self.db, self.user, page=1, limit=10, action="Assessment")
        self.assertIn("audit_logs", res)
        self.assertIn("total_count", res)

        # Export CSV
        csv_text, sha256_hash = export_audit_logs_csv(self.db, self.user)
        self.assertIn("audit_id,timestamp_utc,clinician_name", csv_text)
        self.assertEqual(len(sha256_hash), 64)  # SHA-256 hex string length

    def test_13_prediction_uncertainty_and_calibration_metrics(self):
        """Verify 95% Wilson confidence interval calibration and uncertainty analysis."""
        unc = compute_prediction_uncertainty(
            final_probability=0.285,
            clinical_prob=0.250,
            keystroke_prob=0.320,
        )
        self.assertEqual(unc["point_estimate"], 0.285)
        self.assertLess(unc["lower_95_ci"], unc["point_estimate"])
        self.assertGreater(unc["upper_95_ci"], unc["point_estimate"])
        self.assertIn(unc["confidence_grade"], ["HIGH", "MODERATE", "LOW"])
        self.assertIn("brier_score_benchmark", unc)

        # Verify get_prediction includes calibration_metrics
        detail = get_prediction(self.db, self.patient_pred.id)
        self.assertIsNotNone(detail)
        self.assertIsNotNone(detail.calibration_metrics)
        self.assertEqual(detail.calibration_metrics["brier_score_benchmark"], 0.0373)


if __name__ == "__main__":
    unittest.main()




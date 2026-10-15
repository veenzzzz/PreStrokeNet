from typing import Any, Dict, List
from sqlalchemy.orm import Session

from app.models.prediction import Prediction
from app.services.explainability_service import build_explanation


def generate_care_pathway(prediction: Prediction, db: Session | None = None) -> Dict[str, Any]:
    """
    Generates a personalized, evidence-based clinical care pathway
    aligned with AHA/ASA secondary stroke prevention guidelines and
    driven by patient-specific SHAP model risk attributions.
    """
    risk = prediction.risk or "Low"
    age = float(getattr(prediction, "age", 50) or 50)
    htn = int(getattr(prediction, "hypertension", 0) or 0)
    heart_disease = int(getattr(prediction, "heart_disease", 0) or 0)
    glucose = float(getattr(prediction, "avg_glucose_level", 100) or 100)
    bmi = float(getattr(prediction, "bmi", 25) or 25)
    smoking = int(getattr(prediction, "smoking_status", 0) or 0)
    ud = float(getattr(prediction, "UD", 0.08) or 0.08)
    h = float(getattr(prediction, "H", 0.12) or 0.12)

    # Calculate timing variability
    timing_var = (ud / h) if h > 0 else 0.20

    # Extract primary drivers from SHAP explanation if available
    drivers: List[str] = []
    try:
        explanation = build_explanation(prediction)
        top_items = getattr(explanation, "top_contributors", []) or []
        for item in top_items:
            feat = getattr(item, "feature", "")
            contrib = getattr(item, "contribution", 0)
            if contrib > 0 and feat not in drivers:
                drivers.append(feat)
    except Exception:
        pass

    if not drivers:
        if age >= 60:
            drivers.append("Age")
        if htn:
            drivers.append("Hypertension")
        if glucose >= 140:
            drivers.append("Average Glucose Level")
        if heart_disease:
            drivers.append("Heart Disease")
        if bmi >= 30:
            drivers.append("Body Mass Index")

    # 1. Diagnostic Workup
    diagnostics: List[Dict[str, str]] = []
    if htn or "Hypertension" in drivers:
        diagnostics.append({
            "test": "24-Hour Ambulatory Blood Pressure Monitoring (ABPM)",
            "urgency": "High" if risk == "High" else "Routine",
            "rationale": "Rule out masked hypertension and assess nocturnal dipping status."
        })
    if heart_disease or age >= 65:
        diagnostics.append({
            "test": "12-Lead ECG & 48-Hour Holter Monitoring",
            "urgency": "High" if risk == "High" else "Medium",
            "rationale": "Screen for occult paroxysmal atrial fibrillation (AFib)."
        })
    if glucose >= 126 or "Average Glucose Level" in drivers:
        diagnostics.append({
            "test": "Glycated Hemoglobin (HbA1c) & Fasting Lipid Panel",
            "urgency": "High" if glucose > 180 else "Routine",
            "rationale": "Evaluate glycemic control and atherogenic dyslipidemia."
        })
    if risk == "High" or age >= 65:
        diagnostics.append({
            "test": "Carotid Duplex Ultrasonography",
            "urgency": "Medium",
            "rationale": "Screen for hemodynamically significant internal carotid artery stenosis."
        })

    # Always ensure at least baseline investigations
    if not diagnostics:
        diagnostics.append({
            "test": "Comprehensive Metabolic Panel & Lipid Profile",
            "urgency": "Routine",
            "rationale": "Baseline vascular risk factor surveillance."
        })

    # 2. Physiological Target Goals (AHA/ASA Guidelines)
    targets: List[Dict[str, str]] = [
        {"metric": "Blood Pressure", "target": "< 130/80 mmHg", "status": "Above Target" if htn else "Within Target"},
        {"metric": "Glycemic Control", "target": "HbA1c < 7.0% (Fasting < 100 mg/dL)", "status": "Above Target" if glucose >= 140 else "Optimal"},
        {"metric": "LDL Cholesterol", "target": "< 70 mg/dL", "status": "Statin Indicated" if risk in ["Medium", "High"] else "Target Range"},
        {"metric": "Body Mass Index", "target": "18.5 – 24.9 kg/m²", "status": "Elevated" if bmi >= 28.0 else "Optimal"},
    ]

    # 3. Behavioral & Motor Surveillance
    motor_surveillance: List[str] = [
        "FAST Protocol Patient Education: Recognize Face drooping, Arm weakness, Speech difficulty.",
        "Monthly PreStrokeNet Keystroke Timing Assessment to monitor bilateral fine-motor latency shifts."
    ]
    if timing_var > 0.35:
        motor_surveillance.append("Elevated motor timing variability observed (>0.35); perform formal neurological motor exam (NIHSS / Finger-Nose-Finger test).")

    # 4. Lifestyle & Prevention Interventions
    lifestyle: List[str] = [
        "DASH / Mediterranean Dietary Pattern (sodium limit < 2,300 mg/day).",
        "≥ 150 minutes per week of moderate-intensity aerobic exercise.",
    ]
    if smoking:
        lifestyle.append("Smoking Cessation: Structured counseling and pharmacological cessation support.")
    if bmi >= 30:
        lifestyle.append("Nutritional counseling and 5-10% body weight reduction goal.")

    # 5. Follow-Up Interval
    follow_up_map = {
        "High": "2 to 4 weeks (Comprehensive clinical visit with repeat laboratory panel)",
        "Medium": "3 months (Routine primary care follow-up with blood pressure check)",
        "Low": "6 to 12 months (Annual preventative wellness screening)"
    }
    follow_up = follow_up_map.get(risk, "3 months")

    return {
        "prediction_id": prediction.id,
        "patient_id": prediction.patient_id,
        "patient_name": prediction.patient_name,
        "risk_level": risk,
        "final_probability": round(float(prediction.final_probability or 0) * (100 if (prediction.final_probability or 0) <= 1.0 else 1), 1),
        "primary_risk_drivers": drivers,
        "diagnostic_workup": diagnostics,
        "physiological_targets": targets,
        "neurological_surveillance": motor_surveillance,
        "lifestyle_interventions": lifestyle,
        "recommended_follow_up": follow_up,
        "disclaimer": "This care pathway is an automated clinical decision-support recommendation based on statistical risk attributions and AHA/ASA guidelines. It does not replace individualized clinician judgment."
    }

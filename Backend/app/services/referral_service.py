from datetime import datetime, timezone
from typing import Any, Optional
from sqlalchemy.orm import Session

from app.models.prediction import Prediction
from app.models.user import User


def generate_specialist_referral(
    prediction: Prediction,
    reviewer: Optional[User] = None,
    target_specialty: str = "Vascular Neurology / Stroke Prevention Clinic",
    priority: str = "URGENT",
    clinical_notes: str = "",
    db: Optional[Session] = None,
) -> dict[str, Any]:
    """
    Generates a formal, guideline-grounded Specialist Referral Letter
    for patients flagged with elevated cerebrovascular risk or subclinical neuromotor slowing.
    """
    now = datetime.now(timezone.utc)
    date_str = now.strftime("%B %d, %Y")
    ref_id = f"REF-{prediction.id:04d}-{now.strftime('%Y%m%d%H%M')}"

    # Clinician details
    dr_name = getattr(reviewer, "full_name", None) or "Reviewing Physician"
    license_num = getattr(reviewer, "medical_license", None) or "Not Recorded"
    dept = getattr(reviewer, "department", None) or "Cerebrovascular & Preventive Neurology"
    inst = getattr(reviewer, "institution", None) or "PreStrokeNet Clinical Network"
    phone = getattr(reviewer, "phone", None) or "Department Direct Line"
    email = getattr(reviewer, "email", None) or "physician@hospital.org"

    # Patient details
    p_name = prediction.patient_name or f"Patient {prediction.id}"
    p_id = prediction.patient_id or f"PT-{prediction.id:04d}"
    age = prediction.age or 0.0
    gender_str = "Male" if prediction.gender == 1 else "Female" if prediction.gender == 0 else "Other"

    # Clinical vitals
    glucose = prediction.avg_glucose_level or 0.0
    bmi = prediction.bmi or 0.0
    htn = "Yes (Hypertensive)" if prediction.hypertension == 1 else "No (Normotensive)"
    hd = "Yes (Known Cardiac Disease)" if prediction.heart_disease == 1 else "No Known Heart Disease"
    smoking_map = {0: "Never Smoked", 1: "Formerly Smoked", 2: "Current Smoker"}
    smoking = smoking_map.get(prediction.smoking_status, "Unknown")

    # Risk Probabilities
    final_prob = float(prediction.final_probability or 0.0)
    clin_prob = float(prediction.clinical_probability or 0.0)
    key_prob = float(prediction.keystroke_probability or 0.0)
    risk_cat = (prediction.risk or "Low").capitalize()

    # Neuromotor metrics
    h_ms = round(float(prediction.H or 0.0) * 1000.0, 1)
    ud_ms = round(float(prediction.UD or 0.0) * 1000.0, 1)
    dd_ms = round(float(prediction.DD or 0.0) * 1000.0, 1)

    # Check motor degradation if db provided
    motor_degraded = False
    motor_shift_pct = 0.0
    if db and prediction.patient_id:
        try:
            from app.services.patient_monitoring_service import detect_subclinical_motor_degradation
            res = detect_subclinical_motor_degradation(db, prediction.patient_id)
            motor_degraded = res.get("is_degraded", False)
            motor_shift_pct = res.get("latency_shift_pct", 0.0)
        except Exception:
            pass

    # Urgency determination
    urgency_tag = priority.upper().strip()
    if urgency_tag not in ["URGENT", "PRIORITY", "ROUTINE"]:
        urgency_tag = "URGENT" if risk_cat == "High" or motor_degraded else "PRIORITY"

    # Pre-consult recommended workup
    recommended_orders = [
        "Brain MRI without contrast with Diffusion-Weighted Imaging (DWI) and Axial FLAIR (rule out acute/subacute or silent lacunar ischemia)",
        "Bilateral Carotid and Vertebral Duplex Ultrasonography (screen for >50% extracranial internal carotid stenosis)",
        "12-Lead Resting Electrocardiogram + 24-48 Hour Holter Rhythm Monitor (rule out occult paroxysmal atrial fibrillation)",
        "Fasting Comprehensive Metabolic Panel, Lipid Profile (LDL-C target <70 mg/dL), and HbA1c",
    ]

    # Clinical Narrative
    reason_for_consult = (
        f"Evaluation and secondary prevention optimization for {p_name} ({age:.0f}yo {gender_str}), "
        f"who was identified by PreStrokeNet multivariable risk stratification at {risk_cat} risk "
        f"({final_prob:.1%} estimated combined stroke probability)."
    )
    if motor_degraded:
        reason_for_consult += (
            f" Notably, serial neuromotor kinematic surveillance detected a +{motor_shift_pct:.1f}% "
            f"subclinical fine-motor latency slowdown (Dwell H={h_ms} ms, Flight UD={ud_ms} ms), "
            f"raising clinical suspicion for small-vessel lacunar ischemia or subcortical white-matter microvascular disease."
        )

    # Construct formatted Markdown Letter
    markdown_lines = [
        f"# CLINICAL CONSULTATION & REFERRAL LETTER",
        f"**Referral Reference ID:** `{ref_id}`  ",
        f"**Date:** {date_str}  ",
        f"**Urgency / Priority:** **{urgency_tag}**  ",
        f"**Target Specialty:** {target_specialty}  ",
        f"",
        f"---",
        f"",
        f"### 1. REFERRING CLINICIAN INFORMATION",
        f"- **Name:** {dr_name}",
        f"- **Medical License / NPI:** {license_num}",
        f"- **Department:** {dept}",
        f"- **Institution:** {inst}",
        f"- **Contact:** {phone} | {email}",
        f"",
        f"### 2. PATIENT DEMOGRAPHICS",
        f"- **Patient Name:** {p_name}",
        f"- **Medical Record Number (MRN / Patient ID):** `{p_id}`",
        f"- **Age / Biological Sex:** {age:.0f} years old | {gender_str}",
        f"",
        f"### 3. REASON FOR REFERRAL & CLINICAL SUMMARY",
        f"{reason_for_consult}",
        f"",
        f"### 4. OBJECTIVE MULTI-MODALITY RISK FINDINGS",
        f"| Parameter | Assessed Value | Clinical Context / Benchmark |",
        f"| :--- | :--- | :--- |",
        f"| **Combined Stroke Probability** | **{final_prob:.1%}** | Multivariable TabNet + Keystroke Fusion |",
        f"| **Risk Category** | **{risk_cat} Risk** | Clinical Risk Stratification |",
        f"| **Clinical Biomarker Risk** | {clin_prob:.1%} | TabNet Clinical Sub-model |",
        f"| **Neuromotor Keystroke Risk** | {key_prob:.1%} | Behavioral Biometrics Sub-model |",
        f"| **Key-Hold Dwell Time (H)** | {h_ms} ms | Normal Adult Baseline: ~100-130 ms |",
        f"| **Inter-Key Flight Latency (UD)** | {ud_ms} ms | Normal Adult Baseline: ~60-90 ms |",
        f"| **Digraph Latency (DD)** | {dd_ms} ms | Fine Motor Bilateral Benchmark: ~180-220 ms |",
        f"| **Hypertension Status** | {htn} | SBP Goal <130/80 mmHg per ACC/AHA |",
        f"| **Fasting Blood Glucose** | {glucose:.1f} mg/dL | Glycemic Target: HbA1c <7.0% |",
        f"| **Body Mass Index (BMI)** | {bmi:.1f} kg/m² | Target: 18.5 - 24.9 kg/m² |",
        f"| **Cardiac Disease History** | {hd} | Coronary / Valvular Etiology |",
        f"| **Tobacco Use** | {smoking} | Cessation Counseling Benchmark |",
        f"",
        f"### 5. RECOMMENDED PRE-CONSULT DIAGNOSTIC ORDERS",
    ]
    for idx, order in enumerate(recommended_orders, 1):
        markdown_lines.append(f"{idx}. {order}")

    if clinical_notes:
        markdown_lines.extend([
            f"",
            f"### 6. REFERRING CLINICIAN CLINICAL NOTES & ADDENDUM",
            f"> {clinical_notes}",
        ])

    markdown_lines.extend([
        f"",
        f"---",
        f"",
        f"### REFERRING PHYSICIAN SIGN-OFF",
        f"**Electronically Signed By:** {dr_name}, MD  ",
        f"**License/NPI:** {license_num} | **Department:** {dept}  ",
        f"**Facility:** {inst}  ",
        f"**Timestamp:** {now.strftime('%Y-%m-%d %H:%M:%S UTC')}  ",
        f"",
        f"*Generated automatically via PreStrokeNet Clinical Decision Support Platform. This referral does not substitute for independent professional clinical judgment.*",
    ])

    markdown_text = "\n".join(markdown_lines)

    return {
        "referral_id": ref_id,
        "date": date_str,
        "urgency": urgency_tag,
        "target_specialty": target_specialty,
        "referring_clinician": {
            "name": dr_name,
            "license": license_num,
            "department": dept,
            "institution": inst,
            "phone": phone,
            "email": email,
        },
        "patient": {
            "name": p_name,
            "patient_id": p_id,
            "age": age,
            "gender": gender_str,
        },
        "clinical_assessment": {
            "risk_category": risk_cat,
            "final_probability": final_prob,
            "clinical_probability": clin_prob,
            "keystroke_probability": key_prob,
            "motor_degradation_detected": motor_degraded,
            "motor_shift_pct": motor_shift_pct,
            "dwell_ms": h_ms,
            "flight_ms": ud_ms,
            "glucose": glucose,
            "bmi": bmi,
            "hypertension": htn,
            "heart_disease": hd,
            "smoking": smoking,
        },
        "recommended_orders": recommended_orders,
        "clinical_notes": clinical_notes,
        "markdown_content": markdown_text,
    }

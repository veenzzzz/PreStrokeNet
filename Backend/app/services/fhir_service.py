from datetime import datetime, timezone
from typing import Any, Dict, List

from app.models.prediction import Prediction
from app.services.explainability_service import build_explanation


def export_prediction_to_fhir_bundle(prediction: Prediction) -> Dict[str, Any]:
    """
    Converts a PreStrokeNet prediction assessment into an HL7 FHIR Release 4
    compliant JSON document bundle containing Patient, Observations, and RiskAssessment.
    """
    pid = str(prediction.patient_id or f"PT-{prediction.id}")
    pname = prediction.patient_name or "Anonymous Patient"
    gender_fhir = "male" if prediction.gender == 1 else "female" if prediction.gender == 0 else "unknown"
    created_str = (prediction.created_at or datetime.now(timezone.utc)).isoformat()

    # 1. FHIR Patient Resource
    patient_resource = {
        "fullUrl": f"urn:uuid:patient-{pid}",
        "resource": {
            "resourceType": "Patient",
            "id": pid,
            "identifier": [
                {"system": "http://prestrogenet.org/patients", "value": pid}
            ],
            "active": True,
            "name": [{"use": "official", "text": pname}],
            "gender": gender_fhir,
        }
    }

    # 2. Glucose Observation (LOINC 2339-0)
    glucose_obs = {
        "fullUrl": f"urn:uuid:obs-glucose-{prediction.id}",
        "resource": {
            "resourceType": "Observation",
            "id": f"obs-glucose-{prediction.id}",
            "status": "final",
            "category": [
                {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "laboratory"}]}
            ],
            "code": {
                "coding": [{"system": "http://loinc.org", "code": "2339-0", "display": "Glucose [Mass/volume] in Blood"}],
                "text": "Average Blood Glucose Level"
            },
            "subject": {"reference": f"Patient/{pid}"},
            "effectiveDateTime": created_str,
            "valueQuantity": {
                "value": float(prediction.avg_glucose_level or 0),
                "unit": "mg/dL",
                "system": "http://unitsofmeasure.org",
                "code": "mg/dL"
            }
        }
    }

    # 3. BMI Observation (LOINC 39156-5)
    bmi_obs = {
        "fullUrl": f"urn:uuid:obs-bmi-{prediction.id}",
        "resource": {
            "resourceType": "Observation",
            "id": f"obs-bmi-{prediction.id}",
            "status": "final",
            "category": [
                {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category", "code": "vital-signs"}]}
            ],
            "code": {
                "coding": [{"system": "http://loinc.org", "code": "39156-5", "display": "Body mass index (BMI) [Ratio]"}],
                "text": "Body Mass Index"
            },
            "subject": {"reference": f"Patient/{pid}"},
            "effectiveDateTime": created_str,
            "valueQuantity": {
                "value": float(prediction.bmi or 0),
                "unit": "kg/m2",
                "system": "http://unitsofmeasure.org",
                "code": "kg/m2"
            }
        }
    }

    # 4. Keystroke Behavioral Dynamics Observation
    keystroke_obs = {
        "fullUrl": f"urn:uuid:obs-keystroke-{prediction.id}",
        "resource": {
            "resourceType": "Observation",
            "id": f"obs-keystroke-{prediction.id}",
            "status": "final",
            "code": {
                "text": "Keystroke Timing Dynamics Behavioral Assessment"
            },
            "subject": {"reference": f"Patient/{pid}"},
            "effectiveDateTime": created_str,
            "component": [
                {"code": {"text": "Dwell Time (H)"}, "valueQuantity": {"value": float(prediction.H or 0), "unit": "s"}},
                {"code": {"text": "Flight Time (UD)"}, "valueQuantity": {"value": float(prediction.UD or 0), "unit": "s"}},
                {"code": {"text": "Digraph Latency (DD)"}, "valueQuantity": {"value": float(prediction.DD or 0), "unit": "s"}}
            ]
        }
    }

    # 5. Extract SHAP attributions for RiskAssessment extensions
    shap_extensions: List[Dict[str, Any]] = []
    try:
        explanation = build_explanation(prediction)
        for item in getattr(explanation, "top_contributors", []) or []:
            shap_extensions.append({
                "url": "http://prestrogenet.org/fhir/StructureDefinition/shap-feature-attribution",
                "extension": [
                    {"url": "feature", "valueString": getattr(item, "feature", "")},
                    {"url": "contribution", "valueDecimal": round(float(getattr(item, "contribution", 0)), 4)},
                    {"url": "patientValue", "valueString": str(getattr(item, "patient_value", ""))}
                ]
            })
    except Exception:
        pass

    # Normalized probability value
    raw_prob = float(prediction.final_probability or 0)
    prob_decimal = raw_prob if raw_prob <= 1.0 else round(raw_prob / 100.0, 4)

    # 6. FHIR RiskAssessment Resource
    risk_assessment = {
        "fullUrl": f"urn:uuid:riskassessment-{prediction.id}",
        "resource": {
            "resourceType": "RiskAssessment",
            "id": f"riskassessment-{prediction.id}",
            "status": "final",
            "subject": {"reference": f"Patient/{pid}"},
            "occurrenceDateTime": created_str,
            "basis": [
                {"reference": f"Observation/obs-glucose-{prediction.id}"},
                {"reference": f"Observation/obs-bmi-{prediction.id}"},
                {"reference": f"Observation/obs-keystroke-{prediction.id}"}
            ],
            "prediction": [
                {
                    "outcome": {
                        "coding": [
                            {"system": "http://snomed.info/sct", "code": "230690007", "display": "Stroke"}
                        ],
                        "text": "Cerebrovascular Accident (Stroke) Risk"
                    },
                    "probabilityDecimal": prob_decimal,
                    "qualitativeRisk": {
                        "coding": [
                            {"system": "http://prestrogenet.org/risk-levels", "code": (prediction.risk or "Low").lower()}
                        ],
                        "text": f"{prediction.risk or 'Low'} Risk"
                    }
                }
            ],
            "method": {
                "text": "PreStrokeNet Random Forest + Keystroke Dynamics Multimodal Pipeline (0.7 Clinical / 0.3 Keystroke)"
            },
            "extension": shap_extensions,
            "note": [
                {"text": "Automated screening decision-support calculation. Not an independent medical diagnosis."}
            ]
        }
    }

    # Assemble FHIR Bundle
    return {
        "resourceType": "Bundle",
        "id": f"bundle-prestrogenet-{prediction.id}",
        "meta": {
            "lastUpdated": created_str
        },
        "type": "collection",
        "entry": [
            patient_resource,
            glucose_obs,
            bmi_obs,
            keystroke_obs,
            risk_assessment
        ]
    }

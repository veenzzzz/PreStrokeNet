# End-to-End Clinician Demonstration Guide

This guide walks through the complete end-to-end user journey for demonstrating PreStrokeNet.

---

## Step-by-Step Demonstration Journey

1. **Authentication**: Log into PreStrokeNet using authorized credentials (`doctor@prestrokenet.com`).
2. **Dashboard Overview**: View system metrics, patient assessment counts, and recent stroke risk flags.
3. **Clinical Risk Assessment**: Submit a patient profile (Age: 68, Glucose: 215.4, BMI: 31.4, Hypertension: Yes, Heart Disease: Yes).
4. **Risk Classification Output**: Receive risk probability (`65.0%`, High Risk) based on screening threshold $t = 0.15$.
5. **TreeSHAP Explainability**: Inspect top contributing factors (Age $+19.5\%$, Glucose $+8.4\%$) to understand model attributions.
6. **Keystroke Dynamics**: Review longitudinal typing rhythm stability and behavioral timing variance.
7. **Patient Risk Progression**: Open patient history to contrast current risk with prior visits ($\Delta\%$).
8. **AI Assistant Consultation**: Ask the AI Assistant for context-grounded summary of patient history and model attributions.
9. **Multi-Format Export**: Generate and download a PDF clinical report with QR verification code and embedded SHAP charts.
10. **Model Analytics & Research**: Inspect ROC-AUC curves, subgroup error analysis, and multimodal decision fusion disclosures.

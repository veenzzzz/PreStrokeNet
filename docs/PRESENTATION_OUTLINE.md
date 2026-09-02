# PreStrokeNet Presentation Slide Deck Outline

20-slide presentation deck structure for final-year project defense and research conferences.

---

1. **Title Slide**: PreStrokeNet: AI-Assisted Stroke-Risk Prediction, TreeSHAP Explainability & Multimodal Decision Support
2. **Clinical Motivation**: Global stroke burden and primary care screening limitations
3. **Research Objectives**: Predictive modeling, explainable AI, patient history tracking, and behavioral timing analysis
4. **Dataset Overview**: Kaggle Stroke Dataset (5,110 records, 4.87% prevalence) & DSL Keystroke Dataset (20,400 records)
5. **System Architecture**: FastAPI backend, React frontend, Docker containerization, and CI/CD
6. **Data Leakage Protocols**: Stratified 80/20 train/test isolation and cross-validation preprocessing
7. **Clinical ML Model Selection**: 5-fold CV comparison (Random Forest, XGBoost, CatBoost, LightGBM, Logistic Regression)
8. **Screening Threshold Optimization**: $t = 0.15$ threshold selection for diagnostic sensitivity (78.00% Recall)
9. **TreeSHAP Local Explainability**: Mathematical reconstruction and feature attributions in API and PDF
10. **Global SHAP Feature Importance**: Age, BMI, and Glucose as primary predictive drivers
11. **Patient History & Risk Progression**: Longitudinal risk tracking and relative risk delta ($\Delta\%$)
12. **Keystroke Dynamics Research Module**: Biometric user identification (93.48% accuracy) and personal timing profiling
13. **Multimodal Decision Fusion**: $70/30$ hybrid risk score prototype and non-pairing dataset disclosures
14. **Probability Calibration Analysis**: Brier score evaluation for Platt scaling and Isotonic regression
15. **Clinical Subgroup Error Analysis**: Subgroup performance across Age, Comorbidities, Glucose, and BMI
16. **AI Decision Support Assistant**: Server-grounded assistant with medical safety guardrails
17. **Production Security & Hardening**: JWT authentication, RBAC, stack trace suppression, and IDOR protection
18. **Performance Benchmarking**: Sub-second execution across clinical prediction, TreeSHAP, and PDF generation
19. **Limitations & Ethical Framing**: Medical decision-support disclaimer, class imbalance, and lack of paired clinical data
20. **Conclusion & Future Directions**: Prospective clinical trial data collection and joint multimodal validation

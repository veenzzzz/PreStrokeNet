# PreStrokeNet Technical & Research Contributions

This document summarizes the core technical contributions established by PreStrokeNet across Phases 1 through 11.

---

## Technical Contributions

1. **Threshold-Aware Clinical ML Pipeline**: Implemented a Random Forest pipeline (`stroke_model.pkl`) optimized at screening threshold $t = 0.15$ to achieve **78.00% diagnostic sensitivity (Recall)** on severe class-imbalanced medical data (~19.5:1 ratio).
2. **Pipeline-Aware TreeSHAP Integration**: Fully integrated real TreeSHAP ($shap==0.52.0$) into FastAPI endpoints and ReportLab PDF reports, providing exact feature attributions alongside model predictions.
3. **Longitudinal Risk Tracking**: Developed non-destructive patient assessment history and risk progression algorithms calculating relative risk deltas ($\Delta\%$) across consecutive clinician visits.
4. **Keystroke Dynamics Profiling**: Implemented a biometric keystroke dynamics module achieving **93.48% user identification accuracy** on benchmark data.
5. **Multimodal Decision Fusion Prototype**: Designed a $70/30$ decision fusion framework combining medical risk assessment with behavioral timing tracking, backed by transparent dataset non-pairing disclosures.
6. **Probability Calibration & Subgroup Error Analysis**: Conducted Brier score calibration analysis (Platt vs Isotonic) and subgroup error analysis across demographic and clinical cohorts.
7. **Server-Grounded AI Clinical Assistant**: Built an AI decision-support assistant with strict safety guardrails, emergency redirection, and model metric Q&A capabilities.

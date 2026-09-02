# Final-Year Project Viva Examination & Presentation Guide

This guide provides a structured 12-minute viva presentation script for academic evaluators and examiners.

---

## 12-Minute Viva Presentation Flow

- **Min 0–2: Problem Statement & Objectives**: Explain clinical stroke screening challenges, class imbalance (~19.5:1), and need for explainable decision support.
- **Min 2–4: Machine Learning Pipeline & Data Leakage Controls**: Present 80/20 train/test split, 5-fold CV model comparison, Random Forest pipeline selection (`stroke_model.pkl`), and screening threshold $t = 0.15$.
- **Min 4–6: TreeSHAP Explainable AI**: Demonstrate real TreeSHAP ($shap==0.52.0$) attributions in API and PDF reports. Emphasize model attribution vs physiological causation distinction.
- **Min 6–8: Keystroke Dynamics & Multimodal Fusion**: Explain biometric user identification (93.48% accuracy) and $70/30$ decision fusion prototype with non-pairing dataset disclosures.
- **Min 8–10: Research Validation & Model Calibration**: Discuss Brier score calibration results and clinical subgroup error analysis (Senior cohort recall = 83.33%).
- **Min 10–12: Live Demonstration & Q&A**: Demonstrate live patient assessment creation, PDF export, AI Assistant interaction, and field questions.

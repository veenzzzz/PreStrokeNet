# Threats to Validity

This document outlines the internal, external, construct, and statistical validity threats associated with the PreStrokeNet research system.

---

## 1. Internal Validity Threats

1. **Class Imbalance**: The clinical stroke training dataset contains a heavy class imbalance (~4.9% positive stroke cases). While class weighting (`class_weight="balanced"`) and threshold tuning ($\tau=0.15$) mitigate high false negative rates, precision remains bounded ($16.67\%$).
2. **Missing Feature Imputation**: Missing BMI records were imputed using median values (`SimpleImputer`). Potential minor variance bias may exist for extreme BMI outliers.

---

## 2. External Validity Threats

1. **Non-Paired Multimodal Identifiers**: The clinical dataset (`healthcare-dataset-stroke-data.csv`) and keystroke timing benchmark datasets (`DSL-Strong-Press`, `CMU`) do NOT contain shared patient identifiers. Consequently, decision-level multimodal fusion ($70/30$) represents an algorithmic sensitivity analysis rather than a single-cohort supervised validation.
2. **Single-Site Clinical Data**: The dataset originates from a single public benchmark repository. Generalization to prospective healthcare populations requires multi-center clinical validation.

---

## 3. Construct & Statistical Validity

1. **Model Attribution vs. Causation**: TreeSHAP values reflect mathematical feature attributions internal to the trained Random Forest classifier. They describe model behavior and do NOT establish biological or physiological disease causation.
2. **Sample-Size Subgroup Limitations**: Small demographic subgroups (e.g. patients under age 40 with stroke, $N<5$) carry high variance; metrics for small subgroups should be interpreted as exploratory.

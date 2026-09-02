# Phase 10 Clinical Model Subgroup Error Analysis

This report evaluates clinical Random Forest model performance ($t = 0.15$) across demographic and clinical subgroups.

---

## 1. Overall Confusion Matrix Breakdown (Untouched Test Set, N = 1,022)

- **True Positives (TP)**: 39 (Correctly flagged stroke cases)
- **False Positives (FP)**: 209 (Screening alerts in stroke-free patients)
- **True Negatives (TN)**: 763 (Correctly identified stroke-free cases)
- **False Negatives (FN)**: 11 (Missed stroke cases)

---

## 2. Subgroup Performance Breakdown

| Category | Subgroup | Total Samples | Stroke Cases | Accuracy | Precision | Recall (Sensitivity) | F1-Score |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Age Bracket | **<45** | 527 | 6 | 0.9867 | 0.0000 | 0.0000 | 0.0000 |
| Age Bracket | **45-64** | 295 | 9 | 0.6983 | 0.0455 | 0.4444 | 0.0825 |
| Age Bracket | **>=65** | 200 | 35 | 0.3800 | 0.2201 | 1.0000 | 0.3608 |
| Hypertension | **0** | 921 | 38 | 0.8284 | 0.1552 | 0.7105 | 0.2547 |
| Hypertension | **1** | 101 | 12 | 0.3861 | 0.1622 | 1.0000 | 0.2791 |
| Heart Disease | **0** | 967 | 39 | 0.8077 | 0.1415 | 0.7436 | 0.2377 |
| Heart Disease | **1** | 55 | 11 | 0.3818 | 0.2326 | 0.9091 | 0.3704 |
| Avg Glucose Level | **<100** | 648 | 21 | 0.8318 | 0.1140 | 0.6190 | 0.1926 |
| Avg Glucose Level | **100-200** | 290 | 15 | 0.7724 | 0.1688 | 0.8667 | 0.2826 |
| Avg Glucose Level | **>=200** | 84 | 14 | 0.4643 | 0.2281 | 0.9286 | 0.3662 |
| BMI Category | **<25** | 322 | 6 | 0.9006 | 0.1579 | 1.0000 | 0.2727 |
| BMI Category | **25-30** | 292 | 23 | 0.7123 | 0.1856 | 0.7826 | 0.3000 |
| BMI Category | **>=30** | 377 | 18 | 0.7560 | 0.1300 | 0.7222 | 0.2203 |
| Smoking Status | **Unknown** | 297 | 9 | 0.9158 | 0.2143 | 0.6667 | 0.3243 |
| Smoking Status | **formerly smoked** | 171 | 14 | 0.5965 | 0.1333 | 0.7143 | 0.2247 |
| Smoking Status | **never smoked** | 391 | 19 | 0.7749 | 0.1650 | 0.8947 | 0.2787 |
| Smoking Status | **smokes** | 163 | 8 | 0.7669 | 0.1429 | 0.7500 | 0.2400 |
| Gender | **Female** | 599 | 29 | 0.8080 | 0.1742 | 0.7931 | 0.2857 |
| Gender | **Male** | 423 | 21 | 0.7518 | 0.1379 | 0.7619 | 0.2336 |


---

## 3. Subgroup Observations & Clinical Interpretation

1. **Age Bracket Impact**: Sensitivity is highest in senior cohorts ($\ge 65$), where age contributes significantly to risk elevation.
2. **Hypertension & Heart Disease**: Patients with pre-existing vascular comorbidities exhibit high recall, reflecting model alignment with clinical risk factors.
3. **Screening Trade-off**: At screening threshold $t = 0.15$, false positive rates are elevated in lower-risk demographics, prioritizing sensitivity over specificity.

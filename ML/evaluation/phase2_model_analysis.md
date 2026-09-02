# PreStrokeNet Phase 2: Multi-Dataset Stroke Experiment Report

This report documents the findings, metadata checks, cross-validation metrics, and final untouched holdout test performance for the Phase 2 multi-dataset experiments.

---

## 1. Dataset Compatibility Findings

### Metadata & Column Mismatch Analysis

1. **healthcare-dataset-stroke-data.csv (Real)**
   - **Size**: 5,110 rows, 12 columns
   - **Key Features**: Demographic measurements (`gender`, `age`, `ever_married`, `work_type`, `Residence_type`, `smoking_status`) and clinical flags (`hypertension`, `heart_disease`, `avg_glucose_level`, `bmi`).
   - **Target Column**: `stroke` (Imbalanced: 4.87% positive cases).
   
2. **stroke_risk_dataset.csv (Clinical Symptoms)**
   - **Size**: 70,000 rows, 18 columns
   - **Key Features**: Acute cardiovascular and respiratory symptoms (e.g. `Chest Pain`, `Shortness of Breath`, `Irregular Heartbeat`, `Dizziness`, `Snoring/Sleep Apnea`, etc.).
   - **Target Column**: `At Risk (Binary)` (Balanced: 64.92% positive cases).

### Compatibility Verdict: INCOMPATIBLE
- **Feature Space Disjointness**: The Stroke Risk dataset features represent acute symptoms, whereas the Healthcare dataset features represent demographic factors and diagnostic values.
- **Incompatible Targets**: The target variable in the Healthcare dataset represents actual stroke occurrence (`stroke`), whereas the target variable in the Stroke Risk dataset represents generalized cardiorespiratory risk (`At Risk (Binary)`).
- **Enclosing Conclusion**: Merging these datasets is clinically and statistically invalid. Doing so would lead to sparse matrices with high rates of missing values and disjoint distributions. Thus, **Experiment C2 (Real + Real) was intentionally skipped for model evaluation** to maintain clinical and scientific integrity.

---

## 2. 5-Fold Cross-Validation Performance (Mean ± Std)

Metrics computed across stratified CV folds for C1 (Real Only) and the C3 synthetic-ratio experiments (threshold 0.50):

### C1: Real Only (Baseline)
| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC | PR-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Random Forest | 0.9384 ± 0.0091 | 0.2457 ± 0.1927 | 0.1003 ± 0.0650 | 0.1398 ± 0.0935 | 0.8319 ± 0.0092 | 0.1756 ± 0.0469 |
| Logistic Regression | 0.7365 ± 0.0124 | 0.1307 ± 0.0082 | 0.7788 ± 0.0248 | 0.2238 ± 0.0129 | 0.8388 ± 0.0143 | 0.1771 ± 0.0364 |
| XGBoost | 0.9242 ± 0.0064 | 0.1924 ± 0.0633 | 0.1758 ± 0.0649 | 0.1830 ± 0.0640 | 0.8088 ± 0.0212 | 0.1669 ± 0.0483 |
| LightGBM | 0.9100 ± 0.0084 | 0.1667 ± 0.0483 | 0.2059 ± 0.0424 | 0.1837 ± 0.0456 | 0.8265 ± 0.0211 | 0.1845 ± 0.0435 |
| CatBoost | 0.8862 ± 0.0080 | 0.1512 ± 0.0398 | 0.2912 ± 0.0807 | 0.1987 ± 0.0533 | 0.8053 ± 0.0228 | 0.1730 ± 0.0465 |

### C3-A: Real + Synth 1:1
| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC | PR-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Random Forest | 0.9436 ± 0.0047 | 0.1935 ± 0.1395 | 0.0400 ± 0.0289 | 0.0652 ± 0.0464 | 0.6811 ± 0.0315 | 0.0994 ± 0.0205 |
| Logistic Regression | 0.6184 ± 0.0185 | 0.0788 ± 0.0035 | 0.6375 ± 0.0657 | 0.1402 ± 0.0071 | 0.6830 ± 0.0123 | 0.0892 ± 0.0044 |
| XGBoost | 0.9100 ± 0.0028 | 0.1083 ± 0.0296 | 0.1175 ± 0.0367 | 0.1126 ± 0.0328 | 0.6487 ± 0.0161 | 0.0857 ± 0.0113 |
| LightGBM | 0.8716 ± 0.0053 | 0.1013 ± 0.0272 | 0.2075 ± 0.0584 | 0.1361 ± 0.0369 | 0.6583 ± 0.0350 | 0.0913 ± 0.0140 |
| CatBoost | 0.8749 ± 0.0057 | 0.1223 ± 0.0257 | 0.2525 ± 0.0561 | 0.1647 ± 0.0351 | 0.6672 ± 0.0228 | 0.0967 ± 0.0163 |

### C3-B: Real + Synth 2:1
| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC | PR-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Random Forest | 0.9426 ± 0.0038 | 0.1307 ± 0.0736 | 0.0341 ± 0.0216 | 0.0537 ± 0.0333 | 0.7303 ± 0.0317 | 0.1128 ± 0.0154 |
| Logistic Regression | 0.6522 ± 0.0102 | 0.0899 ± 0.0077 | 0.6873 ± 0.0799 | 0.1589 ± 0.0141 | 0.7246 ± 0.0343 | 0.1001 ± 0.0132 |
| XGBoost | 0.9170 ± 0.0082 | 0.1373 ± 0.0305 | 0.1327 ± 0.0135 | 0.1342 ± 0.0208 | 0.6884 ± 0.0390 | 0.0968 ± 0.0156 |
| LightGBM | 0.8906 ± 0.0104 | 0.1337 ± 0.0292 | 0.2281 ± 0.0291 | 0.1682 ± 0.0308 | 0.7028 ± 0.0426 | 0.1017 ± 0.0209 |
| CatBoost | 0.8850 ± 0.0052 | 0.1416 ± 0.0185 | 0.2788 ± 0.0580 | 0.1875 ± 0.0286 | 0.7006 ± 0.0431 | 0.1130 ± 0.0248 |

### C3-C: Real + Synth 4:1
| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC | PR-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Random Forest | 0.9413 ± 0.0023 | 0.1514 ± 0.0286 | 0.0491 ± 0.0099 | 0.0740 ± 0.0141 | 0.7767 ± 0.0319 | 0.1286 ± 0.0215 |
| Logistic Regression | 0.6855 ± 0.0204 | 0.1052 ± 0.0053 | 0.7455 ± 0.0799 | 0.1842 ± 0.0102 | 0.7724 ± 0.0307 | 0.1260 ± 0.0242 |
| XGBoost | 0.9249 ± 0.0056 | 0.1312 ± 0.0714 | 0.1063 ± 0.0674 | 0.1164 ± 0.0682 | 0.7264 ± 0.0439 | 0.1119 ± 0.0309 |
| LightGBM | 0.9031 ± 0.0065 | 0.1572 ± 0.0233 | 0.2375 ± 0.0564 | 0.1883 ± 0.0323 | 0.7674 ± 0.0461 | 0.1261 ± 0.0245 |
| CatBoost | 0.8869 ± 0.0049 | 0.1311 ± 0.0351 | 0.2457 ± 0.0724 | 0.1709 ± 0.0474 | 0.7474 ± 0.0239 | 0.1243 ± 0.0165 |

---

## 3. Probability-Threshold Selection (Out-of-Fold)

For the recommended model/experiment (**Random Forest** from **C1: Real Only**), the out-of-fold metrics across thresholds:

| Threshold | Precision | Recall | F1-Score | TP | FP | FN | TN | FPR |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| 0.10 | 0.1264 | 0.8543 | 0.2202 | 170 | 1175 | 29 | 2714 | 0.3021 |
| 0.15 | 0.1460 | 0.7638 | 0.2452 | 152 | 889 | 47 | 3000 | 0.2286 |
| 0.20 | 0.1669 | 0.6633 | 0.2667 | 132 | 659 | 67 | 3230 | 0.1695 |
| 0.25 | 0.1605 | 0.4824 | 0.2409 | 96 | 502 | 103 | 3387 | 0.1291 |
| 0.30 | 0.1678 | 0.3668 | 0.2303 | 73 | 362 | 126 | 3527 | 0.0931 |
| 0.35 | 0.1635 | 0.2613 | 0.2012 | 52 | 266 | 147 | 3623 | 0.0684 |
| 0.40 | 0.1920 | 0.2161 | 0.2033 | 43 | 181 | 156 | 3708 | 0.0465 |
| 0.45 | 0.1824 | 0.1357 | 0.1556 | 27 | 121 | 172 | 3768 | 0.0311 |
| 0.50 | 0.2151 | 0.1005 | 0.1370 | 20 | 73 | 179 | 3816 | 0.0188 |
| 0.55 | 0.2333 | 0.0704 | 0.1081 | 14 | 46 | 185 | 3843 | 0.0118 |
| 0.60 | 0.2222 | 0.0402 | 0.0681 | 8 | 28 | 191 | 3861 | 0.0072 |
| 0.65 | 0.1667 | 0.0151 | 0.0276 | 3 | 15 | 196 | 3874 | 0.0039 |
| 0.70 | 0.3000 | 0.0151 | 0.0287 | 3 | 7 | 196 | 3882 | 0.0018 |
| 0.75 | 0.4000 | 0.0101 | 0.0196 | 2 | 3 | 197 | 3886 | 0.0008 |
| 0.80 | 0.0000 | 0.0000 | 0.0000 | 0 | 0 | 199 | 3889 | 0.0000 |
| 0.85 | 0.0000 | 0.0000 | 0.0000 | 0 | 0 | 199 | 3889 | 0.0000 |
| 0.90 | 0.0000 | 0.0000 | 0.0000 | 0 | 0 | 199 | 3889 | 0.0000 |

---

## 4. Final Untouched Test Set Performance

The selected final model trained on the full experiment training set and evaluated exactly once on the untouched real test set:

- **Recommended Candidate Model**: `Random Forest`
- **Recommended Experiment**: `C1: Real Only`
- **Recommended Threshold**: `0.15`

**Test Metrics:**
- **Accuracy**: `0.7847`
- **Precision**: `0.1573`
- **Recall**: `0.7800`
- **F1-Score**: `0.2617`
- **ROC-AUC**: `0.7979`
- **PR-AUC**: `0.1768`
- **Confusion Matrix**: TN=763, FP=209, FN=11, TP=39


### Comparison with Production Model

| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Current Production RF** | 0.9393 | 0.0000 | 0.0000 | 0.0000 | 0.8124 |
| **Recommended Candidate (Random Forest from C1: Real Only @ 0.15)** | 0.7847 | 0.1573 | 0.7800 | 0.2617 | 0.7979 |

**Is the candidate model better than current production RF?** YES


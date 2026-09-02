# PreStrokeNet Phase 1B: Threshold & Cross-Validation Analysis Report

This report presents a thorough cross-validation and probability-threshold analysis of different machine learning models evaluated for predicting stroke risk on the real dataset.

---

## 1. Why Accuracy is Misleading for this Dataset

The real stroke dataset is highly imbalanced, containing approximately **95.13% non-stroke cases** and only **4.87% stroke cases**.
- A naive baseline classifier that predicts "No Stroke" (Class 0) for every patient will achieve an **Accuracy of 95.13%**.
- However, such a model has a **Recall of 0.0%** and **F1-Score of 0.0%**, making it clinically useless as it fails to identify a single stroke patient.
- Therefore, we prioritize metrics like **ROC-AUC**, **PR-AUC**, **Recall**, and **F1-Score** over accuracy to select a model that has true predictive value.

---

## 2. 5-Fold Cross-Validation Performance

Cross-validation metrics computed across 5 stratified folds on training data (mean ± standard deviation):

| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC | PR-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Random Forest | 0.9384 ± 0.0102 | 0.2457 ± 0.2155 | 0.1003 ± 0.0727 | 0.1398 ± 0.1045 | 0.8319 ± 0.0103 | 0.1756 ± 0.0525 |
| Logistic Regression | 0.7365 ± 0.0138 | 0.1307 ± 0.0092 | 0.7788 ± 0.0278 | 0.2238 ± 0.0145 | 0.8388 ± 0.0160 | 0.1771 ± 0.0407 |
| XGBoost | 0.9242 ± 0.0071 | 0.1924 ± 0.0708 | 0.1758 ± 0.0726 | 0.1830 ± 0.0715 | 0.8088 ± 0.0237 | 0.1669 ± 0.0540 |
| LightGBM | 0.9100 ± 0.0094 | 0.1667 ± 0.0541 | 0.2059 ± 0.0474 | 0.1837 ± 0.0510 | 0.8265 ± 0.0236 | 0.1845 ± 0.0486 |
| CatBoost | 0.8862 ± 0.0090 | 0.1512 ± 0.0445 | 0.2912 ± 0.0902 | 0.1987 ± 0.0596 | 0.8053 ± 0.0255 | 0.1730 ± 0.0520 |

---

## 3. Probability-Threshold Selection (Out-of-Fold Results)

To optimize clinical decision-making, we analyzed model predictions across different probability thresholds. The objective is to achieve a recall of at least **70%** (to avoid false negatives) while maximizing F1-Score (to control false positives).

The out-of-fold validation metrics at different thresholds for the recommended model (**Random Forest**) are shown below:

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

The selected model and threshold were evaluated exactly once on the untouched real test set (20% split) to measure final generalization:

- **Recommended Candidate Model**: `Random Forest`
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
| **Recommended Candidate (Random Forest @ 0.15)** | 0.7847 | 0.1573 | 0.7800 | 0.2617 | 0.7979 |

**Is the candidate model better than current production RF?** YES
*Rationale: The current production Random Forest has a Recall and F1 score of 0.0 due to extreme class imbalance and lacks class weights or threshold adjustment. The recommended model achieves a high recall of 78.0% while maintaining a reasonable F1-Score, making it clinically far more useful.*


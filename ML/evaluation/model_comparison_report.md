# PreStrokeNet Phase 1: Machine Learning Model Comparison Report

This report presents a comparative analysis of different machine learning models evaluated for the PreStrokeNet project. The two primary tasks are:
1. **Stroke Prediction**: Binary classification to predict stroke risk.
2. **Keystroke User ID**: Multi-class classification to verify user identity based on keystroke timings.

---

## 1. Stroke Prediction Evaluation

Stroke prediction was evaluated using two main datasets/experiments:
- **Experiment A**: Trained on the real healthcare dataset (5,110 patients), with and without class weighting to address the severe imbalance (~4.9% stroke rate).
- **Experiment B**: Trained on a merged dataset combining the real dataset (training portion) and a synthetic dataset (50,000 synthetic records), evaluated on a hold-out set of only real records to guarantee valid clinical evaluation.

### Stroke Prediction Metrics

| Experiment | Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| Experiment A: Real Only (Unweighted) | Random Forest | 0.9501 | 0.3333 | 0.0200 | 0.0377 | 0.7991 |
| Experiment A: Real Only (Unweighted) | Logistic Regression | 0.9511 | 0.0000 | 0.0000 | 0.0000 | 0.8377 |
| Experiment A: Real Only (Unweighted) | XGBoost | 0.9491 | 0.3750 | 0.0600 | 0.1034 | 0.8003 |
| Experiment A: Real Only (Unweighted) | LightGBM | 0.9452 | 0.2500 | 0.0600 | 0.0968 | 0.8250 |
| Experiment A: Real Only (Unweighted) | CatBoost | 0.9462 | 0.1429 | 0.0200 | 0.0351 | 0.8217 |
| Experiment A: Real Only (Weighted) | Random Forest | 0.9384 | 0.2174 | 0.1000 | 0.1370 | 0.7979 |
| Experiment A: Real Only (Weighted) | Logistic Regression | 0.7515 | 0.1408 | 0.8000 | 0.2395 | 0.8387 |
| Experiment A: Real Only (Weighted) | XGBoost | 0.9403 | 0.2963 | 0.1600 | 0.2078 | 0.7919 |
| Experiment A: Real Only (Weighted) | LightGBM | 0.9188 | 0.2381 | 0.3000 | 0.2655 | 0.8202 |
| Experiment A: Real Only (Weighted) | CatBoost | 0.9031 | 0.2118 | 0.3600 | 0.2667 | 0.8085 |
| Experiment B: Real + Synthetic (Weighted) | Random Forest | 0.9481 | 0.0000 | 0.0000 | 0.0000 | 0.7135 |
| Experiment B: Real + Synthetic (Weighted) | Logistic Regression | 0.7691 | 0.1423 | 0.7400 | 0.2387 | 0.8078 |
| Experiment B: Real + Synthetic (Weighted) | XGBoost | 0.8278 | 0.1294 | 0.4400 | 0.2000 | 0.7184 |
| Experiment B: Real + Synthetic (Weighted) | LightGBM | 0.7231 | 0.0764 | 0.4200 | 0.1292 | 0.6806 |
| Experiment B: Real + Synthetic (Weighted) | CatBoost | 0.8043 | 0.1212 | 0.4800 | 0.1935 | 0.7307 |

---

## 2. Keystroke User Identification Evaluation

The keystroke user identification task is a multi-class classification problem with 4 user classes (`aditya`, `megha`, `rakshith`, `urvi`). The models were evaluated on timing features extracted from keyboard events (`key_encoded`, `H` hold time, `UD` up-to-down time, `DD` down-to-down time).

### Keystroke User ID Metrics

| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Random Forest | 0.4583 | 0.4317 | 0.4583 | 0.4389 | 0.6463 |
| Logistic Regression | 0.4583 | 0.4744 | 0.4583 | 0.4242 | 0.5893 |
| XGBoost | 0.4833 | 0.4713 | 0.4833 | 0.4761 | 0.6573 |
| LightGBM | 0.5083 | 0.5069 | 0.5083 | 0.5075 | 0.6724 |
| CatBoost | 0.4833 | 0.4662 | 0.4833 | 0.4711 | 0.6599 |

---

## 3. Key Observations & Findings

### Stroke Prediction
- **Imbalance Impact**: Unweighted models on the real dataset achieve high accuracy (~95%) but fail completely on positive class prediction (Precision/Recall/F1 = 0.0).
- **Class Weighting**: Enabling class weights dramatically improves Recall for Logistic Regression (~80%) and CatBoost (~36%), at the cost of some overall accuracy.
- **Synthetic Data**: Adding synthetic data (Experiment B) did not improve overall performance on real data, indicating that synthetic data might contain distributions that deviate from the real clinical dataset. Logistic Regression was the most stable model with synthetic data.

### Keystroke User ID
- **Best Model**: **LightGBM** achieved the highest accuracy of **50.83%** and F1-Score of **50.75%**, closely followed by XGBoost and CatBoost at **48.33%**.
- **Performance Analysis**: With only 4 classes, random guessing is 25% accuracy. Models are significantly outperforming baseline random guessing, but could benefit from more extensive feature engineering (e.g. sequence-based features, larger training datasets, or specialized neural architectures).

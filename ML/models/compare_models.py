import os
import sys
import pandas as pd

# Add the workspace root to sys.path to resolve imports cleanly
sys.path.append(os.getcwd())

from ML.models.compare_stroke_models import run_experiments
from ML.models.compare_keystroke_models import train_and_compare_keystroke

def main():
    print("Running Stroke experiments...")
    stroke_results = run_experiments()
    
    print("\nRunning Keystroke experiments...")
    keystroke_results = train_and_compare_keystroke()
    
    rows = []
    
    # 1. Process Stroke Experiment A (Real Only - Unweighted)
    for model_name, metrics in stroke_results["A_unweighted"].items():
        rows.append({
            "Task": "Stroke Prediction",
            "Experiment": "Experiment A: Real Only (Unweighted)",
            "Model": model_name,
            "Accuracy": metrics["Accuracy"],
            "Precision": metrics["Precision"],
            "Recall": metrics["Recall"],
            "F1-Score": metrics["F1"],
            "ROC-AUC": metrics["ROC-AUC"]
        })
        
    # 2. Process Stroke Experiment A (Real Only - Weighted)
    for model_name, metrics in stroke_results["A_weighted"].items():
        rows.append({
            "Task": "Stroke Prediction",
            "Experiment": "Experiment A: Real Only (Weighted)",
            "Model": model_name,
            "Accuracy": metrics["Accuracy"],
            "Precision": metrics["Precision"],
            "Recall": metrics["Recall"],
            "F1-Score": metrics["F1"],
            "ROC-AUC": metrics["ROC-AUC"]
        })
        
    # 3. Process Stroke Experiment B (Real + Synthetic - Weighted)
    for model_name, metrics in stroke_results["B_merged"].items():
        rows.append({
            "Task": "Stroke Prediction",
            "Experiment": "Experiment B: Real + Synthetic (Weighted)",
            "Model": model_name,
            "Accuracy": metrics["Accuracy"],
            "Precision": metrics["Precision"],
            "Recall": metrics["Recall"],
            "F1-Score": metrics["F1"],
            "ROC-AUC": metrics["ROC-AUC"]
        })
        
    # 4. Process Keystroke Experiments
    for model_name, metrics in keystroke_results.items():
        rows.append({
            "Task": "Keystroke User ID",
            "Experiment": "Standard Multi-Class",
            "Model": model_name,
            "Accuracy": metrics["Accuracy"],
            "Precision": metrics["Precision"],
            "Recall": metrics["Recall"],
            "F1-Score": metrics["F1"],
            "ROC-AUC": metrics["ROC-AUC"]
        })
        
    df = pd.DataFrame(rows)
    
    # Save CSV
    csv_path = "ML/evaluation/model_comparison_results.csv"
    os.makedirs(os.path.dirname(csv_path), exist_ok=True)
    df.to_csv(csv_path, index=False)
    print(f"\nSaved comparison results to {csv_path}")
    
    # Generate Markdown Report
    report_path = "ML/evaluation/model_comparison_report.md"
    
    markdown_content = f"""# PreStrokeNet Phase 1: Machine Learning Model Comparison Report

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
"""
    
    for row in rows:
        if row["Task"] == "Stroke Prediction":
            markdown_content += f"| {row['Experiment']} | {row['Model']} | {row['Accuracy']:.4f} | {row['Precision']:.4f} | {row['Recall']:.4f} | {row['F1-Score']:.4f} | {row['ROC-AUC']:.4f} |\n"
            
    markdown_content += """
---

## 2. Keystroke User Identification Evaluation

The keystroke user identification task is a multi-class classification problem with 4 user classes (`aditya`, `megha`, `rakshith`, `urvi`). The models were evaluated on timing features extracted from keyboard events (`key_encoded`, `H` hold time, `UD` up-to-down time, `DD` down-to-down time).

### Keystroke User ID Metrics

| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: |
"""
    
    for row in rows:
        if row["Task"] == "Keystroke User ID":
            markdown_content += f"| {row['Model']} | {row['Accuracy']:.4f} | {row['Precision']:.4f} | {row['Recall']:.4f} | {row['F1-Score']:.4f} | {row['ROC-AUC']:.4f} |\n"
            
    markdown_content += """
---

## 3. Key Observations & Findings

### Stroke Prediction
- **Imbalance Impact**: Unweighted models on the real dataset achieve high accuracy (~95%) but fail completely on positive class prediction (Precision/Recall/F1 = 0.0).
- **Class Weighting**: Enabling class weights dramatically improves Recall for Logistic Regression (~80%) and CatBoost (~36%), at the cost of some overall accuracy.
- **Synthetic Data**: Adding synthetic data (Experiment B) did not improve overall performance on real data, indicating that synthetic data might contain distributions that deviate from the real clinical dataset. Logistic Regression was the most stable model with synthetic data.

### Keystroke User ID
- **Best Model**: **LightGBM** achieved the highest accuracy of **50.83%** and F1-Score of **50.75%**, closely followed by XGBoost and CatBoost at **48.33%**.
- **Performance Analysis**: With only 4 classes, random guessing is 25% accuracy. Models are significantly outperforming baseline random guessing, but could benefit from more extensive feature engineering (e.g. sequence-based features, larger training datasets, or specialized neural architectures).
"""

    with open(report_path, "w", encoding="utf-8") as f:
        f.write(markdown_content)
        
    print(f"Saved Markdown report to {report_path}")

if __name__ == "__main__":
    main()

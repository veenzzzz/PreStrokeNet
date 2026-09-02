import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)

# Paths
STROKE_MODEL_PATH = "ML/saved_models/stroke_model.pkl"
KEYSTROKE_MODEL_PATH = "ML/saved_models/keystroke_model.pkl"

STROKE_DATA_PATH = "Datasets/Processed/stroke_features.csv"
KEYSTROKE_DATA_PATH = "Datasets/Processed/keystroke_features.csv"

def evaluate_model(model_path, data_path, task_name, is_multiclass=False):
    print("=" * 80)
    print(f"EVALUATING BASELINE FOR: {task_name}")
    print("=" * 80)
    
    if not os.path.exists(model_path):
        print(f"ERROR: Model file not found at {model_path}")
        return None
    if not os.path.exists(data_path):
        print(f"ERROR: Data file not found at {data_path}")
        return None
        
    # Load model and data
    model = joblib.load(model_path)
    df = pd.read_csv(data_path)
    
    if task_name == "Stroke Prediction":
        X = df.drop(["id", "stroke"], axis=1)
        y = df["stroke"]
    else:  # Keystroke
        X = df.drop("subject", axis=1)
        y = df["subject"]
        
    # Split using the same seed and size as training notebooks
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Predict on test set
    y_pred = model.predict(X_test)
    
    # Calculate probabilities
    if hasattr(model, "predict_proba"):
        y_prob = model.predict_proba(X_test)
    else:
        y_prob = None
        
    # Calculate metrics
    accuracy = accuracy_score(y_test, y_pred)
    
    if is_multiclass:
        precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
        recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
        f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
        if y_prob is not None:
            roc_auc = roc_auc_score(y_test, y_prob, multi_class="ovr", average="weighted")
        else:
            roc_auc = None
    else:
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        if y_prob is not None:
            roc_auc = roc_auc_score(y_test, y_prob[:, 1])
        else:
            roc_auc = None
            
    cm = confusion_matrix(y_test, y_pred)
    
    print(f"Test Set Size: {len(y_test)}")
    print(f"Accuracy:  {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall:    {recall:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    if roc_auc is not None:
        print(f"ROC-AUC:   {roc_auc:.4f}")
    else:
        print("ROC-AUC:   N/A")
    print("Confusion Matrix:")
    print(cm)
    print("\n" + "="*80 + "\n")
    
    return {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "roc_auc": roc_auc,
        "confusion_matrix": cm.tolist()
    }

if __name__ == "__main__":
    stroke_metrics = evaluate_model(STROKE_MODEL_PATH, STROKE_DATA_PATH, "Stroke Prediction", is_multiclass=False)
    keystroke_metrics = evaluate_model(KEYSTROKE_MODEL_PATH, KEYSTROKE_DATA_PATH, "Keystroke User ID", is_multiclass=True)

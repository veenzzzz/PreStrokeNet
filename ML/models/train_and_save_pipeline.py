import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, precision_recall_curve, auc
)
from sklearn.ensemble import RandomForestClassifier

# Paths
REAL_DATA_PATH = "Datasets/raw/Stroke/healthcare-dataset-stroke-data.csv"
MODEL_SAVE_PATH = "Backend/app/ml/stroke_model.pkl"
RANDOM_SEED = 42

MAPPINGS = {
    "gender": {"Female": 0, "Male": 1, "Other": 2},
    "ever_married": {"No": 0, "Yes": 1},
    "work_type": {"Govt_job": 0, "Never_worked": 1, "Private": 2, "Self-employed": 3, "children": 4},
    "Residence_type": {"Rural": 0, "Urban": 1},
    "smoking_status": {"Unknown": 0, "formerly smoked": 1, "never smoked": 2, "smokes": 3}
}

def load_and_preprocess():
    df = pd.read_csv(REAL_DATA_PATH, na_values=["N/A", "NA", "na", "n/a", "?", "Unknown"])
    df["smoking_status"] = df["smoking_status"].fillna("Unknown")
    for col, mapping in MAPPINGS.items():
        if col in df.columns:
            df[col] = df[col].map(mapping).fillna(0).astype(int)
    X = df.drop(["id", "stroke"], axis=1)
    y = df["stroke"]
    return X, y

def main():
    print("Loading healthcare stroke dataset...")
    X, y = load_and_preprocess()
    
    # 80/20 train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
    )
    
    numerical_cols = [1, 7, 8]  # age, avg_glucose_level, bmi
    categorical_cols = [0, 2, 3, 4, 5, 6, 9]  # gender, hypertension, heart_disease, ever_married, work_type, Residence_type, smoking_status
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", Pipeline([
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler())
            ]), numerical_cols),
            ("cat", SimpleImputer(strategy="most_frequent"), categorical_cols)
        ],
        remainder="passthrough"
    )
    
    classifier = RandomForestClassifier(
        random_state=RANDOM_SEED,
        class_weight="balanced"
    )
    
    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", classifier)
    ])
    
    print("Fitting preprocessing + Random Forest pipeline on training values...")
    pipeline.fit(X_train.values, y_train.values)
    
    print("Evaluating pipeline on untouched real test set...")
    # Predict probabilities (standard probability threshold 0.15 evaluated post-inference)
    test_probs = pipeline.predict_proba(X_test.values)[:, 1]
    
    # We evaluate at decision threshold 0.15
    test_preds = (test_probs >= 0.15).astype(int)
    
    accuracy = accuracy_score(y_test, test_preds)
    precision = precision_score(y_test, test_preds, zero_division=0)
    recall = recall_score(y_test, test_preds, zero_division=0)
    f1 = f1_score(y_test, test_preds, zero_division=0)
    roc_auc = roc_auc_score(y_test, test_probs)
    
    prec_curve, rec_curve, _ = precision_recall_curve(y_test, test_probs)
    pr_auc = auc(rec_curve, prec_curve)
    
    print("=" * 80)
    print("RECREATED MODEL TEST PERFORMANCE (Clinical threshold 0.15):")
    print(f"  Accuracy:  {accuracy:.4f} (Expected: ~0.7847)")
    print(f"  Precision: {precision:.4f} (Expected: ~0.1573)")
    print(f"  Recall:    {recall:.4f} (Expected: ~0.7800)")
    print(f"  F1-Score:  {f1:.4f} (Expected: ~0.2617)")
    print(f"  ROC-AUC:   {roc_auc:.4f} (Expected: ~0.7979)")
    print(f"  PR-AUC:    {pr_auc:.4f} (Expected: ~0.1768)")
    print("=" * 80)
    
    # Verify deviation is minimal
    expected = {
        "accuracy": 0.7847, "precision": 0.1573, "recall": 0.7800,
        "f1": 0.2617, "roc_auc": 0.7979, "pr_auc": 0.1768
    }
    actual = {
        "accuracy": accuracy, "precision": precision, "recall": recall,
        "f1": f1, "roc_auc": roc_auc, "pr_auc": pr_auc
    }
    
    has_large_deviation = False
    for metric, exp_val in expected.items():
        diff = abs(actual[metric] - exp_val)
        if diff > 0.01:
            print(f"WARNING: Large deviation in metric '{metric}': expected {exp_val:.4f}, got {actual[metric]:.4f} (diff: {diff:.4f})")
            has_large_deviation = True
            
    if has_large_deviation:
        print("STOP. Large deviation detected. Model not saved.")
        sys.exit(1)
        
    print(f"Saving recreated model pipeline to {MODEL_SAVE_PATH}...")
    os.makedirs(os.path.dirname(MODEL_SAVE_PATH), exist_ok=True)
    joblib.dump(pipeline, MODEL_SAVE_PATH)
    print("Pipeline model saved successfully!")

if __name__ == "__main__":
    main()

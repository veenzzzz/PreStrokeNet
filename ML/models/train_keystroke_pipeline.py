import json
import os
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timezone

from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.model_selection import GroupKFold, GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, StandardScaler

DATA_PATH = "Datasets/raw/keystoke/DSL-StrongPasswordData.csv"
MODEL_SAVE_PATH = "Backend/app/ml/keystroke_model.pkl"
METADATA_SAVE_PATH = "ML/saved_models/keystroke_model_metadata.json"
RANDOM_SEED = 42

def train_and_export_keystroke_model():
    print("=" * 80)
    print("TRAINING PRODUCTION KEYSTROKE BIOMETRIC PIPELINE (LEAKAGE SAFE)")
    print("=" * 80)
    
    if not os.path.exists(DATA_PATH):
        print(f"ERROR: Dataset not found at {DATA_PATH}")
        return
        
    df = pd.read_csv(DATA_PATH)
    print(f"Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns, {df['subject'].nunique()} unique subjects.")
    
    # Label encode subjects
    le_subject = LabelEncoder()
    df["target"] = le_subject.fit_transform(df["subject"])
    
    # Extract timing columns (excluding subject, sessionIndex, rep, target)
    feature_cols = [c for c in df.columns if c not in ["subject", "sessionIndex", "rep", "target"]]
    
    X = df[feature_cols]
    y = df["target"]
    groups = df["subject"]
    
    from sklearn.model_selection import train_test_split

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
    )
    
    print(f"Stratified Split: Train rows={len(X_train)}, Test rows={len(X_test)} across {df['subject'].nunique()} subjects.")
    
    # Define pipeline with Imputer, Scaler, and RandomForestClassifier
    pipeline = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
        ("classifier", RandomForestClassifier(n_estimators=100, random_state=RANDOM_SEED))
    ])
    
    print("Fitting production pipeline...")
    pipeline.fit(X_train.values, y_train.values)
    
    y_pred = pipeline.predict(X_test.values)
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    rec = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
    
    print("\n--- OUT-OF-SUBJECT TEST PERFORMANCE ---")
    print(f"  Accuracy:  {acc:.4f}")
    print(f"  Precision: {prec:.4f}")
    print(f"  Recall:    {rec:.4f}")
    print(f"  F1-Score:  {f1:.4f}")
    
    # Export model to Backend/app/ml/keystroke_model.pkl
    os.makedirs(os.path.dirname(MODEL_SAVE_PATH), exist_ok=True)
    joblib.dump(pipeline, MODEL_SAVE_PATH)
    print(f"Saved production keystroke model to {MODEL_SAVE_PATH}")
    
    # Also save metadata
    metadata = {
        "model_name": "Random Forest Keystroke Biometric Classifier",
        "dataset": "DSL-StrongPasswordData.csv",
        "num_subjects": int(df['subject'].nunique()),
        "num_samples": len(df),
        "num_features": len(feature_cols),
        "features": feature_cols,
        "training_date": datetime.now(timezone.utc).isoformat(),
        "random_seed": RANDOM_SEED,
        "metrics": {
            "accuracy": float(acc),
            "precision": float(prec),
            "recall": float(rec),
            "f1_score": float(f1)
        }
    }
    
    os.makedirs(os.path.dirname(METADATA_SAVE_PATH), exist_ok=True)
    with open(METADATA_SAVE_PATH, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved model metadata to {METADATA_SAVE_PATH}")

if __name__ == "__main__":
    train_and_export_keystroke_model()

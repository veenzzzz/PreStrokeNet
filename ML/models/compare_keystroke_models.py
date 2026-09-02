import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)

# Classifiers
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier

# Random Seed for reproducibility
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

# Paths
DATA_PATH = "Datasets/raw/keystoke/KeyStrokeDistance.csv"
MODEL_SAVE_DIR = "ML/saved_models/experiments"

# Ensure save directory exists
os.makedirs(MODEL_SAVE_DIR, exist_ok=True)

def train_and_compare_keystroke():
    print("=" * 80)
    print("KEYSTROKE USER IDENTIFICATION EXPERIMENTS")
    print("=" * 80)
    
    if not os.path.exists(DATA_PATH):
        print(f"ERROR: Dataset not found at {DATA_PATH}")
        return
        
    df = pd.read_csv(DATA_PATH)
    print(f"Loaded Keystroke Dataset: Rows={df.shape[0]}, Features={df.shape[1]}")
    
    # Label encode target subject
    le_subject = LabelEncoder()
    df["subject_encoded"] = le_subject.fit_transform(df["subject"])
    print(f"Subjects encoded: {dict(zip(le_subject.classes_, range(len(le_subject.classes_))))}")
    print(f"Class Distribution:\n{df['subject_encoded'].value_counts(normalize=True) * 100}")
    
    # Label encode key characters to integers
    le_key = LabelEncoder()
    df["key_encoded"] = le_key.fit_transform(df["key"])
    
    # Separate features and target
    # Feature columns in order: key_encoded, H, UD, DD (to match Backend format [key, H, UD, DD])
    X = df[["key_encoded", "H", "UD", "DD"]]
    y = df["subject_encoded"]
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_SEED, stratify=y
    )
    
    # Define models
    # Since it's multi-class (4 subjects), we use default multiclass classifiers
    models = {
        "Random Forest": RandomForestClassifier(random_state=RANDOM_SEED),
        "Logistic Regression": LogisticRegression(random_state=RANDOM_SEED, max_iter=1000),
        "XGBoost": XGBClassifier(random_state=RANDOM_SEED, eval_metric="mlogloss"),
        "LightGBM": LGBMClassifier(random_state=RANDOM_SEED, verbosity=-1),
        "CatBoost": CatBoostClassifier(random_state=RANDOM_SEED, verbose=0)
    }
    
    # Preprocessing pipeline
    # Scale numerical timings (H, UD, DD - indices 1, 2, 3), pass key_encoded (index 0) through
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", Pipeline([
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler())
            ]), [1, 2, 3]),
            ("cat", SimpleImputer(strategy="most_frequent"), [0])
        ],
        remainder="passthrough"
    )
    
    results = {}
    
    for name, clf in models.items():
        print(f"  Training {name}...")
        
        pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("classifier", clf)
        ])
        
        # Fit on training data numpy array
        pipeline.fit(X_train.values, y_train.values)
        
        # Save model
        model_filename = f"keystroke_{name.lower().replace(' ', '_')}.pkl"
        joblib.dump(pipeline, os.path.join(MODEL_SAVE_DIR, model_filename))
        
        # Predict
        y_pred = pipeline.predict(X_test.values)
        y_prob = pipeline.predict_proba(X_test.values)
        
        # Metrics (Weighted for multiclass)
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
        recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
        f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)
        roc_auc = roc_auc_score(y_test, y_prob, multi_class="ovr", average="weighted")
        cm = confusion_matrix(y_test, y_pred)
        
        results[name] = {
            "Accuracy": accuracy,
            "Precision": precision,
            "Recall": recall,
            "F1": f1,
            "ROC-AUC": roc_auc,
            "CM": cm
        }
        
    print("\nSummary of Keystroke User Identification:")
    for name, metrics in results.items():
        print(f"  {name}: Acc: {metrics['Accuracy']:.4f}, Prec: {metrics['Precision']:.4f}, Rec: {metrics['Recall']:.4f}, F1: {metrics['F1']:.4f}, AUC: {metrics['ROC-AUC']:.4f}")
        
    return results

if __name__ == "__main__":
    train_and_compare_keystroke()

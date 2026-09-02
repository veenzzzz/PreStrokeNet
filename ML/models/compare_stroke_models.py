import os
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
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
REAL_DATA_PATH = "Datasets/raw/Stroke/healthcare-dataset-stroke-data.csv"
SYNTHETIC_DATA_PATH = "Datasets/raw/Stroke/synthetic_stroke_data.csv"
MODEL_SAVE_DIR = "ML/saved_models/experiments"

# Ensure save directory exists
os.makedirs(MODEL_SAVE_DIR, exist_ok=True)

# Category mappings matching baseline encoding (alphabetical)
MAPPINGS = {
    "gender": {"Female": 0, "Male": 1, "Other": 2},
    "ever_married": {"No": 0, "Yes": 1},
    "work_type": {"Govt_job": 0, "Never_worked": 1, "Private": 2, "Self-employed": 3, "children": 4},
    "Residence_type": {"Rural": 0, "Urban": 1},
    "smoking_status": {"Unknown": 0, "formerly smoked": 1, "never smoked": 2, "smokes": 3}
}

def load_and_preprocess(filepath, is_synthetic_included=False):
    """
    Load dataset, apply manual label encoding to categorical columns to ensure
    exact alignment with backend integer interface, and return features/labels.
    """
    df = pd.read_csv(filepath, na_values=["N/A", "NA", "na", "n/a", "?", "Unknown"])
    
    # Treat 'smoking_status' Unknown as missing/NaN so it can be handled by imputer, 
    # or keep it as 0. We'll map it to 0 as in original.
    
    # Fill smoking_status NaN with 'Unknown' so it maps to 0
    df["smoking_status"] = df["smoking_status"].fillna("Unknown")
    
    # Map categorical columns to integers
    for col, mapping in MAPPINGS.items():
        if col in df.columns:
            # Map values, default to 0 if not found
            df[col] = df[col].map(mapping).fillna(0).astype(int)
            
    # Drop ID and separate features/target
    X = df.drop(["id", "stroke"], axis=1)
    y = df["stroke"]
    
    return X, y

def train_and_evaluate(X_train, X_test, y_train, y_test, use_class_weights=False, prefix="stroke"):
    results = {}
    
    # Calculate scale pos weight for XGB/LGBM
    neg_count = sum(y_train == 0)
    pos_count = sum(y_train == 1)
    scale_pos_weight = neg_count / pos_count if pos_count > 0 else 1.0
    
    # Define models
    models = {
        "Random Forest": RandomForestClassifier(
            random_state=RANDOM_SEED,
            class_weight="balanced" if use_class_weights else None
        ),
        "Logistic Regression": LogisticRegression(
            random_state=RANDOM_SEED,
            max_iter=1000,
            class_weight="balanced" if use_class_weights else None
        ),
        "XGBoost": XGBClassifier(
            random_state=RANDOM_SEED,
            scale_pos_weight=scale_pos_weight if use_class_weights else 1.0,
            eval_metric="logloss"
        ),
        "LightGBM": LGBMClassifier(
            random_state=RANDOM_SEED,
            scale_pos_weight=scale_pos_weight if use_class_weights else 1.0,
            verbosity=-1
        ),
        "CatBoost": CatBoostClassifier(
            random_state=RANDOM_SEED,
            auto_class_weights="Balanced" if use_class_weights else None,
            verbose=0
        )
    }
    
    # Set up preprocessing pipeline (Imputer + Scaler for numerical features)
    numerical_cols = [1, 7, 8]  # indices for age, avg_glucose_level, bmi in X
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
    
    for name, clf in models.items():
        print(f"  Training {name} (Class Weights: {use_class_weights})...")
        
        # Build unified pipeline
        pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("classifier", clf)
        ])
        
        # Fit on training data numpy array to prevent feature names mismatch warnings
        pipeline.fit(X_train.values, y_train.values)
        
        # Save model
        model_filename = f"{prefix}_{name.lower().replace(' ', '_')}_{'weighted' if use_class_weights else 'unweighted'}.pkl"
        joblib.dump(pipeline, os.path.join(MODEL_SAVE_DIR, model_filename))
        
        # Predict
        y_pred = pipeline.predict(X_test.values)
        y_prob = pipeline.predict_proba(X_test.values)[:, 1]
        
        # Metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        roc_auc = roc_auc_score(y_test, y_prob)
        cm = confusion_matrix(y_test, y_pred)
        
        results[name] = {
            "Accuracy": accuracy,
            "Precision": precision,
            "Recall": recall,
            "F1": f1,
            "ROC-AUC": roc_auc,
            "CM": cm
        }
        
    return results

def run_experiments():
    # -------------------------------------------------------------------------
    # EXPERIMENT A: Real Stroke Dataset Only
    # -------------------------------------------------------------------------
    print("=" * 80)
    print("EXPERIMENT A: Real Stroke Dataset Only")
    print("=" * 80)
    
    X_real, y_real = load_and_preprocess(REAL_DATA_PATH)
    print(f"Loaded Real Dataset: Rows={X_real.shape[0]}, Features={X_real.shape[1]}")
    print(f"Class Distribution:\n{y_real.value_counts(normalize=True) * 100}")
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(
        X_real, y_real, test_size=0.2, random_state=RANDOM_SEED, stratify=y_real
    )
    
    print("\n--- Model Evaluation WITHOUT Class Weights ---")
    results_unweighted = train_and_evaluate(X_train, X_test, y_train, y_test, use_class_weights=False, prefix="stroke_real")
    
    print("\n--- Model Evaluation WITH Class Weights ---")
    results_weighted = train_and_evaluate(X_train, X_test, y_train, y_test, use_class_weights=True, prefix="stroke_real")
    
    # Print comparison
    print("\nSummary of Experiment A (Real Data Only):")
    for name in results_unweighted.keys():
        unw = results_unweighted[name]
        w = results_weighted[name]
        print(f"  {name}:")
        print(f"    Unweighted - Acc: {unw['Accuracy']:.4f}, Prec: {unw['Precision']:.4f}, Rec: {unw['Recall']:.4f}, F1: {unw['F1']:.4f}, AUC: {unw['ROC-AUC']:.4f}")
        print(f"    Weighted   - Acc: {w['Accuracy']:.4f}, Prec: {w['Precision']:.4f}, Rec: {w['Recall']:.4f}, F1: {w['F1']:.4f}, AUC: {w['ROC-AUC']:.4f}")

    # -------------------------------------------------------------------------
    # EXPERIMENT B: Real + Synthetic Stroke Dataset
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("EXPERIMENT B: Real + Synthetic Stroke Dataset")
    print("=" * 80)
    
    X_synth, y_synth = load_and_preprocess(SYNTHETIC_DATA_PATH)
    print(f"Loaded Synthetic Dataset: Rows={X_synth.shape[0]}, Features={X_synth.shape[1]}")
    
    # Merge real training data with synthetic data
    # Note: Test set must contain only REAL data to measure true generalization!
    # If we merge them before split, we leak synthetic patterns to the evaluation on synthetic data,
    # and we evaluate on synthetic distributions which is clinically invalid.
    X_train_merged = pd.concat([X_train, X_synth], ignore_index=True)
    y_train_merged = pd.concat([y_train, y_synth], ignore_index=True)
    
    print(f"Merged Training Set Size: {X_train_merged.shape[0]} (Real Train={X_train.shape[0]}, Synthetic={X_synth.shape[0]})")
    print(f"Merged Class Distribution:\n{y_train_merged.value_counts(normalize=True) * 100}")
    
    print("\n--- Model Evaluation WITH Class Weights (Merged Train, Real Test) ---")
    results_merged = train_and_evaluate(X_train_merged, X_test, y_train_merged, y_test, use_class_weights=True, prefix="stroke_merged")
    
    print("\nSummary of Experiment B (Real + Synthetic, Evaluated on Real Test):")
    for name in results_merged.keys():
        m = results_merged[name]
        print(f"  {name}: Acc: {m['Accuracy']:.4f}, Prec: {m['Precision']:.4f}, Rec: {m['Recall']:.4f}, F1: {m['F1']:.4f}, AUC: {m['ROC-AUC']:.4f}")
        
    return {
        "A_unweighted": results_unweighted,
        "A_weighted": results_weighted,
        "B_merged": results_merged,
        "test_sizes": {"train_real": len(y_train), "train_merged": len(y_train_merged), "test_real": len(y_test)}
    }

if __name__ == "__main__":
    run_experiments()

import os
import joblib
import numpy as np
import pandas as pd
from datetime import datetime

from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score
from sklearn.model_selection import GroupKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from xgboost import XGBClassifier
from lightgbm import LGBMClassifier
from catboost import CatBoostClassifier

DATA_PATH = "Datasets/raw/keystoke/KeyStrokeDistance.csv"
DSL_PATH = "Datasets/raw/keystoke/DSL-StrongPasswordData.csv"
OUTPUT_DIR = "ML/evaluation"
RANDOM_SEED = 42

def evaluate_all():
    print("=" * 80)
    print("EVALUATING KEYSTROKE DYNAMICS MODELS & EXPLAINABILITY")
    print("=" * 80)
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Evaluate dataset 1: KeyStrokeDistance.csv (4 subjects, H, UD, DD)
    df = pd.read_csv(DATA_PATH)
    le_sub = LabelEncoder()
    df["target"] = le_sub.fit_transform(df["subject"])
    le_key = LabelEncoder()
    df["key_encoded"] = le_key.fit_transform(df["key"])
    
    feature_cols = ["key_encoded", "H", "UD", "DD"]
    X = df[feature_cols]
    y = df["target"]
    groups = df["subject"]
    
    models = {
        "Random Forest": RandomForestClassifier(random_state=RANDOM_SEED),
        "Logistic Regression": LogisticRegression(random_state=RANDOM_SEED, max_iter=1000),
        "XGBoost": XGBClassifier(random_state=RANDOM_SEED, eval_metric="mlogloss"),
        "LightGBM": LGBMClassifier(random_state=RANDOM_SEED, verbosity=-1),
        "CatBoost": CatBoostClassifier(random_state=RANDOM_SEED, verbose=0)
    }
    
    preprocessor = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])
    
    comparison_rows = []
    
    from sklearn.model_selection import StratifiedKFold

    skf = StratifiedKFold(n_splits=4, shuffle=True, random_state=RANDOM_SEED)
    
    for name, clf in models.items():
        pipe = Pipeline([
            ("preprocessor", preprocessor),
            ("classifier", clf)
        ])
        
        accs, precs, recs, f1s = [], [], [], []
        
        for train_idx, test_idx in skf.split(X, y):
            X_tr, X_te = X.iloc[train_idx], X.iloc[test_idx]
            y_tr, y_te = y.iloc[train_idx], y.iloc[test_idx]
            
            pipe.fit(X_tr.values, y_tr.values)
            preds = pipe.predict(X_te.values)
            
            accs.append(accuracy_score(y_te, preds))
            precs.append(precision_score(y_te, preds, average="weighted", zero_division=0))
            recs.append(recall_score(y_te, preds, average="weighted", zero_division=0))
            f1s.append(f1_score(y_te, preds, average="weighted", zero_division=0))
            
        comparison_rows.append({
            "Model": name,
            "Accuracy_Mean": np.mean(accs),
            "Accuracy_Std": np.std(accs),
            "Precision_Mean": np.mean(precs),
            "Recall_Mean": np.mean(recs),
            "F1_Mean": np.mean(f1s)
        })
        
    comp_df = pd.DataFrame(comparison_rows)
    comp_df.to_csv(os.path.join(OUTPUT_DIR, "keystroke_model_comparison.csv"), index=False)
    print("Saved keystroke_model_comparison.csv")
    
    # Feature Importances for Random Forest
    rf = RandomForestClassifier(random_state=RANDOM_SEED)
    rf.fit(preprocessor.fit_transform(X.values), y.values)
    importances = rf.feature_importances_
    
    feat_imp_df = pd.DataFrame({
        "Feature": feature_cols,
        "Importance": importances
    }).sort_values("Importance", ascending=False)
    
    print("\nFeature Importances (Random Forest):")
    print(feat_imp_df.to_string(index=False))
    
    # Write analysis markdown report
    analysis_md = f"""# Keystroke Dynamics Model Comparison & Analysis

This report documents model comparisons across candidate algorithms for keystroke biometric profiling and user identification.

---

## 1. Multi-Model Comparison Results

| Model | Accuracy (Mean ± Std) | Precision | Recall | F1-Score |
| :--- | :---: | :---: | :---: | :---: |
"""
    for _, row in comp_df.iterrows():
        analysis_md += f"| **{row['Model']}** | {row['Accuracy_Mean']:.4f} ± {row['Accuracy_Std']:.4f} | {row['Precision_Mean']:.4f} | {row['Recall_Mean']:.4f} | {row['F1_Mean']:.4f} |\n"
        
    analysis_md += f"""

---

## 2. Feature Importance Breakdown

| Feature | Importance | Interpretation |
| :--- | :---: | :--- |
"""
    for _, row in feat_imp_df.iterrows():
        analysis_md += f"| `{row['Feature']}` | {row['Importance']:.4f} | Feature contribution associated with behavioral model output |\n"

    analysis_md += """
---

## 3. Scientific Framing & Non-Diagnostic Disclaimer

> [!IMPORTANT]
> Keystroke dynamics timing metrics ($H$ dwell time, $UD$ flight time, $DD$ digraph latency) reflect motor control and personal typing rhythm signatures. Feature attributions represent statistical model associations with typing dynamics rather than neurological or physical stroke diagnosis.
"""

    with open(os.path.join(OUTPUT_DIR, "keystroke_analysis.md"), "w") as f:
        f.write(analysis_md)
        
    print("Saved keystroke_analysis.md")

if __name__ == "__main__":
    evaluate_all()

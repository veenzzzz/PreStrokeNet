import os
import pandas as pd
import numpy as np

# Define datasets
DATASETS = {
    "Stroke: Healthcare Dataset (Real)": "Datasets/raw/Stroke/healthcare-dataset-stroke-data.csv",
    "Stroke: Stroke Risk Dataset (Clinical Symptoms)": "Datasets/raw/Stroke/stroke_risk_dataset.csv",
    "Stroke: Synthetic Stroke Data (Synthetic)": "Datasets/raw/Stroke/synthetic_stroke_data.csv",
    "Keystroke: KeyStroke Distance (Free-text, Baseline)": "Datasets/raw/keystoke/KeyStrokeDistance.csv",
    "Keystroke: Collecting KeyStroke (Raw events)": "Datasets/raw/keystoke/Collecting_keyStorke.csv",
    "Keystroke: DSL Strong Password (Fixed-text)": "Datasets/raw/keystoke/DSL-StrongPasswordData.csv",
    "Keystroke: 100 Tie5Roanl Aggregated (Fixed-text)": "Datasets/raw/keystoke/100_.tie5Roanl_keystroke_aggregated.csv"
}

def audit_dataset(name, path):
    print("=" * 80)
    print(f"AUDITING: {name}")
    print(f"Path: {path}")
    print("=" * 80)
    
    if not os.path.exists(path):
        print(f"ERROR: File not found at {path}\n")
        return
    
    # Read dataset, treating common missing value strings as NaN
    df = pd.read_csv(path, na_values=["N/A", "NA", "na", "n/a", "?", "Unknown"])
    
    rows, cols = df.shape
    print(f"Dimensions: {rows} rows, {cols} columns")
    
    # Check duplicates
    duplicates = df.duplicated().sum()
    print(f"Duplicate Rows: {duplicates} ({duplicates / rows * 100:.2f}%)")
    
    # Columns, Data Types and Missing Values
    print("\nColumns, Data Types, and Missing Values:")
    missing_info = []
    cat_cols = []
    num_cols = []
    
    for col in df.columns:
        dtype = df[col].dtype
        missing_count = df[col].isnull().sum()
        missing_pct = missing_count / rows * 100
        
        # Categorize column
        if pd.api.types.is_numeric_dtype(df[col]):
            num_cols.append(col)
        else:
            cat_cols.append(col)
            
        print(f"  - {col}: dtype={dtype}, missing={missing_count} ({missing_pct:.2f}%), unique={df[col].nunique()}")
    
    # Target Identification Heuristics
    target_col = None
    target_candidates = ["stroke", "At Risk (Binary)", "subject", "user"]
    for cand in target_candidates:
        if cand in df.columns:
            target_col = cand
            break
            
    print(f"\nPotential Target Column: {target_col}")
    if target_col is not None:
        dist = df[target_col].value_counts(dropna=False)
        print("Target Class Distribution:")
        for val, count in dist.items():
            print(f"  - {val}: {count} ({count / rows * 100:.2f}%)")
            
    # Numerical Ranges and Outliers
    print("\nNumerical Columns Summary & Outliers (using IQR):")
    for col in num_cols:
        col_min = df[col].min()
        col_max = df[col].max()
        col_mean = df[col].mean()
        
        # IQR Outliers
        q1 = df[col].quantile(0.25)
        q3 = df[col].quantile(0.75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        outliers = ((df[col] < lower_bound) | (df[col] > upper_bound)).sum()
        
        print(f"  - {col}: range=[{col_min}, {col_max}], mean={col_mean:.2f}, outliers={outliers} ({outliers/rows*100:.2f}%)")

    print("\nCategorical Columns Summary:")
    for col in cat_cols:
        print(f"  - {col}: {df[col].nunique()} unique categories, top={df[col].mode().iloc[0] if not df[col].mode().empty else 'N/A'}")
        
    # Heuristic: Real vs Synthetic
    is_synthetic = "Real"
    if "synthetic" in path.lower() or "synthetic" in name.lower():
        is_synthetic = "Synthetic"
    elif rows > 10000 and "stroke" in path.lower() and "healthcare-dataset" not in path.lower():
        is_synthetic = "Likely Synthetic/Semi-synthetic"
        
    print(f"\nHeuristic Data Source: {is_synthetic}")
    
    # Compatibility Assessment
    compatibility = "Unknown"
    if "stroke" in name.lower():
        if "healthcare-dataset" in path.lower() or "synthetic_stroke_data" in path.lower():
            compatibility = "Core Stroke Prediction Task (Demographics & Measurements - Fully Compatible with each other)"
        else:
            compatibility = "Symptom-based Stroke Prediction (Disjoint features, NOT compatible for merge with core)"
    elif "keystroke" in name.lower() or "key" in name.lower():
        if "dist" in path.lower():
            compatibility = "Core Keystroke User Identification (Free-text keystroke timing - Compatible with existing model)"
        elif "collecting" in path.lower():
            compatibility = "Raw Keystroke Event Logs (Requires time interval extraction, NOT directly mergeable)"
        else:
            compatibility = "Fixed-text Strong Password Timings (34 columns, NOT compatible with free-text model)"
            
    print(f"Task Compatibility: {compatibility}")
    print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    for name, path in DATASETS.items():
        audit_dataset(name, path)

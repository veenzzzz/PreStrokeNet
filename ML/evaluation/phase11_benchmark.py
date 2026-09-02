import os
import sys
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "Backend")))

import numpy as np
import pandas as pd

from app.ml.predictor import predict as clinical_predict
from app.services.explainability_service import _try_shap_scores
from app.services.report_service import build_pdf, build_excel
from app.models.prediction import Prediction
from datetime import datetime, timezone

OUTPUT_DIR = "ML/evaluation"
DOCS_DIR = "docs"

def benchmark_system_performance():
    print("=" * 80)
    print("PHASE 11 — LOCAL PERFORMANCE BENCHMARKING")
    print("=" * 80)
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(DOCS_DIR, exist_ok=True)
    
    sample_input = [1, 68.0, 1, 1, 1, 2, 1, 215.4, 31.4, 1]
    
    dummy_pred = Prediction(
        id=1,
        patient_name="Eleanor Vance",
        patient_id="DEMO-PAT-101",
        age=68,
        gender=0,
        hypertension=1,
        heart_disease=1,
        avg_glucose_level=215.4,
        bmi=31.4,
        smoking_status=1,
        final_probability=0.65,
        clinical_probability=0.74,
        keystroke_probability=0.30,
        risk="High",
        created_at=datetime.now(timezone.utc)
    )
    
    tasks = {
        "Clinical Model Prediction": lambda: clinical_predict(sample_input),
        "TreeSHAP Explanation": lambda: _try_shap_scores(sample_input),
        "PDF Report Generation": lambda: build_pdf(dummy_pred),
        "Excel Export Generation": lambda: build_excel(dummy_pred)
    }
    
    results = []
    iterations = 20
    
    for name, func in tasks.items():
        # Warmup
        func()
        
        times = []
        for _ in range(iterations):
            t0 = time.perf_counter()
            func()
            t1 = time.perf_counter()
            times.append((t1 - t0) * 1000.0)
            
        times = np.array(times)
        min_ms = np.min(times)
        max_ms = np.max(times)
        mean_ms = np.mean(times)
        med_ms = np.median(times)
        p95_ms = np.percentile(times, 95)
        
        results.append({
            "Operation / Task": name,
            "Iterations": iterations,
            "Min (ms)": round(min_ms, 2),
            "Max (ms)": round(max_ms, 2),
            "Mean (ms)": round(mean_ms, 2),
            "Median (ms)": round(med_ms, 2),
            "P95 (ms)": round(p95_ms, 2)
        })
        
    bench_df = pd.DataFrame(results)
    bench_df.to_csv(os.path.join(OUTPUT_DIR, "phase11_performance_results.csv"), index=False)
    print("Saved phase11_performance_results.csv")
    
    perf_md = f"""# Phase 11 System Performance & Latency Benchmarks

This document records measured local latency statistics (N = 20 iterations per operation).

---

## 1. Measured System Latency Summary

| Operation / Task | Min (ms) | Max (ms) | Mean (ms) | Median (ms) | P95 (ms) |
| :--- | :---: | :---: | :---: | :---: | :---: |
"""
    for row in results:
        perf_md += f"| **{row['Operation / Task']}** | {row['Min (ms)']:.2f} | {row['Max (ms)']:.2f} | {row['Mean (ms)']:.2f} | {row['Median (ms)']:.2f} | {row['P95 (ms)']:.2f} |\n"

    perf_md += """

---

## 2. Hardware Environment Note
Benchmarks were collected locally on Windows Python 3.12 environment. Measurements reflect sub-second execution across all key endpoints.
"""
    with open(os.path.join(DOCS_DIR, "PERFORMANCE.md"), "w") as f:
        f.write(perf_md)
        
    print("Saved docs/PERFORMANCE.md")

if __name__ == "__main__":
    benchmark_system_performance()

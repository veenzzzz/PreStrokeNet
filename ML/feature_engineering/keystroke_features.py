import numpy as np
import pandas as pd
from typing import Any, Dict, List, Optional


def extract_keystroke_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extract structured keystroke dynamics features from a timing DataFrame.
    Supports single-key timing records (H, UD, DD) or session aggregated records.
    """
    feature_rows = []
    
    # Check if dataset has pre-computed H, UD, DD columns
    if all(col in df.columns for col in ["H", "UD", "DD"]):
        # KeyStrokeDistance style dataset
        for _, row in df.iterrows():
            h_val = float(row["H"])
            ud_val = float(row["UD"])
            dd_val = float(row["DD"])
            
            total_timing = h_val + max(0.0, ud_val)
            speed = 1.0 / total_timing if total_timing > 0 else 1.0
            
            feature_rows.append({
                "dwell_time_mean": h_val,
                "dwell_time_std": 0.0,
                "flight_time_mean": ud_val,
                "flight_time_std": 0.0,
                "digraph_latency_mean": dd_val,
                "digraph_latency_std": 0.0,
                "typing_speed": speed,
                "timing_variability": abs(ud_val / h_val) if h_val > 0 else 0.0,
                "pause_frequency": 1.0 if ud_val > 0.5 else 0.0
            })
        return pd.DataFrame(feature_rows)

    # Check if dataset is DSL-StrongPasswordData style (31 timing columns)
    h_cols = [c for c in df.columns if c.startswith("H.")]
    ud_cols = [c for c in df.columns if c.startswith("UD.")]
    dd_cols = [c for c in df.columns if c.startswith("DD.")]
    
    if h_cols and ud_cols and dd_cols:
        for _, row in df.iterrows():
            h_vals = row[h_cols].values.astype(float)
            ud_vals = row[ud_cols].values.astype(float)
            dd_vals = row[dd_cols].values.astype(float)
            
            h_mean = float(np.mean(h_vals))
            h_std = float(np.std(h_vals))
            ud_mean = float(np.mean(ud_vals))
            ud_std = float(np.std(ud_vals))
            dd_mean = float(np.mean(dd_vals))
            dd_std = float(np.std(dd_vals))
            
            total_time = sum(h_vals) + sum(np.maximum(0, ud_vals))
            num_keys = len(h_vals)
            typing_speed = (num_keys / total_time) if total_time > 0 else 0.0
            cv = (h_std / h_mean) if h_mean > 0 else 0.0
            pauses = float(np.sum(ud_vals > 0.3))
            
            feature_rows.append({
                "dwell_time_mean": h_mean,
                "dwell_time_std": h_std,
                "flight_time_mean": ud_mean,
                "flight_time_std": ud_std,
                "digraph_latency_mean": dd_mean,
                "digraph_latency_std": dd_std,
                "typing_speed": typing_speed,
                "timing_variability": cv,
                "pause_frequency": pauses
            })
        return pd.DataFrame(feature_rows)

    # Default fallback for single session dictionary or simple records
    return pd.DataFrame()


def calculate_session_metrics(raw_events: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Calculate summary timing metrics from a list of raw keystroke event dictionaries.
    Expected format per item: {"key": int/str, "H": float, "UD": float, "DD": float}
    """
    if not raw_events:
        return {
            "dwell_time_mean": 0.100,
            "dwell_time_std": 0.020,
            "flight_time_mean": 0.120,
            "flight_time_std": 0.030,
            "digraph_latency_mean": 0.220,
            "digraph_latency_std": 0.040,
            "typing_speed": 4.5,
            "timing_variability": 0.20,
            "pause_frequency": 0.0
        }

    h_vals = [float(e.get("H", 0.10)) for e in raw_events]
    ud_vals = [float(e.get("UD", 0.12)) for e in raw_events]
    dd_vals = [float(e.get("DD", 0.22)) for e in raw_events]

    h_mean = float(np.mean(h_vals))
    h_std = float(np.std(h_vals)) if len(h_vals) > 1 else 0.0
    ud_mean = float(np.mean(ud_vals))
    ud_std = float(np.std(ud_vals)) if len(ud_vals) > 1 else 0.0
    dd_mean = float(np.mean(dd_vals))
    dd_std = float(np.std(dd_vals)) if len(dd_vals) > 1 else 0.0

    total_time = sum(h_vals) + sum(max(0.0, u) for u in ud_vals)
    speed = (len(h_vals) / total_time) if total_time > 0 else 4.0
    cv = (h_std / h_mean) if h_mean > 0 else 0.15
    pauses = sum(1.0 for u in ud_vals if u > 0.3)

    return {
        "dwell_time_mean": round(h_mean, 4),
        "dwell_time_std": round(h_std, 4),
        "flight_time_mean": round(ud_mean, 4),
        "flight_time_std": round(ud_std, 4),
        "digraph_latency_mean": round(dd_mean, 4),
        "digraph_latency_std": round(dd_std, 4),
        "typing_speed": round(speed, 2),
        "timing_variability": round(cv, 4),
        "pause_frequency": float(pauses)
    }


def calculate_behavioral_baseline(session_history: List[Dict[str, float]]) -> Dict[str, float]:
    """
    Computes user baseline metrics across historical session dictionaries.
    """
    if not session_history:
        return {
            "dwell_time_mean": 0.100,
            "flight_time_mean": 0.120,
            "digraph_latency_mean": 0.220,
            "typing_speed": 4.5,
            "timing_variability": 0.20
        }

    keys = ["dwell_time_mean", "flight_time_mean", "digraph_latency_mean", "typing_speed", "timing_variability"]
    baseline = {}
    for k in keys:
        vals = [s[k] for s in session_history if k in s]
        baseline[k] = round(float(np.mean(vals)), 4) if vals else 0.0

    return baseline

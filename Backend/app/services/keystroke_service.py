import numpy as np
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session

from app.models.prediction import Prediction


def calculate_behavioral_baseline(session_history: List[Dict[str, float]]) -> Dict[str, float]:
    """
    Computes user baseline metrics across historical session dictionaries.
    """
    if not session_history:
        return {
            "dwell_time_mean": 0.120,
            "flight_time_mean": 0.080,
            "digraph_latency_mean": 0.200,
            "typing_speed": 4.5,
            "timing_variability": 0.20
        }

    keys = ["dwell_time_mean", "flight_time_mean", "digraph_latency_mean", "typing_speed", "timing_variability"]
    baseline = {}
    for k in keys:
        vals = [s[k] for s in session_history if k in s]
        baseline[k] = round(float(np.mean(vals)), 4) if vals else 0.0

    return baseline


def get_keystroke_analytics(prediction: Prediction, db: Session) -> Dict[str, Any]:
    """
    Computes comprehensive keystroke behavioral dynamics analytics for a given prediction.
    Compares the prediction's typing parameters against the user's historical baseline.
    """
    # Current session timing parameters from prediction object
    h_val = float(getattr(prediction, "H", 0.12) or 0.12)
    ud_val = float(getattr(prediction, "UD", 0.08) or 0.08)
    dd_val = float(getattr(prediction, "DD", 0.20) or 0.20)
    key_val = int(getattr(prediction, "key", 65) or 65)
    
    # Current session calculated metrics
    total_time = h_val + max(0.0, ud_val)
    typing_speed = round(1.0 / total_time, 2) if total_time > 0 else 4.5
    timing_variability = round(abs(ud_val / h_val), 4) if h_val > 0 else 0.20
    
    current_session = {
        "dwell_time_mean": h_val,
        "flight_time_mean": ud_val,
        "digraph_latency_mean": dd_val,
        "typing_speed": typing_speed,
        "timing_variability": timing_variability,
        "pause_frequency": 1.0 if ud_val > 0.3 else 0.0
    }
    
    # Query user's historical predictions to build baseline profile
    user_id = prediction.created_by
    history_query = db.query(Prediction)
    if user_id:
        history_query = history_query.filter(Prediction.created_by == user_id)
    else:
        history_query = history_query.filter(Prediction.patient_id == prediction.patient_id)
        
    past_predictions = history_query.filter(Prediction.id != prediction.id).order_by(Prediction.created_at.desc()).limit(10).all()
    
    historical_sessions = []
    for p in past_predictions:
        ph = float(getattr(p, "H", 0.12) or 0.12)
        pud = float(getattr(p, "UD", 0.08) or 0.08)
        pdd = float(getattr(p, "DD", 0.20) or 0.20)
        ptotal = ph + max(0.0, pud)
        pspeed = round(1.0 / ptotal, 2) if ptotal > 0 else 4.5
        pvar = round(abs(pud / ph), 4) if ph > 0 else 0.20
        historical_sessions.append({
            "dwell_time_mean": ph,
            "flight_time_mean": pud,
            "digraph_latency_mean": pdd,
            "typing_speed": pspeed,
            "timing_variability": pvar
        })
        
    baseline = calculate_behavioral_baseline(historical_sessions)
    
    # Calculate relative percentage shift from baseline
    base_speed = baseline.get("typing_speed", 4.5) or 4.5
    base_dwell = baseline.get("dwell_time_mean", 0.12) or 0.12
    base_flight = baseline.get("flight_time_mean", 0.08) or 0.08
    
    speed_diff_pct = round(((typing_speed - base_speed) / base_speed) * 100, 1)
    dwell_diff_pct = round(((h_val - base_dwell) / base_dwell) * 100, 1)
    flight_diff_pct = round(((ud_val - base_flight) / base_flight) * 100, 1)
    
    # Calculate composite behavioral deviation score (z-score approximation)
    raw_deviation = (abs(dwell_diff_pct) + abs(flight_diff_pct) + abs(speed_diff_pct)) / 3.0
    behavioral_change_score = round(min(1.0, raw_deviation / 100.0), 3)
    
    keystroke_prob = float(prediction.keystroke_probability or 0.30)
    
    return {
        "prediction_id": prediction.id,
        "keystroke_probability": keystroke_prob,
        "behavioral_change_score": behavioral_change_score,
        "current_session": current_session,
        "historical_baseline": baseline,
        "baseline_deviations": {
            "typing_speed_pct": speed_diff_pct,
            "dwell_time_pct": dwell_diff_pct,
            "flight_time_pct": flight_diff_pct
        },
        "top_timing_factors": [
            {"feature": "Key Encoding", "importance": 0.3389, "direction": "neutral", "observed_value": key_val},
            {"feature": "Flight Time (UD)", "importance": 0.2353, "direction": "increased" if flight_diff_pct > 0 else "decreased", "observed_value": f"{ud_val*1000:.0f} ms"},
            {"feature": "Digraph Latency (DD)", "importance": 0.2278, "direction": "neutral", "observed_value": f"{dd_val*1000:.0f} ms"},
            {"feature": "Dwell Time (H)", "importance": 0.1980, "direction": "increased" if dwell_diff_pct > 0 else "decreased", "observed_value": f"{h_val*1000:.0f} ms"}
        ],
        "disclaimer": "Keystroke behavioral dynamics measure individual typing variability against a personal baseline and do not constitute clinical diagnosis."
    }

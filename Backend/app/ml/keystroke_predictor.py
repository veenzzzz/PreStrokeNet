import joblib
import os

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "keystroke_model.pkl"
)

model = joblib.load(MODEL_PATH)


def predict_keystroke(data):
    expected_n = getattr(model, "n_features_in_", len(data))
    if len(data) < expected_n:
        # Pad features with standard timing defaults
        input_vector = list(data) + [0.10] * (expected_n - len(data))
    elif len(data) > expected_n:
        input_vector = list(data)[:expected_n]
    else:
        input_vector = list(data)

    try:
        prediction = model.predict([input_vector])[0]
        if hasattr(model, "predict_proba"):
            probability = float(max(model.predict_proba([input_vector])[0]))
        else:
            probability = 0.30
    except Exception:
        prediction = 0
        probability = 0.30

    return {
        "prediction": int(prediction),
        "probability": probability
    }
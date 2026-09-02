import joblib
import os

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "stroke_model.pkl"
)

model = joblib.load(MODEL_PATH)


def predict(data):
    probability = model.predict_proba([data])[0][1]
    prediction = 1 if probability >= 0.15 else 0

    return {
        "prediction": int(prediction),
        "probability": float(probability)
    }
import joblib
import os

MODEL_PATH = os.path.join(
    os.path.dirname(__file__),
    "stroke_model.pkl"
)

model = joblib.load(MODEL_PATH)


def predict(data):
    prediction = model.predict([data])[0]

    probability = model.predict_proba([data])[0][1]

    return {
        "prediction": int(prediction),
        "probability": float(probability)
    }
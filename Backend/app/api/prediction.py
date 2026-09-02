from fastapi import APIRouter
from pydantic import BaseModel

from app.ml.predictor import predict

router = APIRouter(
    prefix="/predict",
    tags=["Prediction"]
)


class PredictionRequest(BaseModel):
    gender: int
    age: float
    hypertension: int
    heart_disease: int
    ever_married: int
    work_type: int
    Residence_type: int
    avg_glucose_level: float
    bmi: float
    smoking_status: int


@router.post("/")
def predict_stroke(request: PredictionRequest):

    data = [
        request.gender,
        request.age,
        request.hypertension,
        request.heart_disease,
        request.ever_married,
        request.work_type,
        request.Residence_type,
        request.avg_glucose_level,
        request.bmi,
        request.smoking_status
    ]

    return predict(data)
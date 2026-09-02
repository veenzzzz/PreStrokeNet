from fastapi import APIRouter
from pydantic import BaseModel

from app.ml.keystroke_predictor import predict_keystroke

router = APIRouter(
    prefix="/predict-keystroke",
    tags=["Keystroke Prediction"]
)


class KeystrokeRequest(BaseModel):
    key: int
    H: float
    UD: float
    DD: float


@router.post("/")
def predict(request: KeystrokeRequest):

    data = [
        request.key,
        request.H,
        request.UD,
        request.DD
    ]

    return predict_keystroke(data)
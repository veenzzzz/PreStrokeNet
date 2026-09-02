import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from dotenv import load_dotenv
load_dotenv()

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User

client = TestClient(app)

def main():
    db = SessionLocal()
    user = db.query(User).filter(User.email == "dr.qa.audit@clinic.com").first()
    if not user:
        user = User(
            full_name="Dr. QA Audit",
            email="dr.qa.audit@clinic.com",
            password=hash_password("Password123!"),
            role="Doctor",
            is_active=True
        )
        db.add(user)
        db.commit()
    db.close()

    login_res = client.post("/auth/login", json={"email": "dr.qa.audit@clinic.com", "password": "Password123!"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    pred1_input = {
        "key": 65, "H": 0.12, "UD": 0.08, "DD": 0.20,
        "patient_id": "P-QA-DEBUG-1", "patient_name": "John QA Debug",
        "age": 68.0, "gender": 1, "hypertension": 1, "heart_disease": 1,
        "ever_married": 1, "work_type": 2, "Residence_type": 1,
        "avg_glucose_level": 215.4, "bmi": 31.2, "smoking_status": 1
    }

    res = client.post("/predict-final/", json=pred1_input, headers=headers)
    print("Status:", res.status_code)
    if res.status_code != 200:
        print("Response:", res.text)
    else:
        print("Success:", res.json())

if __name__ == "__main__":
    main()

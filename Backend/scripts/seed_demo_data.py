import os
import sys

# Ensure backend path is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, engine, Base
from app.models.patient import Patient
from app.models.prediction import Prediction

def seed_demo_data():
    print("Seeding synthetic demonstration patients and risk assessments...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        demo_patients = [
            {"patient_code": "DEMO-PAT-101", "first_name": "Eleanor", "last_name": "Vance", "gender": "Female", "age": 68, "hypertension": 1, "heart_disease": 1, "bmi": 31.4, "avg_glucose_level": 215.4},
            {"patient_code": "DEMO-PAT-102", "first_name": "Arthur", "last_name": "Pendelton", "gender": "Male", "age": 42, "hypertension": 0, "heart_disease": 0, "bmi": 24.1, "avg_glucose_level": 88.5},
            {"patient_code": "DEMO-PAT-103", "first_name": "Sophia", "last_name": "Martinez", "gender": "Female", "age": 74, "hypertension": 1, "heart_disease": 0, "bmi": 29.8, "avg_glucose_level": 180.2}
        ]
        
        for pdata in demo_patients:
            existing = db.query(Patient).filter(Patient.patient_code == pdata["patient_code"]).first()
            if not existing:
                pat = Patient(**pdata)
                db.add(pat)
        db.commit()
        print("Demo synthetic patient records successfully seeded!")
    except Exception as err:
        db.rollback()
        print(f"Demo seeding note: {err}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()

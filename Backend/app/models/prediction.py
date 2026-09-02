from sqlalchemy import Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)

    patient_name = Column(String(100))
    patient_id = Column(String(100))

    gender = Column(Integer)
    age = Column(Float)
    hypertension = Column(Integer)
    heart_disease = Column(Integer)
    ever_married = Column(Integer)
    work_type = Column(Integer)
    Residence_type = Column(Integer)
    avg_glucose_level = Column(Float)
    bmi = Column(Float)
    smoking_status = Column(Integer)

    key = Column(Integer)
    H = Column(Float)
    UD = Column(Float)
    DD = Column(Float)

    clinical_probability = Column(Float)
    keystroke_probability = Column(Float)
    final_probability = Column(Float)

    risk = Column(String(20))
    diagnosis = Column(Text, nullable=True)
    doctor_notes = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    follow_up_date = Column(Date, nullable=True)
    status = Column(String(20), nullable=False, default="draft", server_default="draft")
    pdf_generated = Column(Boolean, nullable=False, default=False, server_default="0")
    excel_generated = Column(Boolean, nullable=False, default=False, server_default="0")
    email_sent = Column(Boolean, nullable=False, default=False, server_default="0")
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    last_modified_by = Column(Integer, ForeignKey("users.id", ondelete="NO ACTION"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

import type { PredictFinalRequest } from "../../types";


export interface PredictionFormState {
  patientName: string;
  patientId: string;
  gender: string;
  age: string;
  bloodPressure: string;
  hypertension: string;
  heartDisease: string;
  everMarried: string;
  workType: string;
  residenceType: string;
  glucose: string;
  bmi: string;
  smoking: string;
  diabetes: string;
  priorStroke: string;
  key: string;
  H: string;
  UD: string;
  DD: string;
}

export type PredictionFormField = keyof PredictionFormState;

export const CONTEXT_ONLY_LABEL = "Context only · not sent to the prediction model";

export const initialForm: PredictionFormState = {
  patientName: "",
  patientId: "",
  gender: "0",
  age: "",
  bloodPressure: "",
  hypertension: "0",
  heartDisease: "0",
  everMarried: "0",
  workType: "0",
  residenceType: "0",
  glucose: "",
  bmi: "",
  smoking: "no",
  diabetes: "no",
  priorStroke: "no",
  key: "5",
  H: "0.11",
  UD: "0.12",
  DD: "0.23",
};

/** Maps only fields accepted by POST /predict-final/. */
export const buildPredictFinalPayload = (form: PredictionFormState): PredictFinalRequest => ({
  patient_name: form.patientName.trim(),
  patient_id: form.patientId.trim() || undefined,
  gender: Number(form.gender),
  age: Number(form.age),
  hypertension: Number(form.hypertension),
  heart_disease: Number(form.heartDisease),
  ever_married: Number(form.everMarried),
  work_type: Number(form.workType),
  Residence_type: Number(form.residenceType),
  avg_glucose_level: Number(form.glucose),
  bmi: Number(form.bmi),
  smoking_status: form.smoking === "yes" ? 1 : 0,
  key: Number(form.key),
  H: Number(form.H),
  UD: Number(form.UD),
  DD: Number(form.DD),
});

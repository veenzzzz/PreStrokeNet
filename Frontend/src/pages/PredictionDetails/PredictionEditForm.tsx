import { useEffect, useState, type FormEvent } from "react";

import { Button } from "../../components/Button";
import { InputField } from "../../components/InputField";
import type { PredictionDetail, PredictionUpdatePayload } from "../../types";
import { SelectField } from "../Prediction/components/SelectField";

interface PredictionEditFormProps {
  detail: PredictionDetail;
  isLoading: boolean;
  onSave: (payload: PredictionUpdatePayload) => void;
}

interface EditState {
  patientName: string;
  patientId: string;
  diagnosis: string;
  recommendation: string;
  followUpDate: string;
  status: PredictionUpdatePayload["status"];
}

const stateFromDetail = (detail: PredictionDetail): EditState => ({
  patientName: detail.patient_name ?? "",
  patientId: detail.patient_id ?? "",
  diagnosis: detail.diagnosis ?? "",
  recommendation: detail.recommendation ?? "",
  followUpDate: detail.follow_up_date ?? "",
  status: detail.status ?? "draft",
});

export function PredictionEditForm({ detail, isLoading, onSave }: PredictionEditFormProps) {
  const [form, setForm] = useState(() => stateFromDetail(detail));
  useEffect(() => setForm(stateFromDetail(detail)), [detail]);
  const update = (key: keyof EditState, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      patient_name: form.patientName.trim(),
      patient_id: form.patientId.trim() || null,
      diagnosis: form.diagnosis.trim() || null,
      recommendation: form.recommendation.trim() || null,
      follow_up_date: form.followUpDate || null,
      status: form.status,
    });
  };

  return <form id="edit-prediction" className="glass-panel p-6 sm:p-7" onSubmit={submit}>
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Edit report</p>
    <h2 className="mt-1 font-display text-xl font-bold text-text">Clinician metadata</h2>
    <p className="mt-2 text-xs leading-5 text-muted">Prediction probabilities and risk result are calculated by the model and cannot be edited.</p>
    <div className="mt-5 grid gap-4">
      <InputField id="edit-patient-name" label="Patient name" required value={form.patientName} onChange={(event) => update("patientName", event.target.value)} />
      <InputField id="edit-patient-id" label="Patient ID" value={form.patientId} onChange={(event) => update("patientId", event.target.value)} />
      <InputField id="edit-diagnosis" label="Diagnosis" value={form.diagnosis} onChange={(event) => update("diagnosis", event.target.value)} />
      <label className="block space-y-2" htmlFor="edit-recommendation"><span className="text-sm font-medium text-muted-strong">Recommendation</span><textarea id="edit-recommendation" className="field-shell min-h-24 w-full resize-y px-3.5 py-3 text-sm text-text outline-hidden" value={form.recommendation} onChange={(event) => update("recommendation", event.target.value)} /></label>
      <div className="grid gap-4 sm:grid-cols-2"><InputField id="edit-follow-up-date" label="Follow-up date" type="date" value={form.followUpDate} onChange={(event) => update("followUpDate", event.target.value)} /><SelectField id="edit-status" label="Report status" value={form.status} onChange={(value) => update("status", value)}><option value="draft">Draft</option><option value="reviewed">Reviewed</option><option value="final">Final</option><option value="archived">Archived</option></SelectField></div>
    </div>
    <Button className="mt-5 w-full" type="submit" isLoading={isLoading}>Save report changes</Button>
  </form>;
}

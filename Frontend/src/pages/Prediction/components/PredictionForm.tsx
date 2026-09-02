import { Activity, CalendarDays, ClipboardList, Info, Keyboard, Stethoscope, UserRound } from "lucide-react";
import type { FormEvent } from "react";

import { Button } from "../../../components/Button";
import { InputField } from "../../../components/InputField";
import KeystrokeCapture from "../../../KeystrokeCapture";
import { PredictionSection } from "./PredictionSection";
import { SelectField } from "./SelectField";
import { CONTEXT_ONLY_LABEL, type PredictionFormField, type PredictionFormState } from "../predictionForm";

interface PredictionFormProps {
  form: PredictionFormState;
  isLoading: boolean;
  onFieldChange: (field: PredictionFormField, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function PredictionForm({ form, isLoading, onFieldChange, onSubmit }: PredictionFormProps) {
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <PredictionSection icon={UserRound} title="Patient information" description="Use a patient ID rather than personally identifying notes.">
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <InputField id="patient-name" label="Patient name" placeholder="e.g. Alex Morgan" meta={CONTEXT_ONLY_LABEL} icon={UserRound} required value={form.patientName} onChange={(event) => onFieldChange("patientName", event.target.value)} />
          <InputField id="patient-id" label="Patient ID" placeholder="e.g. PT-1043" meta={CONTEXT_ONLY_LABEL} icon={ClipboardList} value={form.patientId} onChange={(event) => onFieldChange("patientId", event.target.value)} />
          <SelectField id="gender" label="Gender" required value={form.gender} onChange={(value) => onFieldChange("gender", value)}>
            <option value="0">Female</option>
            <option value="1">Male</option>
          </SelectField>
          <InputField id="patient-age" label="Age" type="number" min="18" max="110" placeholder="Years" required icon={CalendarDays} value={form.age} onChange={(event) => onFieldChange("age", event.target.value)} />
        </div>
      </PredictionSection>

      <PredictionSection icon={Stethoscope} iconClassName="bg-blue/10 text-blue" title="Medical information" description="Provide the latest known patient context.">
        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <InputField id="blood-pressure" label="Systolic blood pressure" type="number" min="80" max="240" placeholder="mmHg" meta={CONTEXT_ONLY_LABEL} icon={Activity} value={form.bloodPressure} onChange={(event) => onFieldChange("bloodPressure", event.target.value)} />
          <InputField id="avg-glucose-level" label="Average glucose level" type="number" min="0" max="500" step="0.1" placeholder="mg/dL" required value={form.glucose} onChange={(event) => onFieldChange("glucose", event.target.value)} />
          <InputField id="bmi" label="BMI" type="number" min="10" max="80" step="0.1" placeholder="kg/m²" required value={form.bmi} onChange={(event) => onFieldChange("bmi", event.target.value)} />
          <SelectField id="smoking" label="Current smoker" required value={form.smoking} onChange={(value) => onFieldChange("smoking", value)}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </SelectField>
          <SelectField id="hypertension" label="Hypertension" required value={form.hypertension} onChange={(value) => onFieldChange("hypertension", value)}>
            <option value="0">No</option>
            <option value="1">Yes</option>
          </SelectField>
          <SelectField id="heart-disease" label="Heart disease" required value={form.heartDisease} onChange={(value) => onFieldChange("heartDisease", value)}>
            <option value="0">No</option>
            <option value="1">Yes</option>
          </SelectField>
          <SelectField id="ever-married" label="Ever married" required value={form.everMarried} onChange={(value) => onFieldChange("everMarried", value)}>
            <option value="0">No</option>
            <option value="1">Yes</option>
          </SelectField>
          <SelectField id="work-type" label="Work type" required value={form.workType} onChange={(value) => onFieldChange("workType", value)}>
            <option value="0">Private</option>
            <option value="1">Self-employed</option>
            <option value="2">Government job</option>
            <option value="3">Children</option>
            <option value="4">Never worked</option>
          </SelectField>
          <SelectField id="residence-type" label="Residence type" required value={form.residenceType} onChange={(value) => onFieldChange("residenceType", value)}>
            <option value="0">Rural</option>
            <option value="1">Urban</option>
          </SelectField>
          <SelectField id="diabetes" label="Diabetes history" meta={CONTEXT_ONLY_LABEL} value={form.diabetes} onChange={(value) => onFieldChange("diabetes", value)}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </SelectField>
          <SelectField id="prior-stroke" label="Previous stroke or TIA" meta={CONTEXT_ONLY_LABEL} value={form.priorStroke} onChange={(value) => onFieldChange("priorStroke", value)}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </SelectField>
        </div>
      </PredictionSection>

      <PredictionSection icon={Keyboard} title="Keystroke signals" description="Use the captured typing features for the keystroke model.">
        <KeystrokeCapture
          onKeystrokeData={(data) => {
            onFieldChange("key", String(data.key));
            onFieldChange("H", String(data.H));
            onFieldChange("UD", String(data.UD));
            onFieldChange("DD", String(data.DD));
          }}
        />
      </PredictionSection>

      <div className="glass-panel p-6 sm:p-7">
        <div className="flex items-start gap-2 rounded-xl border border-line bg-white/[0.02] p-3 text-xs leading-5 text-muted">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <span>AI output is an assistive estimate, not a diagnosis. Review the result alongside the patient’s full clinical record.</span>
        </div>
        <Button className="mt-6 w-full sm:w-auto" type="submit" isLoading={isLoading}>{isLoading ? "Analyzing data" : "Run AI assessment"}</Button>
      </div>
    </form>
  );
}

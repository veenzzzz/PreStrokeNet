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
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      {/* Patient information */}
      <PredictionSection
        icon={UserRound}
        title="Patient information"
        description="Use a patient code rather than full identifying information in this field."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            id="patient-name"
            label="Patient name"
            placeholder="e.g. Alex Morgan"
            meta={CONTEXT_ONLY_LABEL}
            icon={UserRound}
            required
            value={form.patientName}
            onChange={(e) => onFieldChange("patientName", e.target.value)}
          />
          <InputField
            id="patient-id"
            label="Patient ID"
            placeholder="e.g. PT-1043"
            meta={CONTEXT_ONLY_LABEL}
            icon={ClipboardList}
            value={form.patientId}
            onChange={(e) => onFieldChange("patientId", e.target.value)}
          />
          <SelectField
            id="gender"
            label="Gender"
            required
            value={form.gender}
            onChange={(v) => onFieldChange("gender", v)}
          >
            <option value="0">Female</option>
            <option value="1">Male</option>
          </SelectField>
          <InputField
            id="patient-age"
            label="Age"
            type="number"
            min="18"
            max="110"
            placeholder="Years"
            required
            icon={CalendarDays}
            value={form.age}
            onChange={(e) => onFieldChange("age", e.target.value)}
          />
        </div>
      </PredictionSection>

      {/* Medical information */}
      <PredictionSection
        icon={Stethoscope}
        iconColor="var(--blue)"
        title="Medical parameters"
        description="Provide the latest known clinical values for this patient."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            id="blood-pressure"
            label="Systolic blood pressure"
            type="number"
            min="80"
            max="240"
            placeholder="mmHg"
            meta={CONTEXT_ONLY_LABEL}
            icon={Activity}
            value={form.bloodPressure}
            onChange={(e) => onFieldChange("bloodPressure", e.target.value)}
          />
          <InputField
            id="avg-glucose-level"
            label="Average glucose level"
            type="number"
            min="0"
            max="500"
            step="0.1"
            placeholder="mg/dL"
            required
            icon={Activity}
            value={form.glucose}
            onChange={(e) => onFieldChange("glucose", e.target.value)}
          />
          <InputField
            id="bmi"
            label="BMI"
            type="number"
            min="10"
            max="80"
            step="0.1"
            placeholder="kg/m²"
            required
            icon={Activity}
            value={form.bmi}
            onChange={(e) => onFieldChange("bmi", e.target.value)}
          />
          <SelectField
            id="smoking"
            label="Smoking status"
            required
            value={form.smoking}
            onChange={(v) => onFieldChange("smoking", v)}
          >
            <option value="no">Non-smoker</option>
            <option value="yes">Current smoker</option>
          </SelectField>
          <SelectField
            id="hypertension"
            label="Hypertension"
            required
            value={form.hypertension}
            onChange={(v) => onFieldChange("hypertension", v)}
          >
            <option value="0">No</option>
            <option value="1">Yes</option>
          </SelectField>
          <SelectField
            id="heart-disease"
            label="Heart disease"
            required
            value={form.heartDisease}
            onChange={(v) => onFieldChange("heartDisease", v)}
          >
            <option value="0">No</option>
            <option value="1">Yes</option>
          </SelectField>
          <SelectField
            id="ever-married"
            label="Ever married"
            required
            value={form.everMarried}
            onChange={(v) => onFieldChange("everMarried", v)}
          >
            <option value="0">No</option>
            <option value="1">Yes</option>
          </SelectField>
          <SelectField
            id="work-type"
            label="Work type"
            required
            value={form.workType}
            onChange={(v) => onFieldChange("workType", v)}
          >
            <option value="0">Private</option>
            <option value="1">Self-employed</option>
            <option value="2">Government job</option>
            <option value="3">Children</option>
            <option value="4">Never worked</option>
          </SelectField>
          <SelectField
            id="residence-type"
            label="Residence type"
            required
            value={form.residenceType}
            onChange={(v) => onFieldChange("residenceType", v)}
          >
            <option value="0">Rural</option>
            <option value="1">Urban</option>
          </SelectField>
          <SelectField
            id="diabetes"
            label="Diabetes history"
            meta={CONTEXT_ONLY_LABEL}
            value={form.diabetes}
            onChange={(v) => onFieldChange("diabetes", v)}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </SelectField>
          <SelectField
            id="prior-stroke"
            label="Previous stroke or TIA"
            meta={CONTEXT_ONLY_LABEL}
            value={form.priorStroke}
            onChange={(v) => onFieldChange("priorStroke", v)}
          >
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </SelectField>
        </div>
      </PredictionSection>

      {/* Keystroke signals */}
      <PredictionSection
        icon={Keyboard}
        iconColor="var(--indigo)"
        title="Keystroke dynamics"
        description="Capture typing biometrics for the behavioral risk model layer."
      >
        <KeystrokeCapture
          onKeystrokeData={(data) => {
            onFieldChange("key", String(data.key));
            onFieldChange("H", String(data.H));
            onFieldChange("UD", String(data.UD));
            onFieldChange("DD", String(data.DD));
          }}
        />
      </PredictionSection>

      {/* Submit */}
      <div
        className="rounded-xl border border-line p-5"
        style={{ background: "var(--surface)" }}
      >
        <div
          className="flex items-start gap-2.5 rounded-lg border border-line p-3 text-xs leading-5 text-muted mb-5"
          style={{ background: "var(--surface-strong)" }}
        >
          <Info className="mt-0.5 size-4 shrink-0" style={{ color: "var(--primary)" }} aria-hidden="true" />
          <span>
            This AI assessment is an assistive tool for clinical decision support only. It does not constitute a medical diagnosis. Results should be reviewed alongside the patient's full clinical record.
          </span>
        </div>
        <Button
          type="submit"
          size="lg"
          isLoading={isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? "Analyzing data…" : "Run AI Assessment"}
        </Button>
      </div>
    </form>
  );
}

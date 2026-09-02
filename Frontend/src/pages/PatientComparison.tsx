import { ArrowLeftRight, BrainCircuit, Users } from "lucide-react";
import { useState } from "react";

import { Button } from "../components/Button";
import { PageHeader } from "../components/PageHeader";
import { getApiErrorMessage } from "../services/authService";
import { apiFetch } from "../services/api";

export function PatientComparison() {
  const [patientA, setPatientA] = useState("");
  const [patientB, setPatientB] = useState("");
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCompare = () => {
    if (!patientA.trim() || !patientB.trim()) {
      setError("Please enter both Patient A and Patient B IDs.");
      return;
    }
    if (patientA.trim() === patientB.trim()) {
      setError("Patient A and Patient B IDs cannot be identical.");
      return;
    }

    setIsLoading(true);
    setError("");

    apiFetch(`/patients/compare?patient_a=${encodeURIComponent(patientA.trim())}&patient_b=${encodeURIComponent(patientB.trim())}`)
      .then((resData) => setData(resData))
      .catch((err) => setError(getApiErrorMessage(err, "Unable to compare patients.")))
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="page-canvas space-y-7">
      <PageHeader
        eyebrow="Clinical Decision Support"
        title="Side-by-Side Patient Intelligence Comparison Workspace"
        description="Non-diagnostic workspace comparing model risk outputs, TreeSHAP attributions, and behavioral profiles between two patients."
      />

      {/* Input Selection Header */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full space-y-1">
            <label className="text-xs font-semibold text-muted block">Patient A ID / Code</label>
            <input
              type="text"
              placeholder="e.g. DEMO-PAT-101"
              value={patientA}
              onChange={(e) => setPatientA(e.target.value)}
              className="w-full rounded-xl border border-line bg-white/[0.03] px-3.5 py-2 text-xs text-text focus:border-primary focus:outline-none font-mono"
            />
          </div>

          <div className="pt-4 text-muted">
            <ArrowLeftRight className="size-5" />
          </div>

          <div className="flex-1 w-full space-y-1">
            <label className="text-xs font-semibold text-muted block">Patient B ID / Code</label>
            <input
              type="text"
              placeholder="e.g. P-1002"
              value={patientB}
              onChange={(e) => setPatientB(e.target.value)}
              className="w-full rounded-xl border border-line bg-white/[0.03] px-3.5 py-2 text-xs text-text focus:border-primary focus:outline-none font-mono"
            />
          </div>

          <div className="sm:self-end pt-2 sm:pt-0">
            <Button onClick={handleCompare} icon={Users}>
              Compare Patients
            </Button>
          </div>
        </div>

        {error && <p className="text-xs text-danger font-semibold">{error}</p>}
      </div>

      {isLoading ? (
        <div className="glass-panel p-8 text-center text-muted">Comparing patient model intelligence...</div>
      ) : data ? (
        <div className="space-y-6">
          {/* Side-by-Side Comparison Cards */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* Patient A */}
            <div className="glass-panel p-6 border border-primary/20 bg-primary/5 space-y-4">
              <div className="flex justify-between items-start border-b border-line pb-3">
                <div>
                  <span className="badge badge-primary text-[10px] uppercase font-bold">Patient A</span>
                  <h3 className="font-bold text-base text-text mt-1">{data.patient_a.patient.patient_name}</h3>
                  <span className="font-mono text-xs text-muted">{data.patient_a.patient.patient_id}</span>
                </div>
                <span className="badge badge-primary text-xs font-bold font-mono">
                  {(data.patient_a.scorecard.combined_final_probability * 100).toFixed(1)}% ({data.patient_a.scorecard.risk_category})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-white/[0.02] p-2">
                  <span className="text-muted block">Clinical Prob:</span>
                  <span className="font-mono font-bold text-text">{(data.patient_a.scorecard.clinical_model_probability * 100).toFixed(1)}%</span>
                </div>
                <div className="rounded-lg bg-white/[0.02] p-2">
                  <span className="text-muted block">Keystroke Prob:</span>
                  <span className="font-mono font-bold text-text">{(data.patient_a.scorecard.keystroke_model_probability * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-muted block mb-2">Top Model Attributions:</span>
                <div className="space-y-1 text-xs">
                  {data.patient_a.top_attributions.map((attr: any) => (
                    <div key={attr.field} className="flex justify-between font-mono text-muted">
                      <span>{attr.feature}</span>
                      <span className={attr.contribution > 0 ? "text-danger" : "text-success"}>
                        {attr.contribution > 0 ? "+" : ""}{attr.contribution.toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Patient B */}
            <div className="glass-panel p-6 border border-blue/20 bg-blue/5 space-y-4">
              <div className="flex justify-between items-start border-b border-line pb-3">
                <div>
                  <span className="badge badge-blue text-[10px] uppercase font-bold">Patient B</span>
                  <h3 className="font-bold text-base text-text mt-1">{data.patient_b.patient.patient_name}</h3>
                  <span className="font-mono text-xs text-muted">{data.patient_b.patient.patient_id}</span>
                </div>
                <span className="badge badge-blue text-xs font-bold font-mono">
                  {(data.patient_b.scorecard.combined_final_probability * 100).toFixed(1)}% ({data.patient_b.scorecard.risk_category})
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-white/[0.02] p-2">
                  <span className="text-muted block">Clinical Prob:</span>
                  <span className="font-mono font-bold text-text">{(data.patient_b.scorecard.clinical_model_probability * 100).toFixed(1)}%</span>
                </div>
                <div className="rounded-lg bg-white/[0.02] p-2">
                  <span className="text-muted block">Keystroke Prob:</span>
                  <span className="font-mono font-bold text-text">{(data.patient_b.scorecard.keystroke_model_probability * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-muted block mb-2">Top Model Attributions:</span>
                <div className="space-y-1 text-xs">
                  {data.patient_b.top_attributions.map((attr: any) => (
                    <div key={attr.field} className="flex justify-between font-mono text-muted">
                      <span>{attr.feature}</span>
                      <span className={attr.contribution > 0 ? "text-danger" : "text-success"}>
                        {attr.contribution > 0 ? "+" : ""}{attr.contribution.toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Model Attribution Differences */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <BrainCircuit className="size-4 text-primary" /> Model Attribution Shift Differences (Patient B - Patient A)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-line bg-white/[0.02] text-muted">
                    <th className="p-3 font-semibold">Clinical Feature</th>
                    <th className="p-3 font-semibold text-right">Patient A SHAP</th>
                    <th className="p-3 font-semibold text-right">Patient B SHAP</th>
                    <th className="p-3 font-semibold text-right">Attribution Shift (Δ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40">
                  {data.attribution_differences.map((diff: any) => (
                    <tr key={diff.field} className="hover:bg-white/[0.01]">
                      <td className="p-3 font-bold text-text">{diff.feature}</td>
                      <td className="p-3 text-right font-mono text-muted">{diff.patient_a_contribution > 0 ? "+" : ""}{diff.patient_a_contribution.toFixed(4)}</td>
                      <td className="p-3 text-right font-mono text-muted">{diff.patient_b_contribution > 0 ? "+" : ""}{diff.patient_b_contribution.toFixed(4)}</td>
                      <td className="p-3 text-right font-mono font-bold text-primary">
                        {diff.attribution_delta > 0 ? "+" : ""}{diff.attribution_delta.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

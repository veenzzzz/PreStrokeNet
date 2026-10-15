import { Check, Copy, Download, FileText, Send, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "../../../components/Button";
import { useToast } from "../../../components/useToast";
import { apiFetch } from "../../../services/api";

interface ReferralData {
  referral_id: string;
  date: string;
  urgency: string;
  target_specialty: string;
  referring_clinician: {
    name: string;
    license: string;
    department: string;
    institution: string;
    phone: string;
    email: string;
  };
  patient: {
    name: string;
    patient_id: string;
    age: number;
    gender: string;
  };
  clinical_assessment: {
    risk_category: string;
    final_probability: number;
    clinical_probability: number;
    keystroke_probability: number;
    motor_degradation_detected: boolean;
    motor_shift_pct: number;
    dwell_ms: number;
    flight_ms: number;
    glucose: number;
    bmi: number;
    hypertension: string;
    heart_disease: string;
    smoking: string;
  };
  recommended_orders: string[];
  markdown_content: string;
}

interface ReferralLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  predictionId: number;
}

const SPECIALTY_OPTIONS = [
  "Vascular Neurology / Stroke Prevention Clinic",
  "Rapid-Access TIA Evaluation Clinic",
  "Comprehensive Neurocardiology / Arrhythmia Service",
  "Vascular Surgery / Carotid Intervention Service",
];

const PRIORITY_OPTIONS = [
  { value: "URGENT", label: "URGENT (<48 Hours)" },
  { value: "PRIORITY", label: "PRIORITY (<2 Weeks)" },
  { value: "ROUTINE", label: "ROUTINE (<30 Days)" },
];

export function ReferralLetterModal({ isOpen, onClose, predictionId }: ReferralLetterModalProps) {
  const { notify } = useToast();
  const [specialty, setSpecialty] = useState(SPECIALTY_OPTIONS[0]);
  const [priority, setPriority] = useState("URGENT");
  const [customNotes, setCustomNotes] = useState("");
  const [data, setData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !predictionId) return;
    setIsLoading(true);
    apiFetch(`/predictions/${predictionId}/referral-letter?specialty=${encodeURIComponent(specialty)}&priority=${encodeURIComponent(priority)}`)
      .then((res) => setData(res))
      .catch(() => notify({ type: "error", title: "Failed to generate referral letter" }))
      .finally(() => setIsLoading(false));
  }, [isOpen, predictionId, specialty, priority, notify]);

  const handleRegenerateWithNotes = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch(`/predictions/${predictionId}/referral-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_specialty: specialty,
          priority,
          clinical_notes: customNotes,
        }),
      });
      setData(res);
      notify({ type: "success", title: "Referral letter updated with clinical notes" });
    } catch {
      notify({ type: "error", title: "Could not update referral letter" });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!data?.markdown_content) return;
    navigator.clipboard.writeText(data.markdown_content);
    setCopied(true);
    notify({ type: "success", title: "Referral letter copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadMarkdown = () => {
    if (!data?.markdown_content) return;
    const blob = new Blob([data.markdown_content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${data.referral_id || "Referral_Letter"}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    notify({ type: "success", title: "Referral letter (.md) downloaded" });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-line bg-surface shadow-2xl overflow-hidden font-sans">
        {/* HEADER */}
        <div className="flex items-center justify-between p-5 border-b border-line bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
              <Send className="size-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-primary tracking-wider block">Clinical Workflow</span>
              <h2 className="font-display text-lg font-bold text-text">Specialist Referral & TIA Consult Letter</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted hover:text-text hover:bg-white/5 transition"
            aria-label="Close modal"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* CONFIGURATION CONTROLS */}
          <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-xl border border-line/60 bg-white/[0.02]">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text" htmlFor="ref-specialty">
                Target Sub-Specialty
              </label>
              <select
                id="ref-specialty"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full text-xs rounded-lg border border-line bg-surface p-2.5 text-text focus:border-primary focus:outline-none"
              >
                {SPECIALTY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text" htmlFor="ref-priority">
                Referral Triage Priority
              </label>
              <select
                id="ref-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs rounded-lg border border-line bg-surface p-2.5 text-text focus:border-primary focus:outline-none"
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-text" htmlFor="ref-notes">
                Clinical Addendum & Presentation Notes (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  id="ref-notes"
                  type="text"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g., Patient experienced 5-minute episode of expressive dysphasia and right hand clumsiness yesterday..."
                  className="flex-1 text-xs rounded-lg border border-line bg-surface p-2.5 text-text focus:border-primary focus:outline-none font-mono"
                />
                <Button variant="secondary" onClick={handleRegenerateWithNotes} isLoading={isLoading}>
                  Apply
                </Button>
              </div>
            </div>
          </div>

          {/* PREVIEW CONTAINER */}
          {isLoading && !data ? (
            <div className="p-12 text-center text-muted font-mono animate-pulse">
              Compiling clinical consultation letter...
            </div>
          ) : data ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted font-mono">
                <span>Reference: <strong className="text-text">{data.referral_id}</strong></span>
                <span className="badge bg-primary/10 text-primary border border-primary/20 uppercase font-bold">
                  {data.urgency}
                </span>
              </div>

              {/* RENDERED LETTER */}
              <div className="rounded-xl border border-line bg-white/[0.01] p-5 font-mono text-xs text-text leading-relaxed whitespace-pre-wrap select-text max-h-96 overflow-y-auto border-l-4 border-l-primary">
                {data.markdown_content}
              </div>
            </div>
          ) : null}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-line bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={copied ? Check : Copy}
              onClick={copyToClipboard}
              disabled={!data}
            >
              {copied ? "Copied" : "Copy to Clipboard"}
            </Button>
            <Button
              variant="secondary"
              icon={Download}
              onClick={downloadMarkdown}
              disabled={!data}
            >
              Download (.md)
            </Button>
          </div>
          <Button variant="primary" icon={FileText} onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

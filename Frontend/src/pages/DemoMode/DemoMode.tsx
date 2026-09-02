import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  PlayCircle,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../components/Button";

export function DemoMode() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);

  const demoSteps = [
    { id: 1, title: "Select Demo Patient", desc: "Choose synthetic patient record DEMO-360-1 with historical risk shifts." },
    { id: 2, title: "Patient 360° Workspace", desc: "Examine complete multi-assessment patient record and decision-support summary." },
    { id: 3, title: "Decision Fusion Breakdown", desc: "Review 70/30 clinical + keystroke probability fusion calculation." },
    { id: 4, title: "TreeSHAP Explainability", desc: "Inspect model attributions explaining output score direction." },
    { id: 5, title: "Keystroke Timing Profile", desc: "Evaluate motor timing parameters (hold time, flight latency)." },
    { id: 6, title: "Workflow Stepper Review", desc: "Transition state machine status (New → In Review → Reviewed)." },
    { id: 7, title: "Schedule Follow-up", desc: "Set clinician reminder date for post-assessment follow-up." },
    { id: 8, title: "Contextual AI Assistance", desc: "Ask AI Assistant grounded questions regarding patient history." },
    { id: 9, title: "Export Custom Report", desc: "Generate section-selected PDF summary report." },
  ];

  return (
    <div className="page-canvas space-y-7">
      {/* DEMO MODE HEADER BADGE */}
      <div className="glass-panel p-6 border-warning/40 bg-warning/5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="badge badge-warning text-xs uppercase font-extrabold tracking-wider px-3 py-1">
            ⚡ DEMONSTRATION MODE
          </span>
          <span className="text-xs font-mono text-muted">Guided Academic & Viva Clinical Walkthrough</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-text">
          PreStrokeNet Clinical Decision-Support Demonstration
        </h1>
        <p className="text-xs text-muted max-w-3xl leading-relaxed">
          This guided demonstration uses non-diagnostic synthetic records to showcase PreStrokeNet's integrated ML, TreeSHAP explainability, keystroke dynamics, risk change engine, and clinician work queue workflow.
        </p>
      </div>

      {/* STEP PROGRESSION BAR */}
      <div className="glass-panel p-6 space-y-6">
        <h2 className="font-display text-lg font-bold text-text flex items-center gap-2">
          <PlayCircle className="size-5 text-primary" /> Guided Walkthrough Steps
        </h2>

        <div className="grid gap-3 sm:grid-cols-3">
          {demoSteps.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveStep(s.id)}
              className={`p-4 rounded-xl border text-left transition ${
                activeStep === s.id
                  ? "border-primary bg-primary/10 shadow-md"
                  : "border-line bg-white/[0.02] hover:bg-white/[0.05]"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="font-bold text-primary">Step {s.id}</span>
                {activeStep === s.id && <CheckCircle2 className="size-4 text-primary" />}
              </div>
              <p className="font-bold text-sm text-text">{s.title}</p>
              <p className="text-xs text-muted mt-1">{s.desc}</p>
            </button>
          ))}
        </div>

        {/* ACTIVE STEP DETAILS */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 space-y-4">
          <h3 className="font-display text-xl font-bold text-text">
            Step {activeStep}: {demoSteps[activeStep - 1].title}
          </h3>
          <p className="text-xs text-muted leading-relaxed font-mono">
            {demoSteps[activeStep - 1].desc}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              icon={ArrowRight}
              onClick={() => navigate("/patients/DEMO-360-1/360")}
            >
              Open Demo Patient 360 Workspace
            </Button>
            <Button
              variant="secondary"
              icon={Bot}
              onClick={() => navigate("/clinical-assistant?patient_id=DEMO-360-1")}
            >
              Launch Grounded AI Assistant
            </Button>
            <Button
              variant="secondary"
              icon={Clock}
              onClick={() => navigate("/work-queue")}
            >
              View Clinician Work Queue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

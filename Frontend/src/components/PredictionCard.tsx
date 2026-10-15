import { CalendarDays, ShieldCheck, ArrowUpRight } from "lucide-react";
import type { PredictionRecord, PredictionResult, RiskLevel } from "../types";

/* ── Risk Badge ─────────────────────────────────────────────────────────── */
const riskBadgeClasses: Record<RiskLevel, string> = {
  low:    "badge badge-success",
  medium: "badge badge-warning",
  high:   "badge badge-danger",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <span className={riskBadgeClasses[level]}>
      {level} risk
    </span>
  );
}

/* ── Prediction list row ─────────────────────────────────────────────────── */
export function PredictionCard({ record }: { record: PredictionRecord }) {
  return (
    <div className="group flex items-center gap-4 border-b border-line py-4 px-1 transition-colors last:border-0 hover:bg-surface-strong rounded-lg">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: "var(--primary-dim)", color: "var(--primary)" }}
      >
        <ShieldCheck className="size-4" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text truncate">{record.patientName}</p>
        <p className="text-xs text-muted font-mono">{record.patientId}</p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden items-center gap-1.5 text-xs text-muted sm:flex">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          <span>
            {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(
              new Date(record.date)
            )}
          </span>
        </div>
        <span className="font-mono text-sm font-600 text-text" style={{ fontWeight: 600 }}>
          {record.score}%
        </span>
        <RiskBadge level={record.level} />
        <ArrowUpRight
          className="hidden size-4 text-muted/40 transition-all group-hover:text-muted sm:block"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

/* ── Empty/Loading/Result states for the risk score card ────────────────── */
function EmptyRiskState() {
  return (
    <div
      className="mt-6 flex flex-col items-center gap-4 rounded-xl border border-line p-8 text-center"
      style={{ background: "var(--surface-strong)" }}
      role="status"
    >
      <span
        className="flex size-14 items-center justify-center rounded-full"
        style={{ background: "var(--primary-dim)", color: "var(--primary)" }}
      >
        <ShieldCheck className="size-6" aria-hidden="true" />
      </span>
      <div>
        <p className="font-semibold text-text">Ready for assessment</p>
        <p className="mt-1 text-sm text-muted leading-relaxed">
          Complete the required clinical fields, then run the AI assessment.
        </p>
      </div>
    </div>
  );
}

function LoadingRiskState() {
  return (
    <div
      className="mt-6 flex flex-col items-center gap-5 py-8"
      role="status"
      aria-label="Analyzing patient data"
    >
      <div className="relative flex size-44 items-center justify-center">
        {/* Outer ring */}
        <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--line)" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="44"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="6"
            strokeDasharray="276"
            strokeDashoffset="207"
            strokeLinecap="round"
            style={{ animation: "gauge-spin 1.2s linear infinite", transformOrigin: "center" }}
          />
        </svg>
        <div className="relative flex flex-col items-center gap-1">
          <span
            className="size-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--primary)" }}
            aria-hidden="true"
          />
          <span className="text-xs text-muted">analyzing</span>
        </div>
      </div>
      <p className="text-sm text-muted animate-pulse">Processing clinical and keystroke data…</p>
    </div>
  );
}

function ResultRiskState({ result }: { result: PredictionResult }) {
  const score = result.score;
  const riskColor: Record<RiskLevel, string> = {
    low:    "var(--risk-low)",
    medium: "var(--risk-medium)",
    high:   "var(--risk-high)",
  };
  const color = riskColor[result.level];

  // Gauge calculation
  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="mt-6 flex flex-col items-center text-center">
      {/* Gauge */}
      <div className="relative flex size-44 items-center justify-center">
        <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--line)" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="44"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
              filter: `drop-shadow(0 0 6px color-mix(in srgb, ${color} 50%, transparent))`,
            }}
          />
        </svg>
        <div className="relative flex flex-col items-center">
          <span
            className="font-mono text-4xl font-700 leading-none"
            style={{ color, fontWeight: 700 }}
          >
            {score}%
          </span>
          <span className="mt-1 text-xs text-muted">estimated risk</span>
        </div>
      </div>

      <div className="mt-5">
        <RiskBadge level={result.level} />
      </div>

      <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">{result.summary}</p>

      {/* Probability breakdown */}
      <dl className="mt-6 w-full grid grid-cols-1 gap-2 sm:grid-cols-3 text-left">
        {[
          { label: "Clinical", value: result.clinicalProbability },
          { label: "Keystroke", value: result.keystrokeProbability },
          { label: "Combined", value: result.finalProbability, highlight: true },
        ].map(({ label, value, highlight }) => (
          <div
            key={label}
            className="rounded-lg border p-3"
            style={{
              borderColor: highlight ? `color-mix(in srgb, ${color} 30%, var(--line))` : "var(--line)",
              background: highlight ? `color-mix(in srgb, ${color} 8%, var(--surface-strong))` : "var(--surface-strong)",
            }}
          >
            <dt className="text-xs text-muted mb-1">{label} probability</dt>
            <dd
              className="font-mono text-lg font-600 leading-none"
              style={{ color: highlight ? color : "var(--text)", fontWeight: 600 }}
            >
              {value.toFixed(1)}%
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ── Risk score card wrapper ─────────────────────────────────────────────── */
export function RiskScoreCard({
  result,
  error,
  isLoading,
}: {
  result: PredictionResult | null;
  error?: string | null;
  isLoading: boolean;
}) {
  return (
    <section
      className="rounded-xl border border-line p-5"
      style={{ background: "var(--surface)" }}
      aria-live="polite"
      aria-busy={isLoading}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="section-label">AI Assessment</p>
          <h2 className="mt-1 text-base font-bold text-text">Risk Overview</h2>
        </div>
        <ShieldCheck className="size-5 text-muted" aria-hidden="true" />
      </div>

      {error && (
        <div
          className="mt-4 rounded-lg border px-4 py-3 text-sm"
          style={{
            background: "var(--danger-dim)",
            borderColor: "color-mix(in srgb, var(--danger) 30%, transparent)",
            color: "var(--danger)",
          }}
          role="alert"
        >
          {error}
        </div>
      )}

      {isLoading ? (
        <LoadingRiskState />
      ) : result ? (
        <ResultRiskState result={result} />
      ) : error ? (
        <div
          className="mt-6 rounded-lg border border-line p-4 text-sm text-muted text-center"
        >
          Unable to calculate risk. Check the service status and try again.
        </div>
      ) : (
        <EmptyRiskState />
      )}
    </section>
  );
}

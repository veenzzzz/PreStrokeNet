import { ArrowUpRight, CalendarDays, ShieldCheck } from "lucide-react";
import type { PredictionRecord, PredictionResult, RiskLevel } from "../types";

const riskStyles: Record<RiskLevel, string> = {
  low: "border-success/20 bg-success/10 text-success",
  medium: "border-warning/20 bg-warning/10 text-warning",
  high: "border-danger/20 bg-danger/10 text-danger",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${riskStyles[level]}`}>{level} risk</span>;
}

export function PredictionCard({ record }: { record: PredictionRecord }) {
  return (
    <div className="group flex flex-col gap-4 border-b border-line py-4 transition-colors last:border-0 hover:bg-white/[0.025] sm:flex-row sm:items-center sm:justify-between sm:px-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text">{record.patientName}</p>
          <p className="mt-1 text-xs text-muted">{record.patientId}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-5 sm:justify-end">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          <span>{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(record.date))}</span>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm text-text">{record.score}%</p>
          <p className="mt-1 text-[11px] text-muted">{record.confidence}% confidence</p>
        </div>
        <RiskBadge level={record.level} />
        <ArrowUpRight className="hidden size-4 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
      </div>
    </div>
  );
}

function EmptyRiskState() {
  return (
    <div className="mt-8 rounded-2xl border border-line bg-app/35 p-5" role="status">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-medium text-text">Ready for assessment</p>
          <p className="mt-1 text-sm leading-6 text-muted">Complete the required model fields, then run the AI assessment.</p>
        </div>
      </div>
    </div>
  );
}

function LoadingRiskState() {
  return (
    <div className="mt-8 flex flex-col items-center text-center" role="status" aria-label="Analyzing patient data">
      <div className="relative flex size-48 items-center justify-center rounded-full" style={{ background: "conic-gradient(var(--primary) 24%, color-mix(in srgb, var(--line) 70%, transparent) 0)" }}>
        <div className="flex size-40 flex-col items-center justify-center rounded-full bg-app">
          <span className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden="true" />
          <span className="mt-3 text-xs text-muted">analyzing</span>
        </div>
      </div>
    </div>
  );
}

function ResultRiskState({ result }: { result: PredictionResult }) {
  const score = result.score;

  return (
    <div className="mt-8 flex flex-col items-center text-center">
      <div className="relative flex size-48 items-center justify-center rounded-full" style={{ background: `conic-gradient(var(--primary) ${score}%, color-mix(in srgb, var(--line) 70%, transparent) 0)` }}>
        <div className="flex size-40 flex-col items-center justify-center rounded-full bg-app">
          <span className="font-mono text-5xl font-medium tracking-tight text-text">{score}%</span>
          <span className="mt-1 text-xs text-muted">estimated risk</span>
        </div>
      </div>
      <div className="mt-6"><RiskBadge level={result.level} /></div>
      <p className="mt-4 max-w-sm text-sm leading-6 text-muted">{result.summary}</p>
      <dl className="mt-6 grid w-full gap-3 text-left sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-white/[0.02] p-3"><dt className="text-xs text-muted">Clinical probability</dt><dd className="mt-1 font-mono text-lg text-text">{result.clinicalProbability.toFixed(1)}%</dd></div>
        <div className="rounded-xl border border-line bg-white/[0.02] p-3"><dt className="text-xs text-muted">Keystroke probability</dt><dd className="mt-1 font-mono text-lg text-text">{result.keystrokeProbability.toFixed(1)}%</dd></div>
        <div className="rounded-xl border border-line bg-white/[0.02] p-3"><dt className="text-xs text-muted">Final probability</dt><dd className="mt-1 font-mono text-lg text-text">{result.finalProbability.toFixed(1)}%</dd></div>
        <div className="rounded-xl border border-line bg-white/[0.02] p-3"><dt className="text-xs text-muted">Risk level</dt><dd className="mt-2"><RiskBadge level={result.level} /></dd></div>
      </dl>
    </div>
  );
}

export function RiskScoreCard({ result, error, isLoading }: { result: PredictionResult | null; error?: string | null; isLoading: boolean }) {
  return (
    <section className="glass-panel relative overflow-hidden p-6 sm:p-7" aria-live="polite" aria-busy={isLoading}>
      <div className="relative">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">AI assessment</p>
            <h2 className="mt-2 font-display text-2xl font-bold text-text">Risk overview</h2>
          </div>
          <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
        </div>

        {error ? <div className="mt-6 rounded-xl border border-danger/25 bg-danger/8 px-3.5 py-3 text-sm text-danger" role="alert">{error}</div> : null}
        {isLoading ? <LoadingRiskState /> : result ? <ResultRiskState result={result} /> : error ? <p className="mt-8 rounded-xl border border-danger/20 bg-danger/5 p-4 text-sm leading-6 text-danger">Unable to calculate risk. Check the service status and try again.</p> : <EmptyRiskState />}
      </div>
    </section>
  );
}

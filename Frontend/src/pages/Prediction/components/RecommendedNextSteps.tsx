import { Stethoscope } from "lucide-react";

import { Button } from "../../../components/Button";

export function RecommendedNextSteps() {
  return (
    <section className="glass-panel p-6 sm:p-7">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-success/10 text-success">
          <Stethoscope className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-success">Recommended next steps</p>
          <h2 className="mt-1 font-display text-xl font-bold text-text">Support the review</h2>
        </div>
      </div>
      <ul className="mt-6 space-y-3 text-sm leading-6 text-muted">
        <li className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />Review blood pressure and modifiable risk factors.</li>
        <li className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />Document clinical context for the care team.</li>
        <li className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />Escalate according to local clinical protocols.</li>
      </ul>
      <Button className="mt-6 w-full" variant="secondary" onClick={() => window.print()}>Download report</Button>
    </section>
  );
}

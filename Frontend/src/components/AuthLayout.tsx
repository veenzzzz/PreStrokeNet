import { Activity, BrainCircuit, ShieldCheck, Sparkles } from "lucide-react";
import { Link, Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-app text-text">
      <div className="subtle-grid pointer-events-none absolute inset-x-0 top-0 h-[70vh] opacity-60" />
      <div className="pointer-events-none absolute -left-32 top-20 size-96 rounded-full bg-primary/8 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-0 size-[30rem] rounded-full bg-blue/10 blur-3xl" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="hidden flex-col justify-between px-8 py-10 lg:flex xl:px-16">
          <Link to="/login" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary"><Activity className="size-5" aria-hidden="true" /></span>
            <span className="font-display text-lg font-bold tracking-tight">PreStrokeNet</span>
          </Link>
          <div className="max-w-xl">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/7 px-3 py-1.5 text-xs font-medium text-primary"><Sparkles className="size-3.5" aria-hidden="true" /> Early insight. Better outcomes.</div>
            <h1 className="font-display text-6xl font-bold leading-[0.98] tracking-[-0.045em] text-text">Clarity for every <span className="gradient-text">clinical decision.</span></h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-muted">A calm, intelligent workspace that helps care teams spot stroke risk earlier and turn patient data into decisive next steps.</p>
            <div className="mt-12 grid max-w-lg grid-cols-2 gap-3">
              <div className="glass-panel p-4"><BrainCircuit className="size-5 text-primary" aria-hidden="true" /><p className="mt-5 text-sm font-medium text-text">AI-assisted assessments</p><p className="mt-1 text-xs text-muted">Built for thoughtful clinical review.</p></div>
              <div className="glass-panel p-4"><ShieldCheck className="size-5 text-success" aria-hidden="true" /><p className="mt-5 text-sm font-medium text-text">Privacy-first workflow</p><p className="mt-1 text-xs text-muted">Secure by design, focused on care.</p></div>
            </div>
          </div>
          <p className="text-xs text-muted">© 2026 PreStrokeNet · Clinical intelligence platform</p>
        </section>
        <section className="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md"><div className="mb-8 flex items-center gap-3 lg:hidden"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary"><Activity className="size-5" aria-hidden="true" /></span><span className="font-display text-lg font-bold">PreStrokeNet</span></div><Outlet /></div>
        </section>
      </div>
    </main>
  );
}

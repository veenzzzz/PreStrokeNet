import { BrainCircuit, HeartPulse, ShieldCheck, Sparkles } from "lucide-react";
import { Link, Outlet } from "react-router-dom";

const features = [
  {
    icon: BrainCircuit,
    title: "AI-assisted assessments",
    description: "Combined clinical and keystroke biometrics for layered risk analysis.",
  },
  {
    icon: ShieldCheck,
    title: "Explainable predictions",
    description: "SHAP-based feature attribution for transparent clinical review.",
  },
];

export function AuthLayout() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-app text-text">
      {/* Background elements */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 15% 40%, color-mix(in srgb, var(--primary) 6%, transparent), transparent), " +
            "radial-gradient(ellipse 50% 50% at 85% 60%, color-mix(in srgb, var(--blue) 7%, transparent), transparent)",
        }}
      />
      <div className="subtle-grid pointer-events-none absolute inset-x-0 top-0 h-[60vh] opacity-50" />

      <div className="relative mx-auto grid min-h-screen max-w-[1400px] grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left panel — branding */}
        <section className="hidden flex-col justify-between px-10 py-10 lg:flex xl:px-16">
          <Link to="/login" className="flex items-center gap-3 w-fit" aria-label="PreStrokeNet home">
            <span
              className="flex size-9 items-center justify-center rounded-lg"
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, var(--blue) 100%)",
              }}
            >
              <HeartPulse className="size-4.5 text-app" aria-hidden="true" />
            </span>
            <span className="text-base font-bold tracking-tight text-text">PreStrokeNet</span>
          </Link>

          {/* Hero text */}
          <div className="max-w-lg">
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
              style={{
                borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)",
                background: "var(--primary-dim)",
                color: "var(--primary)",
              }}
            >
              <Sparkles className="size-3.5" aria-hidden="true" />
              Clinical intelligence platform
            </div>

            <h1 className="text-5xl font-800 leading-[1.05] tracking-[-0.04em] xl:text-6xl" style={{ fontWeight: 800 }}>
              Smarter decisions.{" "}
              <span className="gradient-text">Earlier insight.</span>
            </h1>

            <p className="mt-6 text-base leading-7 text-muted max-w-md">
              A precision clinical workspace that transforms patient data into transparent, explainable stroke risk assessments — designed for confident, evidence-based care.
            </p>

            {/* Feature cards */}
            <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-line p-4"
                  style={{ background: "var(--surface)" }}
                >
                  <feature.icon
                    className="size-5 mb-3"
                    style={{ color: "var(--primary)" }}
                    aria-hidden="true"
                  />
                  <p className="text-sm font-semibold text-text leading-tight">{feature.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted">
            © 2026 PreStrokeNet · For research and clinical decision support
          </p>
        </section>

        {/* Right panel — form */}
        <section className="flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-sm">
            {/* Mobile logo */}
            <Link to="/login" className="mb-8 flex items-center gap-3 lg:hidden" aria-label="PreStrokeNet home">
              <span
                className="flex size-9 items-center justify-center rounded-lg"
                style={{ background: "linear-gradient(135deg, var(--primary) 0%, var(--blue) 100%)" }}
              >
                <HeartPulse className="size-4.5 text-app" aria-hidden="true" />
              </span>
              <span className="text-base font-bold text-text">PreStrokeNet</span>
            </Link>
            <Outlet />
          </div>
        </section>
      </div>
    </main>
  );
}

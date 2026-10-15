import { type LucideIcon } from "lucide-react";

interface DashboardCardProps {
  label: string;
  value: string;
  trend?: string;
  icon: LucideIcon;
  tone?: "primary" | "blue" | "indigo" | "success" | "warning" | "danger";
  sublabel?: string;
}

const toneConfig: Record<
  string,
  { bg: string; text: string; border: string; glow: string }
> = {
  primary: {
    bg: "var(--primary-dim)",
    text: "var(--primary)",
    border: "color-mix(in srgb, var(--primary) 20%, transparent)",
    glow: "color-mix(in srgb, var(--primary) 8%, transparent)",
  },
  blue: {
    bg: "var(--blue-dim)",
    text: "var(--blue)",
    border: "color-mix(in srgb, var(--blue) 20%, transparent)",
    glow: "color-mix(in srgb, var(--blue) 8%, transparent)",
  },
  indigo: {
    bg: "var(--indigo-dim)",
    text: "var(--indigo)",
    border: "color-mix(in srgb, var(--indigo) 20%, transparent)",
    glow: "color-mix(in srgb, var(--indigo) 8%, transparent)",
  },
  success: {
    bg: "var(--success-dim)",
    text: "var(--success)",
    border: "color-mix(in srgb, var(--success) 20%, transparent)",
    glow: "color-mix(in srgb, var(--success) 8%, transparent)",
  },
  warning: {
    bg: "var(--warning-dim)",
    text: "var(--warning)",
    border: "color-mix(in srgb, var(--warning) 20%, transparent)",
    glow: "color-mix(in srgb, var(--warning) 8%, transparent)",
  },
  danger: {
    bg: "var(--danger-dim)",
    text: "var(--danger)",
    border: "color-mix(in srgb, var(--danger) 20%, transparent)",
    glow: "color-mix(in srgb, var(--danger) 8%, transparent)",
  },
};

export function DashboardCard({
  label,
  value,
  trend,
  icon: Icon,
  tone = "primary",
  sublabel,
}: DashboardCardProps) {
  const config = toneConfig[tone];

  return (
    <article
      className="group relative overflow-hidden rounded-xl border p-5 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: "var(--surface)",
        borderColor: "var(--line)",
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {/* Background glow */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full blur-2xl transition-all duration-500 group-hover:scale-150"
        style={{ background: config.glow }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted">{label}</p>
          <p
            className="metric-value mt-2.5 text-3xl font-600 text-text"
            style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}
          >
            {value}
          </p>
          {trend && (
            <p className="mt-2 text-[11px] font-medium" style={{ color: config.text }}>
              {trend}
            </p>
          )}
          {sublabel && (
            <p className="mt-1 text-[11px] text-muted">{sublabel}</p>
          )}
        </div>
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: config.bg, color: config.text }}
        >
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

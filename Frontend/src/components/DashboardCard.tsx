import type { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  label: string;
  value: string;
  trend: string;
  icon: LucideIcon;
  tone?: "primary" | "blue" | "success" | "warning" | "danger";
}

const toneClasses = {
  primary: "bg-primary/10 text-primary",
  blue: "bg-blue/10 text-blue",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
};

export function DashboardCard({ label, value, trend, icon: Icon, tone = "primary" }: DashboardCardProps) {
  return (
    <article className="glass-panel group relative overflow-hidden p-5 transition-transform duration-300 hover:-translate-y-1">
      <div className="absolute -right-10 -top-10 size-28 rounded-full bg-primary/5 blur-2xl transition-transform duration-500 group-hover:scale-150" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-3 font-mono text-3xl font-medium tracking-tight text-text">{value}</p>
          <p className="mt-3 text-xs font-medium text-success">{trend}</p>
        </div>
        <span className={`flex size-10 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

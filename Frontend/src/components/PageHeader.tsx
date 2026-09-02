import { ArrowRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: { label: string; to: string; icon?: LucideIcon };
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  const ActionIcon = action?.icon ?? ArrowRight;

  return (
    <div className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-[-0.035em] text-text sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>
      </div>
      {action ? <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-app shadow-[0_10px_35px_color-mix(in_srgb,var(--primary)_18%,transparent)] transition-all duration-200 hover:bg-primary-strong hover:shadow-[0_12px_40px_color-mix(in_srgb,var(--primary)_28%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" to={action.to}>{action.label}<ActionIcon className="size-4" aria-hidden="true" /></Link> : null}
    </div>
  );
}

export function PageLink({ to, children }: { to: string; children: string }) {
  return <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-app shadow-[0_10px_35px_color-mix(in_srgb,var(--primary)_18%,transparent)] transition-all duration-200 hover:bg-primary-strong hover:shadow-[0_12px_40px_color-mix(in_srgb,var(--primary)_28%,transparent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" to={to}>{children}<ArrowRight className="size-4" aria-hidden="true" /></Link>;
}

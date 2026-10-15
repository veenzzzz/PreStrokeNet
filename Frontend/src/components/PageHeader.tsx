import { ArrowRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { label: string; to: string; icon?: LucideIcon; onClick?: () => void };
  children?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, description, action, children }: PageHeaderProps) {
  const ActionIcon = action?.icon ?? ArrowRight;

  return (
    <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="section-label mb-2">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
        )}
        {children}
      </div>
      {action && (
        action.onClick ? (
          <button
            onClick={action.onClick}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-app shadow-[var(--shadow-primary)] transition-all duration-150 hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-app"
          >
            {action.label}
            <ActionIcon className="size-4" aria-hidden="true" />
          </button>
        ) : (
          <Link
            to={action.to}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-app shadow-[var(--shadow-primary)] transition-all duration-150 hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-app"
          >
            {action.label}
            <ActionIcon className="size-4" aria-hidden="true" />
          </Link>
        )
      )}
    </div>
  );
}

export function PageLink({ to, children }: { to: string; children: string }) {
  return (
    <Link
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-app shadow-[var(--shadow-primary)] transition-all duration-150 hover:bg-primary-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      to={to}
    >
      {children}
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  );
}

/** Section header within a page, smaller than PageHeader */
export function SectionHeader({
  label,
  title,
  action,
}: {
  label?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
      <div>
        {label && <p className="section-label mb-1">{label}</p>}
        <h2 className="text-base font-bold text-text">{title}</h2>
      </div>
      {action}
    </div>
  );
}

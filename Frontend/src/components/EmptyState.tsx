import { InboxIcon, type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon: Icon = InboxIcon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <span
        className="flex size-12 items-center justify-center rounded-xl"
        style={{ background: "var(--surface-strong)", color: "var(--muted)" }}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm font-semibold text-text">{title}</p>
        {description && (
          <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted">{description}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

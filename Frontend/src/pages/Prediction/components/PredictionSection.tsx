import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface PredictionSectionProps {
  icon: LucideIcon;
  iconColor?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function PredictionSection({
  icon: Icon,
  iconColor = "var(--primary)",
  title,
  description,
  children,
  className = "",
}: PredictionSectionProps) {
  return (
    <section
      className={`rounded-xl border border-line p-5 sm:p-6 ${className}`}
      style={{ background: "var(--surface)" }}
    >
      <div className="flex items-start gap-3 mb-5">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: `color-mix(in srgb, ${iconColor} 12%, transparent)`,
            color: iconColor,
          }}
        >
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-text">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs leading-5 text-muted">{description}</p>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}

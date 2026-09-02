import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface PredictionSectionProps {
  icon: LucideIcon;
  iconClassName?: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function PredictionSection({ icon: Icon, iconClassName = "bg-primary/10 text-primary", title, description, children }: PredictionSectionProps) {
  return (
    <section className="glass-panel p-6 sm:p-7">
      <div className="flex items-start gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}>
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-xl font-bold text-text">{title}</h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

import { FolderOpen } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <div className="glass-panel p-8 sm:p-12 text-center space-y-4 max-w-md mx-auto my-6">
      <div className="flex justify-center text-muted">
        {icon || <FolderOpen className="size-10 stroke-[1.5]" />}
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-base font-bold text-text">{title}</h3>
        <p className="text-xs text-muted leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button variant="secondary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

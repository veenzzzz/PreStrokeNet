import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Unable to load information",
  message = "An error occurred while fetching clinical data. Please verify network access and try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="glass-panel p-8 text-center space-y-4 max-w-md mx-auto my-6 border-danger/30 bg-danger/5">
      <div className="flex justify-center text-danger">
        <AlertTriangle className="size-10 stroke-[1.5]" />
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-base font-bold text-text">{title}</h3>
        <p className="text-xs text-muted leading-relaxed">{message}</p>
      </div>
      {onRetry && (
        <div className="pt-2">
          <Button variant="secondary" icon={RefreshCw} onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}

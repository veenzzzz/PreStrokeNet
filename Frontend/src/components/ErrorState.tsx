import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  title: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-4 rounded-xl border p-10 text-center"
      style={{
        borderColor: "color-mix(in srgb, var(--danger) 20%, var(--line))",
        background: "color-mix(in srgb, var(--danger) 3%, var(--surface))",
      }}
      role="alert"
    >
      <span
        className="flex size-12 items-center justify-center rounded-xl"
        style={{ background: "var(--danger-dim)", color: "var(--danger)" }}
      >
        <AlertCircle className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-base font-semibold text-text">{title}</p>
        {message && (
          <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted">{message}</p>
        )}
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

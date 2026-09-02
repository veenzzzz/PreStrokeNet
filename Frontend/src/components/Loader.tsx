import { LoaderCircle } from "lucide-react";

export function Loader({ label = "Loading", fullWidth = false }: { label?: string; fullWidth?: boolean }) {
  return (
    <div className={`flex items-center justify-center gap-2 text-sm text-muted ${fullWidth ? "w-full" : ""}`} role="status" aria-live="polite">
      <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

import type { InputHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  icon?: LucideIcon;
  trailing?: ReactNode;
  error?: string;
  hint?: string;
  meta?: string;
}

export function InputField({
  label,
  id,
  icon: Icon,
  trailing,
  error,
  hint,
  meta,
  className = "",
  ...props
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label
          className="text-sm font-medium text-text-secondary"
          htmlFor={id}
        >
          {label}
          {props.required && (
            <span className="ml-1 text-danger/80" aria-hidden="true">*</span>
          )}
        </label>
        {meta && (
          <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted/70">
            {meta}
          </span>
        )}
      </div>
      <div
        className={`field-shell ${error ? "border-danger/40 bg-danger-dim/30" : ""}`}
        style={{ paddingInline: "0.75rem", minHeight: "2.5rem" }}
      >
        {Icon && (
          <Icon
            className={`size-4 shrink-0 ${error ? "text-danger" : "text-muted"}`}
            aria-hidden="true"
          />
        )}
        <input
          id={id}
          className={`min-w-0 flex-1 bg-transparent py-2 text-sm text-text placeholder:text-muted/60 focus:outline-none ${className}`}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          {...props}
        />
        {trailing}
      </div>
      {error && (
        <p
          id={`${id}-error`}
          className="text-xs font-medium text-danger"
          role="alert"
        >
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

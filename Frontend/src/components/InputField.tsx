import type { LucideIcon } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

interface InputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  meta?: ReactNode;
  helper?: ReactNode;
  trailing?: ReactNode;
}

export function InputField({ label, icon: Icon, error, meta, helper, trailing, id, className = "", "aria-describedby": ariaDescribedBy, ...props }: InputFieldProps) {
  const helperId = helper && id ? `${id}-helper` : undefined;
  const errorId = error && id ? `${id}-error` : undefined;
  const describedBy = [ariaDescribedBy, helperId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <label className="block space-y-2" htmlFor={id}>
      <span className="flex flex-col gap-1 text-sm font-medium text-muted-strong sm:flex-row sm:items-center sm:justify-between">
        <span>{label}</span>
        {props.required || meta ? <span className="text-[11px] font-normal leading-4 text-muted sm:text-right">{props.required ? "Required" : meta}</span> : null}
      </span>
      <span className={`field-shell px-3.5 ${error ? "border-danger/65" : ""}`}>
        {Icon ? <Icon className="size-4 shrink-0 text-muted" aria-hidden="true" /> : null}
        <input
          id={id}
          className={`min-w-0 flex-1 bg-transparent py-3 text-sm text-text outline-hidden placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-55 ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        />
        {trailing}
      </span>
      {helper ? <span id={helperId} className="block text-[11px] leading-4 text-muted">{helper}</span> : null}
      {error ? <span id={errorId} className="block text-xs text-danger">{error}</span> : null}
    </label>
  );
}

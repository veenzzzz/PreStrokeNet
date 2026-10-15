import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  meta?: string;
  children: ReactNode;
  hint?: string;
}

export function SelectField({ id, label, value, onChange, required = false, meta, children, hint }: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-text-secondary" htmlFor={id}>
          {label}
          {required && (
            <span className="ml-1 text-danger/80" aria-hidden="true">*</span>
          )}
        </label>
        {meta && (
          <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted/70">{meta}</span>
        )}
      </div>
      <div className="field-shell relative" style={{ paddingInline: "0.75rem", minHeight: "2.5rem" }}>
        <select
          id={id}
          className="min-w-0 flex-1 appearance-none bg-transparent py-2 pr-7 text-sm text-text focus:outline-none cursor-pointer"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
        >
          {children}
        </select>
        <ChevronDown
          className="absolute right-3 size-3.5 text-muted pointer-events-none"
          aria-hidden="true"
        />
      </div>
      {hint && (
        <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

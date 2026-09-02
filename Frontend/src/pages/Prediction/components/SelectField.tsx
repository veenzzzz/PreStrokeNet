import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  meta?: ReactNode;
  children: ReactNode;
}

export function SelectField({ id, label, value, onChange, required = false, meta, children }: SelectFieldProps) {
  return (
    <label className="block space-y-2" htmlFor={id}>
      <span className="flex flex-col gap-1 text-sm font-medium text-muted-strong sm:flex-row sm:items-center sm:justify-between">
        <span>{label}</span>
        {required || meta ? <span className="text-[11px] font-normal leading-4 text-muted sm:text-right">{required ? "Required" : meta}</span> : null}
      </span>
      <span className="field-shell px-3.5 relative">
        <select
          id={id}
          className="min-w-0 flex-1 appearance-none bg-transparent py-3 pr-8 text-sm text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary cursor-pointer"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          style={{ colorScheme: "dark" }}
        >
          {children}
        </select>
        <ChevronDown className="absolute right-3.5 size-4 text-muted pointer-events-none" />
      </span>
    </label>
  );
}

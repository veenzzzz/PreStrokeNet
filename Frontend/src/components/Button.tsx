import { LoaderCircle, type LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: LucideIcon;
  isLoading?: boolean;
}

const variants = {
  primary: "bg-primary text-app shadow-[0_10px_35px_color-mix(in_srgb,var(--primary)_18%,transparent)] hover:bg-primary-strong hover:shadow-[0_12px_40px_color-mix(in_srgb,var(--primary)_28%,transparent)]",
  secondary: "border border-line-strong bg-white/5 text-text hover:border-primary/40 hover:bg-primary/8",
  ghost: "text-muted hover:bg-white/6 hover:text-text",
  danger: "border border-danger/20 bg-danger/8 text-danger hover:bg-danger/15",
};

export function Button({ variant = "primary", icon: Icon, isLoading = false, className = "", children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-55 ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

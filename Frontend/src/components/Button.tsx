import { LoaderCircle, type LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  isLoading?: boolean;
}

const variantClasses: Record<string, string> = {
  primary:
    "bg-primary text-app font-semibold hover:bg-primary-strong focus-visible:ring-primary disabled:opacity-50",
  secondary:
    "border border-line-strong bg-surface-strong text-text-secondary font-medium hover:border-primary/40 hover:bg-primary-dim hover:text-primary focus-visible:ring-primary disabled:opacity-50",
  ghost:
    "text-muted font-medium hover:bg-surface-strong hover:text-text focus-visible:ring-primary disabled:opacity-50",
  danger:
    "border border-danger/25 bg-danger-dim text-danger font-medium hover:bg-danger/20 focus-visible:ring-danger disabled:opacity-50",
  outline:
    "border border-line text-text-secondary font-medium hover:border-line-strong hover:text-text focus-visible:ring-primary disabled:opacity-50",
};

const sizeClasses: Record<string, string> = {
  sm: "h-8 gap-1.5 rounded-lg px-3 text-xs",
  md: "h-9 gap-2 rounded-lg px-4 text-sm",
  lg: "h-11 gap-2.5 rounded-xl px-5 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  icon: Icon,
  isLoading = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-app cursor-pointer disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${variant === "primary" ? "shadow-[var(--shadow-primary)]" : ""} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : Icon ? (
        <Icon className="size-4 shrink-0" aria-hidden="true" />
      ) : null}
      {children}
    </button>
  );
}

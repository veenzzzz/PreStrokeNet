import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { ToastContext, type ToastInput, type ToastType } from "./toastContext";

type Toast = ToastInput & { id: number };
const toastStyles: Record<ToastType, string> = { success: "border-success/25 bg-success/8", info: "border-primary/25 bg-primary/8", error: "border-danger/25 bg-danger/8" };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notify = useCallback((toast: ToastInput) => setToasts((current) => [...current.filter((item) => item.title !== toast.title), { ...toast, id: Date.now() }].slice(-4)), []);
  const dismiss = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);

  useEffect(() => {
    const timers = toasts.map((toast) => window.setTimeout(() => dismiss(toast.id), 5000));
    return () => timers.forEach(window.clearTimeout);
  }, [dismiss, toasts]);

  const value = useMemo(() => ({ notify }), [notify]);
  return <ToastContext.Provider value={value}>{children}{createPortal(<div className="fixed right-4 top-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">{toasts.map((toast) => { const Icon = toast.type === "success" ? CheckCircle2 : toast.type === "error" ? XCircle : Info; return <div key={toast.id} className={`flex items-start gap-3 rounded-xl border p-3 shadow-xl ${toastStyles[toast.type]}`} role={toast.type === "error" ? "alert" : "status"}><Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-text">{toast.title}</p>{toast.message ? <p className="mt-1 text-xs leading-5 text-muted">{toast.message}</p> : null}</div><button type="button" className="rounded-md p-1 text-muted hover:text-text" aria-label="Dismiss notification" onClick={() => dismiss(toast.id)}><X className="size-3.5" aria-hidden="true" /></button></div>; })}</div>, document.body)}</ToastContext.Provider>;
}

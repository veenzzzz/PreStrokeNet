import { createContext } from "react";

export type ToastType = "success" | "info" | "error";
export interface ToastInput { type: ToastType; title: string; message?: string; }
export interface ToastContextValue { notify: (toast: ToastInput) => void; }
export const ToastContext = createContext<ToastContextValue | null>(null);

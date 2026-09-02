import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

export function Unauthorized() {
  return <div className="flex min-h-screen items-center justify-center bg-app px-4 text-center"><div className="glass-panel max-w-md p-8"><span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-danger/10 text-danger"><ShieldAlert className="size-6" aria-hidden="true" /></span><p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-danger">Unauthorized</p><h1 className="mt-2 font-display text-3xl font-bold text-text">You do not have access</h1><p className="mt-3 text-sm leading-6 text-muted">Your account is signed in, but its role does not permit this clinical action.</p><Link className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-app" to="/dashboard">Return to dashboard</Link></div></div>;
}

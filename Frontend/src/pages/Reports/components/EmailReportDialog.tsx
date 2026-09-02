import { useEffect, useState, type FormEvent } from "react";

import { Button } from "../../../components/Button";
import { InputField } from "../../../components/InputField";
import type { EmailReportPayload } from "../../../types";

interface EmailReportDialogProps {
  open: boolean;
  patientLabel: string;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (payload: EmailReportPayload) => void;
}

export function EmailReportDialog({ open, patientLabel, isLoading, onClose, onSubmit }: EmailReportDialogProps) {
  const [form, setForm] = useState({ recipient: "", subject: `PreStrokeNet report — ${patientLabel}`, message: "Please find the attached PreStrokeNet clinical assessment report." });

  useEffect(() => {
    if (open) setForm({ recipient: "", subject: `PreStrokeNet report — ${patientLabel}`, message: "Please find the attached PreStrokeNet clinical assessment report." });
  }, [open, patientLabel]);

  if (!open) return null;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(form);
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-app/75 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
    <div className="glass-panel w-full max-w-lg p-6 sm:p-7" role="dialog" aria-modal="true" aria-labelledby="email-report-title">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Report delivery</p><h2 id="email-report-title" className="mt-2 font-display text-xl font-bold text-text">Email report</h2><p className="mt-1 text-sm text-muted">Send the PDF report for {patientLabel}.</p></div><button type="button" className="rounded-lg p-2 text-muted hover:bg-white/6 hover:text-text" aria-label="Close email dialog" onClick={onClose}>×</button></div>
      <form className="mt-6 space-y-4" onSubmit={submit}><InputField id="report-recipient" label="Recipient email" type="email" autoComplete="email" required value={form.recipient} onChange={(event) => setForm({ ...form, recipient: event.target.value })} /><InputField id="report-subject" label="Subject" required value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} /><label className="block space-y-2" htmlFor="report-message"><span className="text-sm font-medium text-muted-strong">Message</span><textarea id="report-message" className="field-shell min-h-28 w-full resize-y px-3.5 py-3 text-sm text-text outline-hidden" required value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} /></label><div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" isLoading={isLoading}>Send report</Button></div></form>
    </div>
  </div>;
}

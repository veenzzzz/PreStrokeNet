import { Download, Eye, FileText, Mail, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "../../../components/Button";
import { RiskBadge } from "../../../components/PredictionCard";
import type { PredictionSummary } from "../../../types";

interface ReportsTableProps {
  reports: PredictionSummary[];
  isLoading: boolean;
  onPdf: (id: number) => void;
  onExcel: (id: number) => void;
  onEmail: (id: number) => void;
  onDelete: (id: number) => void;
}

export function ReportsTable({ reports, isLoading, onPdf, onExcel, onEmail, onDelete }: ReportsTableProps) {
  if (isLoading) {
    return <div className="space-y-3 p-5" aria-label="Loading reports">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />)}</div>;
  }

  if (reports.length === 0) return <div className="p-10 text-center text-muted">No reports match the current search and filters.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] text-sm">
        <thead className="sticky top-0 z-10 border-b border-line bg-surface-strong text-xs text-muted">
          <tr><th className="px-5 py-4 text-left">Patient</th><th className="px-5 py-4 text-left">Age</th><th className="px-5 py-4 text-left">Gender</th><th className="px-5 py-4 text-left">Date</th><th className="px-5 py-4 text-left">Final probability</th><th className="px-5 py-4 text-left">Clinical</th><th className="px-5 py-4 text-left">Keystroke</th><th className="px-5 py-4 text-left">Risk</th><th className="px-5 py-4 text-right">Actions</th></tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const normalizedRisk = report.risk.toLowerCase() as "low" | "medium" | "high";
            return <tr key={report.id} className="border-b border-line transition-colors hover:bg-white/[0.025]">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-medium text-text">
                      {report.patient_id ? (
                        <Link to={`/patients/${report.patient_id}`} className="hover:underline text-primary">
                          {report.patient_name || "Unknown patient"}
                        </Link>
                      ) : (
                        report.patient_name || "Unknown patient"
                      )}
                    </p>
                    <p className="mt-1 text-xs text-muted font-mono">
                      {report.patient_id ? (
                        <Link to={`/patients/${report.patient_id}`} className="hover:underline text-muted">
                          {report.patient_id}
                        </Link>
                      ) : (
                        "No patient ID"
                      )}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 text-muted">{report.age ?? "—"}</td>
              <td className="px-5 py-4 text-muted">{report.gender === 1 ? "Male" : report.gender === 0 ? "Female" : "—"}</td>
              <td className="px-5 py-4 text-muted">{report.created_at ? new Date(report.created_at).toLocaleDateString() : "—"}</td>
              <td className="px-5 py-4 font-mono text-text">{(report.final_probability * 100).toFixed(1)}%</td>
              <td className="px-5 py-4 font-mono text-muted">{(report.clinical_probability * 100).toFixed(1)}%</td>
              <td className="px-5 py-4 font-mono text-muted">{(report.keystroke_probability * 100).toFixed(1)}%</td>
              <td className="px-5 py-4"><RiskBadge level={normalizedRisk} /></td>
              <td className="px-5 py-4"><div className="flex justify-end gap-1"><Link className="rounded-lg p-2 text-muted hover:bg-white/6 hover:text-text" to={`/predictions/${report.id}`} aria-label={`View report for ${report.patient_name || "patient"}`} title="View"><Eye className="size-4" aria-hidden="true" /></Link><Link className="rounded-lg p-2 text-muted hover:bg-white/6 hover:text-text" to={`/predictions/${report.id}?edit=1`} aria-label={`Edit report for ${report.patient_name || "patient"}`} title="Edit"><Pencil className="size-4" aria-hidden="true" /></Link><Button variant="ghost" icon={Download} aria-label="Download PDF" title="Download PDF" onClick={() => onPdf(report.id)} /><Button variant="ghost" icon={Download} aria-label="Download Excel" title="Download Excel" onClick={() => onExcel(report.id)} /><Button variant="ghost" icon={Mail} aria-label="Email report" title="Email report" onClick={() => onEmail(report.id)} /><Button variant="ghost" icon={Trash2} aria-label="Delete report" title="Delete report" onClick={() => onDelete(report.id)} /></div></td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>
  );
}

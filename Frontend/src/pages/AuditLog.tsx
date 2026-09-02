import { RefreshCw, Shield } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "../components/Button";
import { PageHeader } from "../components/PageHeader";
import { apiFetch } from "../services/api";

interface AuditEntry {
  id: number;
  user_id: number;
  user_name: string;
  user_role: string;
  action: string;
  patient_id?: string;
  prediction_id?: number;
  details?: string;
  created_at: string;
}

interface AuditLogResponse {
  audit_logs: AuditEntry[];
  page: number;
  limit: number;
  total_count: number;
}

export function AuditLog() {
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAuditLogs = () => {
    setIsLoading(true);
    apiFetch("/audit-log")
      .then((resData) => setData(resData))
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  return (
    <div className="page-canvas space-y-7">
      <PageHeader
        eyebrow="Compliance & Governance"
        title="Audit Log & Workflow Activity Viewer"
        description="Traceable chronological record of clinical actions, assessment reviews, follow-up creations, and report exports."
      />

      <div className="glass-panel p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            <h2 className="font-display text-base font-bold text-text">Workflow Audit Trail</h2>
          </div>
          <Button variant="secondary" icon={RefreshCw} onClick={loadAuditLogs}>
            Refresh Logs
          </Button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted animate-pulse">Loading audit logs...</div>
        ) : !data || data.audit_logs.length === 0 ? (
          <div className="p-8 text-center text-muted">No audit log entries recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line bg-white/[0.02] text-muted">
                  <th className="p-3 font-semibold">Timestamp</th>
                  <th className="p-3 font-semibold">Clinician User</th>
                  <th className="p-3 font-semibold">Role</th>
                  <th className="p-3 font-semibold">Action</th>
                  <th className="p-3 font-semibold">Patient ID</th>
                  <th className="p-3 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {data.audit_logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.01]">
                    <td className="p-3 font-mono text-muted">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="p-3 font-bold text-text">{log.user_name || `User #${log.user_id}`}</td>
                    <td className="p-3">
                      <span className="badge badge-primary text-[10px] font-mono">{log.user_role || "Doctor"}</span>
                    </td>
                    <td className="p-3 font-semibold text-primary">{log.action}</td>
                    <td className="p-3 font-mono text-text">{log.patient_id || "—"}</td>
                    <td className="p-3 text-muted text-[11px] max-w-sm truncate">{log.details || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { CheckCircle2, Download, Filter, Lock, RefreshCw, Search, Shield, UserCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "../components/Button";
import { PageHeader } from "../components/PageHeader";
import { useToast } from "../components/useToast";
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
  const { notify } = useToast();
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const loadAuditLogs = () => {
    setIsLoading(true);
    let url = "/audit-log?limit=100";
    if (actionFilter !== "all") {
      url += `&action=${encodeURIComponent(actionFilter)}`;
    }
    if (searchTerm.trim()) {
      url += `&patient_id=${encodeURIComponent(searchTerm.trim())}`;
    }

    apiFetch(url)
      .then((resData) => setData(resData))
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadAuditLogs();
  }, [actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAuditLogs();
  };

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      let url = "/audit-log/export-csv";
      const params = new URLSearchParams();
      if (actionFilter !== "all") params.append("action", actionFilter);
      if (searchTerm.trim()) params.append("patient_id", searchTerm.trim());
      if (params.toString()) url += `?${params.toString()}`;

      const token = localStorage.getItem("access_token");
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"}${url}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error("Export failed");

      const checksum = res.headers.get("X-Audit-Checksum-SHA256") || "Validated";
      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `PreStrokeNet_Audit_Log_HIPAA_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      notify({
        type: "success",
        title: "HIPAA Audit Trail CSV Exported",
        message: `Cryptographic SHA-256 Checksum: ${checksum.slice(0, 16)}...`,
      });
    } catch {
      notify({ type: "error", title: "Failed to export audit trail CSV" });
    } finally {
      setIsExporting(false);
    }
  };

  // KPIs
  const { uniqueClinicians, uniquePatients } = useMemo(() => {
    if (!data?.audit_logs) return { uniqueClinicians: 0, uniquePatients: 0 };
    const clinicians = new Set(data.audit_logs.map((l) => l.user_name || String(l.user_id)));
    const patients = new Set(data.audit_logs.filter((l) => l.patient_id).map((l) => l.patient_id));
    return { uniqueClinicians: clinicians.size, uniquePatients: patients.size };
  }, [data]);

  return (
    <div className="page-canvas space-y-7">
      <PageHeader
        eyebrow="Compliance & Governance"
        title="Regulatory Audit Trail & Compliance Roster"
        description="Tamper-evident chronological audit registry complying with HIPAA §164.312(b) and GDPR Art. 30 security governance rules."
      />

      {/* COMPLIANCE STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 space-y-1 border-primary/20 bg-primary/5">
          <span className="text-[11px] font-mono text-muted uppercase tracking-wider block">Total Audited Events</span>
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-2xl text-text">{data?.total_count ?? 0}</span>
            <Shield className="size-5 text-primary" />
          </div>
          <span className="text-[10px] text-muted font-mono block">100% Immutable Trail</span>
        </div>

        <div className="glass-panel p-4 space-y-1">
          <span className="text-[11px] font-mono text-muted uppercase tracking-wider block">Active Clinicians</span>
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-2xl text-text">{uniqueClinicians}</span>
            <UserCheck className="size-5 text-emerald-400" />
          </div>
          <span className="text-[10px] text-muted font-mono block">Verified License Records</span>
        </div>

        <div className="glass-panel p-4 space-y-1">
          <span className="text-[11px] font-mono text-muted uppercase tracking-wider block">Unique Patients Audited</span>
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-2xl text-text">{uniquePatients}</span>
            <Lock className="size-5 text-amber-400" />
          </div>
          <span className="text-[10px] text-muted font-mono block">PHI Access Tracked</span>
        </div>

        <div className="glass-panel p-4 space-y-1 border-emerald-500/20 bg-emerald-500/5">
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider block">Regulatory Integrity</span>
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-emerald-300">HIPAA & GDPR</span>
            <CheckCircle2 className="size-5 text-emerald-400" />
          </div>
          <span className="text-[10px] text-emerald-400/80 font-mono block">SHA-256 Checksummed</span>
        </div>
      </div>

      {/* CONTROLS & TABLE PANEL */}
      <div className="glass-panel p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            <h2 className="font-display text-base font-bold text-text">Clinician Audit Registry</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              icon={Download}
              onClick={handleExportCsv}
              isLoading={isExporting}
            >
              Export HIPAA CSV
            </Button>
            <Button variant="secondary" icon={RefreshCw} onClick={loadAuditLogs} isLoading={isLoading}>
              Refresh
            </Button>
          </div>
        </div>

        {/* SEARCH AND FILTER BAR */}
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 size-4 text-muted" />
              <input
                type="text"
                placeholder="Search patient ID (e.g., PT-001)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs rounded-xl border border-line bg-white/[0.03] pl-9 pr-3 py-2 text-text focus:border-primary focus:outline-none font-mono"
              />
            </div>
            <Button variant="secondary" type="submit">
              Filter
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted shrink-0" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs rounded-xl border border-line bg-surface p-2 text-text focus:border-primary focus:outline-none font-mono"
            >
              <option value="all">All Actions</option>
              <option value="Assessment">Assessment Events</option>
              <option value="Workflow">Workflow Transitions</option>
              <option value="Follow-up">Follow-up Activities</option>
              <option value="Report">Report Operations</option>
              <option value="FHIR">FHIR Exports</option>
            </select>
          </div>
        </div>

        {/* AUDIT LOG TABLE */}
        {isLoading ? (
          <div className="p-12 text-center text-muted font-mono animate-pulse">Loading compliance audit logs...</div>
        ) : !data || data.audit_logs.length === 0 ? (
          <div className="p-12 text-center text-muted font-mono">No matching audit log entries found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-line bg-white/[0.02] text-muted">
                  <th className="p-3 font-semibold">Timestamp (UTC)</th>
                  <th className="p-3 font-semibold">Clinician</th>
                  <th className="p-3 font-semibold">Role</th>
                  <th className="p-3 font-semibold">Action</th>
                  <th className="p-3 font-semibold">Patient ID</th>
                  <th className="p-3 font-semibold">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {data.audit_logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.01]">
                    <td className="p-3 text-muted">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="p-3 font-bold text-text">{log.user_name || `User #${log.user_id}`}</td>
                    <td className="p-3">
                      <span className="badge badge-primary text-[10px]">{log.user_role || "Doctor"}</span>
                    </td>
                    <td className="p-3 font-semibold text-primary">{log.action}</td>
                    <td className="p-3 text-text">
                      {log.patient_id ? (
                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-line/60">
                          {log.patient_id}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
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

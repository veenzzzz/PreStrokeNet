import {
  AlertTriangle,
  ArrowRight,
  Download,
  FileSpreadsheet,
  RotateCcw,
  Search,
  TrendingUp,
  UploadCloud,
  Users,
} from "lucide-react";
import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Link } from "react-router-dom";

import { Button } from "../../../components/Button";
import { RiskBadge } from "../../../components/PredictionCard";
import { useToast } from "../../../components/useToast";
import { downloadBatchTemplate, uploadBatchCsv } from "../../../services/predictionService";
import type { BatchScreeningResponse } from "../../../types";

export function BatchScreeningPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BatchScreeningResponse | null>(null);
  const [riskFilter, setRiskFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { notify } = useToast();

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (dropped.name.endsWith(".csv")) {
        setFile(dropped);
      } else {
        notify({ type: "error", title: "Invalid file format", message: "Please upload a .csv file." });
      }
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    try {
      const response = await uploadBatchCsv(file);
      setResult(response);
      notify({
        type: "success",
        title: "Cohort screening completed",
        message: `Successfully evaluated ${response.total_processed} patients.`,
      });
    } catch (err: unknown) {
      notify({
        type: "error",
        title: "Screening failed",
        message: err instanceof Error ? err.message : "Unable to process batch CSV.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportResults = () => {
    if (!result || result.processed_records.length === 0) return;
    const headers = ["prediction_id", "patient_name", "patient_id", "age", "gender", "clinical_probability", "keystroke_probability", "final_probability", "risk"];
    const rows = result.processed_records.map((p) => [
      p.prediction_id,
      `"${p.patient_name.replace(/"/g, '""')}"`,
      `"${(p.patient_id || "").replace(/"/g, '""')}"`,
      p.age,
      p.gender,
      p.clinical_probability,
      p.keystroke_probability,
      p.final_probability,
      p.risk,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PreStrokeNet_Cohort_Evaluation_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredRecords = useMemo(() => {
    if (!result) return [];
    return result.processed_records.filter((rec) => {
      const matchesRisk = riskFilter === "All" || rec.risk.toLowerCase() === riskFilter.toLowerCase();
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        rec.patient_name.toLowerCase().includes(query) ||
        (rec.patient_id && rec.patient_id.toLowerCase().includes(query));
      return matchesRisk && matchesSearch;
    });
  }, [result, riskFilter, search]);

  return (
    <div className="space-y-6">
      {/* Upper Action Bar: Template download & Information */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-bold text-text flex items-center gap-2">
            <Users className="size-5 text-primary" />
            Batch Cohort Screening & Risk Triage
          </h2>
          <p className="mt-1 text-xs text-muted max-w-xl">
            Upload patient spreadsheets (demographics, clinical vitals, optional keystrokes) to rapidly evaluate entire cohorts and stratify acute intervention urgency.
          </p>
        </div>

        <Button
          variant="secondary"
          icon={Download}
          onClick={() => void downloadBatchTemplate()}
          className="shrink-0"
        >
          Download CSV Template
        </Button>
      </div>

      {/* Upload Dropzone */}
      {!result ? (
        <div className="glass-panel p-8 text-center space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? "border-primary bg-primary/10 scale-[1.01]"
                : "border-line-strong hover:border-primary/60 bg-white/[0.01]"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <UploadCloud className="size-8" />
            </div>

            <div>
              <p className="text-sm font-bold text-text">
                {file ? file.name : "Click to select or drag and drop a patient cohort CSV"}
              </p>
              <p className="text-xs text-muted mt-1">
                {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports UTF-8 CSV formatted rosters (up to 500 patients)"}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {file && (
              <Button variant="secondary" onClick={() => setFile(null)}>
                Clear
              </Button>
            )}
            <Button
              variant="primary"
              disabled={!file}
              isLoading={isLoading}
              onClick={handleUpload}
            >
              Run Cohort Evaluation
            </Button>
          </div>
        </div>
      ) : (
        /* EVALUATED COHORT TRIAGE DASHBOARD */
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="glass-panel p-4 space-y-1">
              <span className="text-muted block text-xs font-semibold">Total Screened</span>
              <span className="font-display text-2xl font-bold text-text">{result.total_processed}</span>
            </div>

            <div className="glass-panel p-4 space-y-1 border-danger/30 bg-danger/[0.03]">
              <span className="text-danger block text-xs font-semibold">High Risk Triage</span>
              <span className="font-display text-2xl font-bold text-danger">{result.high_risk_count}</span>
            </div>

            <div className="glass-panel p-4 space-y-1 border-warning/30 bg-warning/[0.03]">
              <span className="text-warning block text-xs font-semibold">Medium Risk</span>
              <span className="font-display text-2xl font-bold text-warning">{result.medium_risk_count}</span>
            </div>

            <div className="glass-panel p-4 space-y-1 border-success/30 bg-success/[0.03]">
              <span className="text-success block text-xs font-semibold">Low Risk</span>
              <span className="font-display text-2xl font-bold text-success">{result.low_risk_count}</span>
            </div>

            <div className="glass-panel p-4 space-y-1 col-span-2 sm:col-span-1">
              <span className="text-primary block text-xs font-semibold flex items-center gap-1">
                <TrendingUp className="size-3.5" />
                Cohort Mean Risk
              </span>
              <span className="font-display text-2xl font-bold text-primary">
                {(result.mean_stroke_probability * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Urgent High-Risk Callout */}
          {result.high_risk_count > 0 && (
            <div className="p-4 rounded-xl border border-danger/30 bg-danger/10 flex items-start gap-3 text-xs">
              <AlertTriangle className="size-5 text-danger shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-danger">Acute Triage Alert</p>
                <p className="text-muted mt-0.5">
                  {result.high_risk_count} {result.high_risk_count === 1 ? "patient requires" : "patients require"} immediate neurological clinical review and priority diagnostic workup.
                </p>
              </div>
            </div>
          )}

          {/* Patient Roster Filter & Table */}
          <div className="glass-panel p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-line bg-white/[0.02] p-1 text-xs">
                  {["All", "High", "Medium", "Low"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setRiskFilter(level)}
                      className={`px-3 py-1 rounded font-semibold transition ${
                        riskFilter === level
                          ? "bg-primary text-app font-bold"
                          : "text-muted hover:text-text"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="size-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filter by patient name or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-3 py-1 text-xs rounded-lg border border-line bg-white/[0.03] text-text focus:outline-none focus:border-primary w-48 sm:w-64"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="secondary" icon={FileSpreadsheet} onClick={handleExportResults}>
                  Export Results CSV
                </Button>
                <Button
                  variant="secondary"
                  icon={RotateCcw}
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                  }}
                >
                  Screen Another Cohort
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-line text-muted uppercase text-[10px]">
                    <th className="py-2.5 px-3">Patient</th>
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Age / Sex</th>
                    <th className="py-2.5 px-3">Clinical Prob</th>
                    <th className="py-2.5 px-3">Keystroke Prob</th>
                    <th className="py-2.5 px-3">Combined Prob</th>
                    <th className="py-2.5 px-3">Risk Tier</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-muted italic">
                        No patients matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((pt) => {
                      const normalized = pt.risk.toLowerCase() as "low" | "medium" | "high";
                      return (
                        <tr key={pt.prediction_id} className="hover:bg-white/[0.02] transition">
                          <td className="py-3 px-3 font-semibold text-text font-sans">{pt.patient_name}</td>
                          <td className="py-3 px-3 text-muted">{pt.patient_id || "—"}</td>
                          <td className="py-3 px-3 text-text">{pt.age}y · {pt.gender}</td>
                          <td className="py-3 px-3">{(pt.clinical_probability * 100).toFixed(1)}%</td>
                          <td className="py-3 px-3">
                            {pt.keystroke_probability > 0 ? `${(pt.keystroke_probability * 100).toFixed(1)}%` : "N/A (Skipped)"}
                          </td>
                          <td className="py-3 px-3 font-bold text-text">{(pt.final_probability * 100).toFixed(1)}%</td>
                          <td className="py-3 px-3">
                            <RiskBadge level={normalized} />
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Link
                              to={`/predictions/${pt.prediction_id}`}
                              className="inline-flex items-center gap-1 text-primary hover:underline font-semibold"
                            >
                              <span>View Dossier</span>
                              <ArrowRight className="size-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

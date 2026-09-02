import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Button } from "../../components/Button";
import { PageHeader } from "../../components/PageHeader";
import { useToast } from "../../components/useToast";
import { getApiErrorMessage } from "../../services/authService";
import { deletePrediction, searchPredictions } from "../../services/predictionHistoryService";
import { downloadExcelExport, downloadExcel, downloadPdf, emailReport } from "../../services/reportService";
import type { EmailReportPayload, PredictionSearchParams, PredictionSort, PredictionSummary } from "../../types";
import { EmailReportDialog } from "./components/EmailReportDialog";
import { ReportFilters } from "./components/ReportFilters";
import { ReportPagination } from "./components/ReportPagination";
import { ReportsTable } from "./components/ReportsTable";

const initialFilters: Pick<PredictionSearchParams, "risk" | "min_age" | "max_age" | "gender" | "smoking_status" | "hypertension" | "heart_disease" | "residence_type" | "work_type" | "date_from" | "date_to"> = {};

export function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports] = useState<PredictionSummary[]>([]);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [filters, setFilters] = useState(initialFilters);
  const [sort, setSort] = useState<PredictionSort>("latest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [emailTarget, setEmailTarget] = useState<PredictionSummary | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const { notify } = useToast();

  const params = useMemo<PredictionSearchParams>(() => ({ page, page_size: pageSize, sort, ...(query.trim() ? { q: query.trim() } : {}), ...filters }), [filters, page, pageSize, query, sort]);

  useEffect(() => {
    const urlQuery = searchParams.get("q") ?? "";
    setQuery((current) => current === urlQuery ? current : urlQuery);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      searchPredictions(params).then((response) => {
        if (!active) return;
        setReports(response.items);
        setTotal(response.total);
        setTotalPages(response.total_pages);
        setError("");
      }).catch((requestError) => { if (active) setError(getApiErrorMessage(requestError, "Unable to load prediction reports.")); }).finally(() => { if (active) setIsLoading(false); });
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [params]);

  const changeFilters = (nextFilters: typeof filters) => { setFilters(nextFilters); setPage(1); };
  const changeSort = (nextSort: PredictionSort) => { setSort(nextSort); setPage(1); };
  const changePageSize = (nextPageSize: number) => { setPageSize(nextPageSize); setPage(1); };
  const changeQuery = (value: string) => { setQuery(value); setPage(1); setSearchParams(value.trim() ? { q: value.trim() } : {}); };
  const handleDownload = async (action: () => Promise<void>, title: string) => { try { await action(); notify({ type: "success", title }); } catch (requestError) { notify({ type: "error", title: `${title} failed`, message: getApiErrorMessage(requestError, "Unable to complete this report action.") }); } };
  const handleDelete = async (id: number) => { if (!window.confirm("Delete this prediction report? This cannot be undone.")) return; try { await deletePrediction(id); setReports((current) => current.filter((report) => report.id !== id)); notify({ type: "success", title: "Report deleted" }); } catch (requestError) { notify({ type: "error", title: "Delete failed", message: getApiErrorMessage(requestError, "Unable to delete this prediction.") }); } };
  const handleEmail = async (payload: EmailReportPayload) => { if (!emailTarget) return; setEmailLoading(true); try { await emailReport(emailTarget.id, payload); setEmailTarget(null); notify({ type: "success", title: "Email sent" }); } catch (requestError) { notify({ type: "error", title: "Email failed", message: getApiErrorMessage(requestError, "Unable to send this report.") }); } finally { setEmailLoading(false); } };

  return <div className="page-canvas">
    <PageHeader eyebrow="Clinical records" title="Prediction reports" description="Search and review previous AI stroke predictions." action={{ label: "New assessment", to: "/prediction" }} />
    <section className="glass-panel mt-7 overflow-hidden">
      <ReportFilters query={query} filters={filters} sort={sort} pageSize={pageSize} onQueryChange={changeQuery} onFiltersChange={changeFilters} onSortChange={changeSort} onPageSizeChange={changePageSize} onExportExcel={() => handleDownload(() => downloadExcelExport(params), "Excel exported")} />
      {error ? <div className="flex items-center justify-between gap-4 border-b border-danger/20 bg-danger/5 px-5 py-4 text-sm text-danger"><span>{error}</span><Button variant="secondary" onClick={() => setPage((current) => current)}>Retry</Button></div> : null}
      <ReportsTable reports={reports} isLoading={isLoading} onPdf={(id) => handleDownload(() => downloadPdf(id), "PDF downloaded")} onExcel={(id) => handleDownload(() => downloadExcel(id), "Excel exported")} onEmail={(id) => setEmailTarget(reports.find((report) => report.id === id) ?? null)} onDelete={handleDelete} />
      {!isLoading && !error && reports.length === 0 ? <div className="border-t border-line p-10 text-center"><p className="font-display text-lg font-bold text-text">No results found</p><p className="mt-2 text-sm text-muted">Try a different patient name, ID, or filter.</p></div> : null}
      <ReportPagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={setPage} />
    </section>
    <EmailReportDialog open={Boolean(emailTarget)} patientLabel={emailTarget?.patient_name || emailTarget?.patient_id || "patient"} isLoading={emailLoading} onClose={() => setEmailTarget(null)} onSubmit={handleEmail} />
  </div>;
}

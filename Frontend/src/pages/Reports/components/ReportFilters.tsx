import { Search, SlidersHorizontal } from "lucide-react";
import type { PredictionSearchParams, PredictionSort } from "../../../types";

interface ReportFiltersProps {
  query: string;
  filters: Pick<PredictionSearchParams, "risk" | "min_age" | "max_age" | "gender" | "smoking_status" | "hypertension" | "heart_disease" | "residence_type" | "work_type" | "date_from" | "date_to">;
  sort: PredictionSort;
  pageSize: number;
  onQueryChange: (value: string) => void;
  onFiltersChange: (filters: ReportFiltersProps["filters"]) => void;
  onSortChange: (value: PredictionSort) => void;
  onPageSizeChange: (value: number) => void;
  onExportExcel: () => void;
}

export function ReportFilters({ query, filters, sort, pageSize, onQueryChange, onFiltersChange, onSortChange, onPageSizeChange, onExportExcel }: ReportFiltersProps) {
  const update = (key: keyof ReportFiltersProps["filters"], value: string) => {
    onFiltersChange({ ...filters, [key]: value === "" ? undefined : Number.isNaN(Number(value)) ? value : Number(value) });
  };

  return (
    <div className="border-b border-line p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="field-shell w-full max-w-md px-3.5">
          <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
          <input className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-text outline-hidden placeholder:text-muted" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search patient or ID" aria-label="Search patient or ID" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="size-4 text-muted" aria-hidden="true" />
          <label className="sr-only" htmlFor="report-sort">Sort reports</label>
          <select id="report-sort" className="rounded-xl border border-line bg-surface-muted px-3 py-2 text-sm text-text focus-visible:outline-2 focus-visible:outline-primary" value={sort} onChange={(event) => onSortChange(event.target.value as PredictionSort)}>
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
            <option value="highest_probability">Highest probability</option>
            <option value="lowest_probability">Lowest probability</option>
            <option value="highest_risk">Highest risk</option>
            <option value="lowest_risk">Lowest risk</option>
            <option value="patient_name">Patient name</option>
          </select>
          <label className="sr-only" htmlFor="report-page-size">Rows per page</label>
          <select id="report-page-size" className="rounded-xl border border-line bg-surface-muted px-3 py-2 text-sm text-text focus-visible:outline-2 focus-visible:outline-primary" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
            <option value="10">10 rows</option>
            <option value="20">20 rows</option>
            <option value="50">50 rows</option>
          </select>
          <button type="button" className="rounded-xl border border-line px-3 py-2 text-sm text-muted transition-colors hover:border-line-strong hover:text-text" onClick={onExportExcel}>Export Excel</button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <select aria-label="Risk level filter" className="rounded-xl border border-line bg-surface-muted px-3 py-2 text-sm text-text" value={filters.risk ?? ""} onChange={(event) => update("risk", event.target.value)}>
          <option value="">All risk levels</option><option value="low">Low risk</option><option value="medium">Medium risk</option><option value="high">High risk</option>
        </select>
        <input aria-label="Minimum patient age" className="field-shell px-3.5 py-2 text-sm text-text outline-hidden" type="number" min="0" max="130" placeholder="Minimum age" value={filters.min_age ?? ""} onChange={(event) => update("min_age", event.target.value)} />
        <input aria-label="Maximum patient age" className="field-shell px-3.5 py-2 text-sm text-text outline-hidden" type="number" min="0" max="130" placeholder="Maximum age" value={filters.max_age ?? ""} onChange={(event) => update("max_age", event.target.value)} />
        <select aria-label="Gender filter" className="rounded-xl border border-line bg-surface-muted px-3 py-2 text-sm text-text" value={filters.gender ?? ""} onChange={(event) => update("gender", event.target.value)}>
          <option value="">All genders</option><option value="0">Female</option><option value="1">Male</option>
        </select>
        <select aria-label="Smoking status filter" className="rounded-xl border border-line bg-surface-muted px-3 py-2 text-sm text-text" value={filters.smoking_status ?? ""} onChange={(event) => update("smoking_status", event.target.value)}>
          <option value="">All smoking statuses</option><option value="0">Not currently smoking</option><option value="1">Current smoker</option>
        </select>
        <select aria-label="Hypertension filter" className="rounded-xl border border-line bg-surface-muted px-3 py-2 text-sm text-text" value={filters.hypertension ?? ""} onChange={(event) => update("hypertension", event.target.value)}>
          <option value="">All hypertension</option><option value="0">No hypertension</option><option value="1">Hypertension</option>
        </select>
        <select aria-label="Heart disease filter" className="rounded-xl border border-line bg-surface-muted px-3 py-2 text-sm text-text" value={filters.heart_disease ?? ""} onChange={(event) => update("heart_disease", event.target.value)}>
          <option value="">All heart disease</option><option value="0">No heart disease</option><option value="1">Heart disease</option>
        </select>
        <select aria-label="Residence type filter" className="rounded-xl border border-line bg-surface-muted px-3 py-2 text-sm text-text" value={filters.residence_type ?? ""} onChange={(event) => update("residence_type", event.target.value)}>
          <option value="">All residence types</option><option value="0">Rural</option><option value="1">Urban</option>
        </select>
        <select aria-label="Work type filter" className="rounded-xl border border-line bg-surface-muted px-3 py-2 text-sm text-text" value={filters.work_type ?? ""} onChange={(event) => update("work_type", event.target.value)}>
          <option value="">All work types</option><option value="0">Private</option><option value="1">Self-employed</option><option value="2">Government job</option><option value="3">Children</option><option value="4">Never worked</option>
        </select>
        <input aria-label="Filter from date" className="field-shell px-3.5 py-2 text-sm text-text outline-hidden" type="date" value={filters.date_from ?? ""} onChange={(event) => update("date_from", event.target.value)} />
        <input aria-label="Filter to date" className="field-shell px-3.5 py-2 text-sm text-text outline-hidden" type="date" value={filters.date_to ?? ""} onChange={(event) => update("date_to", event.target.value)} />
      </div>
    </div>
  );
}

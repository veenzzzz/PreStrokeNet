interface ReportPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function ReportPagination({ page, totalPages, total, pageSize, onPageChange }: ReportPaginationProps) {
  if (total === 0) return null;
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1);
  return (
    <div className="flex flex-col gap-3 border-t border-line px-5 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
      <span>Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}</span>
      <div className="flex items-center gap-1">
        <button type="button" className="rounded-lg border border-line px-2.5 py-1.5 transition-colors hover:border-line-strong hover:text-text disabled:cursor-not-allowed disabled:opacity-40" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</button>
        {pages.map((pageNumber) => <button key={pageNumber} type="button" aria-current={pageNumber === page ? "page" : undefined} className={`rounded-lg px-2.5 py-1.5 ${pageNumber === page ? "bg-primary/10 text-primary" : "border border-line hover:border-line-strong hover:text-text"}`} onClick={() => onPageChange(pageNumber)}>{pageNumber}</button>)}
        <button type="button" className="rounded-lg border border-line px-2.5 py-1.5 transition-colors hover:border-line-strong hover:text-text disabled:cursor-not-allowed disabled:opacity-40" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</button>
      </div>
    </div>
  );
}

export function Loader({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-label={label}>
      <span
        className="size-10 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--line-strong)", borderTopColor: "var(--primary)" }}
        aria-hidden="true"
      />
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

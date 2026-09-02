import { Activity, Bot, BrainCircuit, FileText, LayoutDashboard, ListFilter, Search, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  category: "Workspaces" | "Patients" | "Assessments";
  title: string;
  subtitle?: string;
  icon: any;
  path: string;
}

const defaultWorkspaces: SearchItem[] = [
  { id: "ws-dash", category: "Workspaces", title: "Overview Dashboard", subtitle: "Clinical command center & alerts", icon: LayoutDashboard, path: "/dashboard" },
  { id: "ws-queue", category: "Workspaces", title: "Clinician Work Queue", subtitle: "Prioritized patient triage list", icon: ListFilter, path: "/work-queue" },
  { id: "ws-pred", category: "Workspaces", title: "New Stroke Assessment", subtitle: "Multimodal 70/30 fusion assessment", icon: Activity, path: "/prediction" },
  { id: "ws-ai", category: "Workspaces", title: "AI Clinical Assistant", subtitle: "Decision support & SHAP Q&A", icon: Bot, path: "/clinical-assistant" },
  { id: "ws-analytics", category: "Workspaces", title: "Model Analytics", subtitle: "ROC-AUC 0.8801 & validation metrics", icon: BrainCircuit, path: "/model-analytics" },
  { id: "ws-audit", category: "Workspaces", title: "Audit Log & Activity", subtitle: "Compliance timeline & workflow log", icon: FileText, path: "/audit-log" },
];

export function CommandPaletteModal({ isOpen, onClose }: CommandPaletteModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [patientResults, setPatientResults] = useState<SearchItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setPatientResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setPatientResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      apiFetch(`/search/global?q=${encodeURIComponent(query.trim())}`)
        .then((data) => {
          if (data && Array.isArray(data.results)) {
            const mapped: SearchItem[] = data.results.map((r: any) => ({
              id: `p-${r.patient_id || r.id}`,
              category: r.type === "assessment" ? "Assessments" : "Patients",
              title: r.patient_name || r.patient_id || "Patient Profile",
              subtitle: `ID: ${r.patient_id || r.id} • Risk: ${r.risk || 'Assessed'}`,
              icon: r.type === "assessment" ? FileText : User,
              path: r.patient_id ? `/patients/${encodeURIComponent(r.patient_id)}/360` : `/reports?q=${encodeURIComponent(query.trim())}`
            }));
            setPatientResults(mapped);
          } else {
            setPatientResults([]);
          }
        })
        .catch(() => setPatientResults([]))
        .finally(() => setIsLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Combine items
  const filteredWorkspaces = defaultWorkspaces.filter(
    (w) =>
      w.title.toLowerCase().includes(query.toLowerCase()) ||
      w.subtitle?.toLowerCase().includes(query.toLowerCase())
  );

  const allItems = [...filteredWorkspaces, ...patientResults];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (allItems.length > 0 ? (prev + 1) % allItems.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (allItems.length > 0 ? (prev - 1 + allItems.length) % allItems.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        navigate(allItems[selectedIndex].path);
        onClose();
      } else if (query.trim()) {
        navigate(`/reports?q=${encodeURIComponent(query.trim())}`);
        onClose();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-app/80 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-surface-strong shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="relative flex items-center border-b border-line px-4 py-3.5">
          <Search className="size-5 text-muted mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent text-sm font-medium text-text placeholder:text-muted outline-hidden"
            placeholder="Search patients, assessments, or workspaces... (Ctrl K)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          {query ? (
            <button className="rounded-lg p-1 text-muted hover:text-text" onClick={() => setQuery("")}>
              <X className="size-4" />
            </button>
          ) : (
            <kbd className="rounded border border-line px-2 py-0.5 font-mono text-[10px] text-muted">ESC</kbd>
          )}
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-xs text-muted">
              <span className="inline-block size-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
              Searching clinical records...
            </div>
          ) : null}

          {!isLoading && allItems.length === 0 && query.trim() ? (
            <div className="text-center py-8 px-4">
              <p className="text-sm font-medium text-text">No matching records found</p>
              <p className="text-xs text-muted mt-1">Try searching by patient ID (e.g. P-QA-1001) or full name.</p>
              <button
                className="mt-4 rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
                onClick={() => {
                  navigate(`/reports?q=${encodeURIComponent(query.trim())}`);
                  onClose();
                }}
              >
                Search all reports for "{query}"
              </button>
            </div>
          ) : null}

          {/* Group: Workspaces */}
          {filteredWorkspaces.length > 0 ? (
            <div>
              <p className="px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wider text-muted uppercase">
                Workspaces
              </p>
              <div className="space-y-1">
                {filteredWorkspaces.map((item) => {
                  const globalIdx = allItems.findIndex((x) => x.id === item.id);
                  const isSelected = globalIdx === selectedIndex;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                        isSelected ? "bg-primary/15 border border-primary/30 text-text" : "hover:bg-white/5 text-muted hover:text-text"
                      }`}
                      onClick={() => {
                        navigate(item.path);
                        onClose();
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex size-8 items-center justify-center rounded-lg ${isSelected ? "bg-primary text-app" : "bg-white/5 text-primary"}`}>
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-text">{item.title}</p>
                          <p className="text-[11px] text-muted">{item.subtitle}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-muted">Jump →</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Group: Patients & Assessments */}
          {patientResults.length > 0 ? (
            <div>
              <p className="px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wider text-muted uppercase">
                Matching Clinical Records
              </p>
              <div className="space-y-1">
                {patientResults.map((item) => {
                  const globalIdx = allItems.findIndex((x) => x.id === item.id);
                  const isSelected = globalIdx === selectedIndex;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                        isSelected ? "bg-primary/15 border border-primary/30 text-text" : "hover:bg-white/5 text-muted hover:text-text"
                      }`}
                      onClick={() => {
                        navigate(item.path);
                        onClose();
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex size-8 items-center justify-center rounded-lg ${isSelected ? "bg-primary text-app" : "bg-white/5 text-primary"}`}>
                          <Icon className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-text">{item.title}</p>
                          <p className="text-[11px] text-muted">{item.subtitle}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-muted">View 360 →</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5 bg-surface-muted text-[11px] text-muted">
          <div className="flex items-center gap-3">
            <span><kbd className="rounded border border-line px-1 font-mono text-[10px]">↑↓</kbd> Navigate</span>
            <span><kbd className="rounded border border-line px-1 font-mono text-[10px]">↵</kbd> Select</span>
            <span><kbd className="rounded border border-line px-1 font-mono text-[10px]">ESC</kbd> Close</span>
          </div>
          <span className="font-mono text-[10px] text-primary">PreStrokeNet Command Palette</span>
        </div>
      </div>
    </div>
  );
}

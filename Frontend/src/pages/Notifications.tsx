import {
  Activity,
  AlertTriangle,
  Check,
  CheckCheck,
  ExternalLink,
  Filter,
  RefreshCw,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/Button";
import { PageHeader } from "../components/PageHeader";
import { getApiErrorMessage } from "../services/authService";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "../services/notificationService";

export function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [tab, setTab] = useState<"all" | "unread" | "read">("all");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const load = () => {
    setIsLoading(true);
    setError("");
    getNotifications({ unread_only: tab === "unread" })
      .then((res) => {
        setNotifications(res.items);
        setTotal(res.total);
        setUnreadCount(res.unread_count);
      })
      .catch((err) => setError(getApiErrorMessage(err, "Unable to load notifications.")))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
  }, [tab]);

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // safe ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch {
      // safe ignore
    }
  };

  const filteredItems = useMemo(() => {
    return notifications.filter((item) => {
      if (tab === "read" && !item.is_read) return false;
      if (severityFilter !== "All" && item.severity !== severityFilter.toLowerCase()) return false;
      if (typeFilter !== "All" && item.type !== typeFilter) return false;
      return true;
    });
  }, [notifications, tab, severityFilter, typeFilter]);

  return (
    <div className="page-canvas space-y-7">
      <PageHeader
        eyebrow="Clinical Alerts System"
        title="Clinician Notifications & Needs Attention Workspace"
        description="Non-diagnostic decision-support alert feed tracking model risk changes and behavioral events."
      />

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-danger/25 bg-danger/8 p-4 text-sm text-danger" role="alert">
          <span>{error}</span>
          <Button variant="secondary" icon={RefreshCw} onClick={load}>
            Retry
          </Button>
        </div>
      )}

      {/* Action Bar & Tabs */}
      <div className="glass-panel p-6 space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {[
              { label: "All Alerts", val: "all", count: total },
              { label: "Unread", val: "unread", count: unreadCount },
              { label: "Read", val: "read", count: total - unreadCount },
            ].map((t) => (
              <button
                key={t.val}
                onClick={() => setTab(t.val as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  tab === t.val ? "bg-primary text-app" : "bg-white/5 text-muted hover:text-text"
                }`}
              >
                <span>{t.label}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/20 text-[10px] font-mono">{t.count}</span>
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <Button variant="secondary" icon={CheckCheck} onClick={handleMarkAllRead}>
              Mark all as read
            </Button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-line/40 text-xs">
          <div className="flex items-center gap-1.5 text-muted">
            <Filter className="size-3.5" /> Severity:
          </div>
          {["All", "Warning", "Info"].map((s) => (
            <button
              key={s}
              onClick={() => setSeverityFilter(s)}
              className={`px-2.5 py-1 rounded-lg font-medium ${
                severityFilter === s ? "bg-white/10 text-text font-bold" : "text-muted hover:text-text"
              }`}
            >
              {s}
            </button>
          ))}

          <div className="flex items-center gap-1.5 text-muted ml-3">Type:</div>
          {[
            { label: "All Types", val: "All" },
            { label: "High Risk", val: "high_risk_assessment" },
            { label: "Risk Shift", val: "risk_category_changed" },
            { label: "Behavioral", val: "behavioral_shift" },
          ].map((tp) => (
            <button
              key={tp.val}
              onClick={() => setTypeFilter(tp.val)}
              className={`px-2.5 py-1 rounded-lg font-medium ${
                typeFilter === tp.val ? "bg-white/10 text-text font-bold" : "text-muted hover:text-text"
              }`}
            >
              {tp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="glass-panel p-8 text-center text-muted">Loading notifications...</div>
        ) : filteredItems.length === 0 ? (
          <div className="glass-panel p-8 text-center text-muted">No notifications match the selected criteria.</div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`glass-panel p-5 transition-all space-y-3 ${
                item.is_read ? "border-line bg-white/[0.01]" : "border-primary/30 bg-primary/5"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {item.severity === "warning" || item.severity === "high" ? (
                    <span className="badge badge-danger text-[10px] uppercase font-bold flex items-center gap-1">
                      <AlertTriangle className="size-3" /> {item.severity}
                    </span>
                  ) : item.type === "behavioral_shift" ? (
                    <span className="badge badge-warning text-[10px] uppercase font-bold flex items-center gap-1">
                      <Activity className="size-3" /> Behavioral
                    </span>
                  ) : (
                    <span className="badge badge-primary text-[10px] uppercase font-bold flex items-center gap-1">
                      <ShieldCheck className="size-3" /> Risk Event
                    </span>
                  )}
                  <h3 className="font-bold text-sm text-text">{item.title}</h3>
                </div>

                <span className="text-xs font-mono text-muted">
                  {new Date(item.created_at).toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-text leading-relaxed">{item.message}</p>

              <div className="pt-2 border-t border-line/40 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  {item.patient_id && (
                    <Button variant="secondary" onClick={() => navigate(`/patients/${item.patient_id}`)}>
                      <UserCheck className="size-3.5 mr-1" /> View Patient ({item.patient_id})
                    </Button>
                  )}
                  {item.prediction_id && (
                    <Button variant="secondary" onClick={() => navigate(`/predictions/${item.prediction_id}`)}>
                      <ExternalLink className="size-3.5 mr-1" /> View Prediction
                    </Button>
                  )}
                </div>

                {!item.is_read && (
                  <button
                    onClick={() => handleMarkRead(item.id)}
                    className="text-xs text-muted hover:text-text font-medium flex items-center gap-1"
                  >
                    <Check className="size-3.5" /> Mark as read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

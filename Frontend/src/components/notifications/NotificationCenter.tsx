import { Activity, AlertTriangle, Bell, Check, CheckCheck, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
} from "../../services/notificationService";

export function NotificationCenter() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadUnreadCount = async () => {
    try {
      const cnt = await getUnreadCount();
      setUnreadCount(cnt);
    } catch {
      // safe ignore
    }
  };

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await getNotifications({ limit: 10 });
      setNotifications(res.items);
      setUnreadCount(res.unread_count);
    } catch {
      // safe ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // 30s safe polling
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-muted hover:text-text hover:bg-white/5 transition-colors"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-line bg-app/95 backdrop-blur-xl shadow-2xl p-4 space-y-3 z-50">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-text">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-danger/20 text-danger text-[10px] font-mono font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <CheckCheck className="size-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2 text-xs">
            {isLoading ? (
              <p className="p-4 text-center text-muted">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="p-4 text-center text-muted">No notifications available.</p>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.prediction_id) {
                      navigate(`/predictions/${item.prediction_id}`);
                    } else if (item.patient_id) {
                      navigate(`/patients/${item.patient_id}`);
                    }
                    setIsOpen(false);
                  }}
                  className={`p-3 rounded-xl border transition-colors cursor-pointer space-y-1 ${
                    item.is_read
                      ? "border-line/40 bg-white/[0.01] text-muted hover:bg-white/[0.03]"
                      : "border-primary/30 bg-primary/5 text-text hover:bg-primary/10"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs flex items-center gap-1.5">
                      {item.severity === "warning" || item.severity === "high" ? (
                        <AlertTriangle className="size-3.5 text-danger" />
                      ) : item.type === "behavioral_shift" ? (
                        <Activity className="size-3.5 text-blue" />
                      ) : (
                        <ShieldCheck className="size-3.5 text-primary" />
                      )}
                      {item.title}
                    </span>
                    {!item.is_read && (
                      <button
                        onClick={(e) => handleMarkRead(item.id, e)}
                        className="p-1 rounded text-muted hover:text-text hover:bg-white/10"
                        title="Mark read"
                      >
                        <Check className="size-3" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] leading-relaxed">{item.message}</p>
                  <div className="flex justify-between text-[10px] text-muted font-mono pt-1">
                    <span>{new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="text-primary hover:underline">View details →</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-line/40 pt-2 text-center">
            <button
              onClick={() => {
                navigate("/notifications");
                setIsOpen(false);
              }}
              className="text-xs font-bold text-primary hover:underline"
            >
              View all notifications page →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

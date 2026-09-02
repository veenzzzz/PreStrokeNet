import { Activity, BarChart3, Bot, FileText, HeartPulse, LayoutDashboard, ListFilter, LogOut, Settings, Shield, Sparkles, UserRound, Users, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

const navSections = [
  {
    category: "WORKSPACE",
    items: [
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      { label: "Stroke prediction", to: "/prediction", icon: Activity },
      { label: "Work queue", to: "/work-queue", icon: ListFilter },
      { label: "Reports", to: "/reports", icon: FileText },
    ],
  },
  {
    category: "ANALYTICS",
    items: [
      { label: "Model analytics", to: "/model-analytics", icon: BarChart3 },
      { label: "Patient comparison", to: "/patient-comparison", icon: Users },
    ],
  },
  {
    category: "INTELLIGENCE",
    items: [
      { label: "AI Assistant", to: "/clinical-assistant", icon: Bot },
    ],
  },
  {
    category: "SYSTEM",
    items: [
      { label: "Audit log", to: "/audit-log", icon: Shield },
      { label: "Demo mode", to: "/demo", icon: Sparkles },
      { label: "Profile", to: "/profile", icon: UserRound },
      { label: "Settings", to: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    onClose();
    navigate("/login");
  };

  return (
    <>
      {isOpen ? <button className="fixed inset-0 z-30 bg-app/70 backdrop-blur-sm lg:hidden" aria-label="Close navigation" onClick={onClose} /> : null}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-line bg-app-elevated/95 px-4 py-5 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-2">
          <NavLink to="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <span className="relative flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary shadow-[0_0_28px_color-mix(in_srgb,var(--primary)_16%,transparent)]">
              <HeartPulse className="size-5" aria-hidden="true" />
              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary" />
            </span>
            <span>
              <span className="block font-display text-base font-bold tracking-tight text-text">PreStrokeNet</span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-muted">clinical intelligence</span>
            </span>
          </NavLink>
          <button className="rounded-lg p-2 text-muted hover:bg-white/6 hover:text-text lg:hidden" onClick={onClose} aria-label="Close navigation">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <nav className="mt-8 flex-1 space-y-6 overflow-y-auto" aria-label="Primary navigation">
          {navSections.map((sec) => (
            <div key={sec.category}>
              <p className="px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted mb-2">{sec.category}</p>
              <div className="space-y-1">
                {sec.items.map(({ label, to, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/dashboard"}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                        isActive ? "bg-primary/15 text-primary shadow" : "text-muted hover:bg-white/5 hover:text-text"
                      }`
                    }
                  >
                    <Icon className="size-4 transition-transform group-hover:scale-105" aria-hidden="true" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="rounded-2xl border border-line bg-white/[0.025] p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue font-display text-sm font-bold text-app">{user?.fullName.slice(0, 1) ?? "C"}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text">{user?.fullName ?? "Clinician"}</p>
              <p className="truncate text-xs text-muted">{user?.email ?? "workspace member"}</p>
            </div>
          </div>
          <button className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-muted transition-colors hover:bg-danger/8 hover:text-danger" onClick={handleLogout}>
            <LogOut className="size-3.5" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}

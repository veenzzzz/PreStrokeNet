import {
  Activity,
  BarChart3,
  Bot,
  FileText,
  HeartPulse,
  LayoutDashboard,
  ListFilter,
  LogOut,
  Settings,
  Shield,
  Sparkles,
  UserRound,
  Users,
  X,
  ChevronRight,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
}

interface NavSection {
  category: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    category: "Workspace",
    items: [
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      { label: "Stroke Prediction", to: "/prediction", icon: Activity },
      { label: "Work Queue", to: "/work-queue", icon: ListFilter },
      { label: "Reports", to: "/reports", icon: FileText },
    ],
  },
  {
    category: "Analytics",
    items: [
      { label: "Model Analytics", to: "/model-analytics", icon: BarChart3 },
      { label: "Patient Comparison", to: "/patient-comparison", icon: Users },
    ],
  },
  {
    category: "Intelligence",
    items: [
      { label: "AI Assistant", to: "/clinical-assistant", icon: Bot },
    ],
  },
  {
    category: "System",
    items: [
      { label: "Audit Log", to: "/audit-log", icon: Shield },
      { label: "Demo Mode", to: "/demo", icon: Sparkles },
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

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <button
          className="fixed inset-0 z-30 bg-app/80 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-line bg-app-elevated transition-transform duration-300 ease-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ width: "var(--sidebar-width)" }}
        aria-label="Main navigation"
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between gap-2 border-b border-line px-5">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3 min-w-0"
            onClick={onClose}
            aria-label="PreStrokeNet home"
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg"
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, var(--blue) 100%)",
              }}
            >
              <HeartPulse className="size-4 text-app" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold tracking-tight text-text leading-none">
                PreStrokeNet
              </span>
              <span className="block text-[10px] font-medium tracking-[0.12em] text-muted uppercase leading-none mt-0.5">
                Clinical AI
              </span>
            </span>
          </NavLink>
          <button
            className="flex size-7 items-center justify-center rounded-lg text-muted hover:bg-surface-strong hover:text-text transition-colors lg:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {/* Nav */}
        <nav
          className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-6"
          aria-label="Primary navigation"
        >
          {navSections.map((section) => (
            <div key={section.category}>
              <p
                className="mb-1 px-3 text-[10px] font-semibold tracking-[0.06em] uppercase"
                style={{ color: "var(--muted)", opacity: 0.75 }}
              >
                {section.category}
              </p>
              <ul className="space-y-0.5" role="list">
                {section.items.map(({ label, to, icon: Icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === "/dashboard"}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? "nav-active"
                            : "text-muted hover:bg-surface-strong hover:text-text-secondary"
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={`size-4 shrink-0 transition-colors ${
                              isActive ? "text-primary" : "text-muted group-hover:text-text-secondary"
                            }`}
                            aria-hidden="true"
                          />
                          <span className="min-w-0 truncate">{label}</span>
                          {isActive && (
                            <ChevronRight className="ml-auto size-3 text-primary/60 shrink-0" aria-hidden="true" />
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-app"
              style={{
                background: "linear-gradient(135deg, var(--primary) 0%, var(--blue) 100%)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text leading-none">
                {user?.fullName ?? "Clinician"}
              </p>
              <p className="truncate text-[11px] text-muted mt-0.5 leading-none">
                {user?.role ?? "Doctor"}
              </p>
            </div>
          </div>
          <button
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm text-muted transition-colors hover:bg-danger-dim hover:text-danger"
            onClick={handleLogout}
          >
            <LogOut className="size-4 shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium">Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

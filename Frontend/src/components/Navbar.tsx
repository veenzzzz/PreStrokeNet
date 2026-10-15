import { ChevronDown, Command, Menu, Search, UserRound, LogOut, Settings } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { NotificationCenter } from "./notifications/NotificationCenter";
import { CommandPaletteModal } from "./CommandPaletteModal";

const pageTitles: Record<string, { title: string; breadcrumb?: string }> = {
  "/dashboard":          { title: "Dashboard", breadcrumb: "Overview" },
  "/prediction":         { title: "Stroke Prediction", breadcrumb: "Clinical Workflow" },
  "/reports":            { title: "Prediction Reports", breadcrumb: "Clinical Records" },
  "/model-analytics":    { title: "Model Analytics", breadcrumb: "Analytics" },
  "/clinical-assistant": { title: "AI Assistant", breadcrumb: "Intelligence" },
  "/work-queue":         { title: "Work Queue", breadcrumb: "Workspace" },
  "/audit-log":          { title: "Audit Log", breadcrumb: "System" },
  "/profile":            { title: "Profile", breadcrumb: "Account" },
  "/settings":           { title: "Settings", breadcrumb: "Account" },
  "/patient-comparison": { title: "Patient Comparison", breadcrumb: "Analytics" },
  "/demo":               { title: "Demo Mode", breadcrumb: "System" },
  "/notifications":      { title: "Notifications", breadcrumb: "Workspace" },
};

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const pageInfo = pageTitles[pathname] ??
    (pathname.startsWith("/predictions/") ? { title: "Prediction Details", breadcrumb: "Clinical Records" } :
     pathname.startsWith("/patients/") ? { title: "Patient Profile", breadcrumb: "Patients" } :
     { title: "Workspace" });

  const initials = user?.fullName
    ? user.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <header
        className="sticky top-0 z-20 border-b border-line"
        style={{
          background: "color-mix(in srgb, var(--app) 85%, transparent)",
          backdropFilter: "blur(20px)",
          height: "var(--navbar-height)",
        }}
      >
        <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6">
          {/* Left: menu + breadcrumb */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="flex size-9 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:border-line-strong hover:bg-surface-strong hover:text-text lg:hidden"
              onClick={onMenuClick}
              aria-label="Open navigation"
            >
              <Menu className="size-4" aria-hidden="true" />
            </button>

            <div className="min-w-0">
              {pageInfo.breadcrumb && (
                <p className="text-[11px] font-medium text-muted leading-none mb-0.5 hidden sm:block">
                  PreStrokeNet · {pageInfo.breadcrumb}
                </p>
              )}
              <h1 className="truncate text-base font-bold tracking-tight text-text leading-none">
                {pageInfo.title}
              </h1>
            </div>
          </div>

          {/* Right: search + notifications + profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search */}
            <button
              className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs text-muted transition-all hover:border-line-strong hover:text-text-secondary"
              style={{ background: "color-mix(in srgb, var(--surface-strong) 50%, transparent)" }}
              onClick={() => setSearchOpen(true)}
              aria-label="Open command palette"
            >
              <Search className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline text-xs">Search...</span>
              <kbd
                className="hidden sm:flex items-center gap-0.5 rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-muted/70"
              >
                <Command className="size-2.5" aria-hidden="true" />K
              </kbd>
            </button>

            {/* Notifications */}
            <NotificationCenter />

            {/* Profile menu */}
            <div className="relative" ref={profileRef}>
              <button
                className="flex items-center gap-2 rounded-lg border border-line p-1.5 pr-2.5 transition-all hover:border-line-strong hover:bg-surface-strong"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
                onClick={() => setIsProfileOpen((open) => !open)}
              >
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-app"
                  style={{
                    background: "linear-gradient(135deg, var(--primary) 0%, var(--blue) 100%)",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {initials}
                </span>
                <span className="hidden max-w-24 truncate text-xs font-medium text-text-secondary sm:block">
                  {user?.fullName ?? "Clinician"}
                </span>
                <ChevronDown
                  className={`size-3.5 text-muted transition-transform ${isProfileOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                />
              </button>

              {isProfileOpen && (
                <div
                  className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-xl border border-line shadow-xl"
                  style={{ background: "var(--surface-strong)", boxShadow: "var(--shadow-lg)" }}
                  role="menu"
                >
                  {/* User info */}
                  <div className="border-b border-line px-4 py-3">
                    <p className="text-sm font-semibold text-text">{user?.fullName ?? "Clinician"}</p>
                    <p className="text-xs text-muted mt-0.5">{user?.email ?? ""}</p>
                    <span className="badge badge-primary mt-2 inline-flex">{user?.role ?? "Doctor"}</span>
                  </div>

                  {/* Menu items */}
                  <div className="p-1">
                    <Link
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-muted hover:text-text"
                      to="/profile"
                      onClick={() => setIsProfileOpen(false)}
                      role="menuitem"
                    >
                      <UserRound className="size-4" aria-hidden="true" />
                      Your profile
                    </Link>
                    <Link
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-muted hover:text-text"
                      to="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      role="menuitem"
                    >
                      <Settings className="size-4" aria-hidden="true" />
                      Settings
                    </Link>
                  </div>

                  <div className="border-t border-line p-1">
                    <button
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-danger/80 transition-colors hover:bg-danger-dim hover:text-danger"
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                        navigate("/login");
                      }}
                      role="menuitem"
                    >
                      <LogOut className="size-4" aria-hidden="true" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <CommandPaletteModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

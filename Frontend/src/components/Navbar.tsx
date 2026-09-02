import { ChevronDown, Menu, Search, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import { useAuth } from "../hooks/useAuth";
import { NotificationCenter } from "./notifications/NotificationCenter";
import { CommandPaletteModal } from "./CommandPaletteModal";

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/prediction": "Stroke prediction",
  "/reports": "Prediction reports",
  "/model-analytics": "Model analytics",
  "/clinical-assistant": "AI Clinical Assistant",
  "/work-queue": "Work Queue",
  "/audit-log": "Audit Log",
  "/profile": "Profile",
  "/settings": "Settings",
};

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const title = pageTitles[pathname] ?? "Workspace";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((prev) => !prev);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-app/75 backdrop-blur-xl">
        <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button className="rounded-xl border border-line p-2.5 text-muted hover:border-line-strong hover:text-text lg:hidden" onClick={onMenuClick} aria-label="Open navigation">
              <Menu className="size-4" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <p className="hidden text-xs text-muted sm:block">PreStrokeNet / Workspace</p>
              <h1 className="truncate font-display text-lg font-bold text-text">{title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <button
                className="flex items-center gap-2 rounded-xl border border-line bg-white/[0.025] px-3 py-2 text-xs text-muted transition-colors hover:border-line-strong hover:text-text"
                aria-label="Search PreStrokeNet"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="size-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Search PreStrokeNet...</span>
                <span className="sm:hidden">Search</span>
                <kbd className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-muted">Ctrl K</kbd>
              </button>
            </div>
            <NotificationCenter />
            <div className="relative">
              <button className="flex items-center gap-2 rounded-xl border border-line bg-white/[0.025] p-1.5 pr-2.5 transition-colors hover:border-line-strong" aria-expanded={isProfileOpen} onClick={() => setIsProfileOpen((open) => !open)}>
                <span className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-blue font-display text-xs font-bold text-app">{user?.fullName.slice(0, 1) ?? "C"}</span>
                <span className="hidden max-w-28 truncate text-xs font-medium text-text sm:block">{user?.fullName ?? "Clinician"}</span>
                <ChevronDown className="size-3.5 text-muted" aria-hidden="true" />
              </button>
              {isProfileOpen ? (
                <div className="absolute right-0 top-12 z-50 w-48 rounded-2xl border border-line bg-surface-strong p-1.5 shadow-2xl">
                  <Link className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-white/6 hover:text-text" to="/profile" onClick={() => setIsProfileOpen(false)}>
                    <UserRound className="size-4" aria-hidden="true" />
                    Your profile
                  </Link>
                  <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-muted hover:bg-danger/8 hover:text-danger" onClick={() => { logout(); setIsProfileOpen(false); }}>
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>
      <CommandPaletteModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  return (
    <div className="min-h-screen bg-app text-text">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main content area offset by sidebar width on large screens */}
      <div
        className="flex min-h-screen flex-col transition-all duration-300"
        style={{ paddingLeft: "var(--sidebar-width)" }}
      >
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 animate-fade-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

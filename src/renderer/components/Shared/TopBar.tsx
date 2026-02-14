// src/renderer/components/TopBar.tsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Search,
  Calendar,
  Bell,
  Receipt,
} from "lucide-react";

interface TopBarProps {
  toggleSidebar: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);

  // ----------------------------------------------------------------------
  // 📋 PAYTRACK SEARCH ROUTES (mirrors sidebar navigation)
  // ----------------------------------------------------------------------
  const allRoutes = useMemo(
    () => [
      // Dashboard
      { path: "/", name: "Dashboard", category: "Main" },
      // Employees
      { path: "/employees", name: "Employee List", category: "Employees" },
      // Attendance
      { path: "/attendance", name: "Attendance Logs", category: "Attendance" },
      // Payroll
      { path: "/payroll", name: "Payroll Periods", category: "Payroll" },
      // Reports
      { path: "/reports", name: "Reports Dashboard", category: "Reports" },
      { path: "/reports/attendance", name: "Attendance Report", category: "Reports" },
      { path: "/reports/payroll", name: "Payroll Report", category: "Reports" },
      { path: "/reports/export", name: "Export Data", category: "Reports" },
      // Settings
      { path: "/settings", name: "Settings", category: "Settings" },
      { path: "/settings/audit", name: "Audit Trail", category: "Settings" },
      { path: "/settings/notifications", name: "Notifications", category: "Settings" },
      { path: "/settings/preferences", name: "Preferences", category: "Settings" },
    ],
    []
  );

  // ----------------------------------------------------------------------
  // 🔎 SEARCH LOGIC
  // ----------------------------------------------------------------------
  const filteredRoutes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return allRoutes.filter(
      (route) =>
        route.name.toLowerCase().includes(query) ||
        route.path.toLowerCase().includes(query.replace(/\s+/g, "-")) ||
        route.category.toLowerCase().includes(query)
    );
  }, [searchQuery, allRoutes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredRoutes.length > 0) {
      navigate(filteredRoutes[0].path);
      setSearchQuery("");
      setShowSearchResults(false);
    }
  };

  const handleRouteSelect = (path: string) => {
    navigate(path);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  // ----------------------------------------------------------------------
  // 📅 TODAY'S DATE
  // ----------------------------------------------------------------------
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{
        background: "var(--sidebar-bg)",
        borderColor: "var(--sidebar-border)",
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* ---------- LEFT SECTION ---------- */}
        <div className="flex items-center gap-4">
          {/* Mobile menu toggle */}
          <button
            onClick={toggleSidebar}
            aria-label="Toggle menu"
            className="p-2 rounded-lg md:hidden transition-colors"
            style={{
              background: "rgba(212, 175, 55, 0.1)",
              border: "1px solid var(--border-color)",
              color: "var(--primary-color)",
            }}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* PayTrack branding + date */}
          <div
            className="hidden md:flex items-center gap-3 px-3 py-2 rounded-lg"
            style={{
              background: "rgba(212, 175, 55, 0.05)",
              border: "1px solid var(--border-color)",
            }}
          >
            <Receipt className="w-5 h-5" style={{ color: "var(--primary-color)" }} />
            <div className="flex flex-col">
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                PayTrack Lite
              </span>
              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Simple date display (mobile) */}
          <div
            className="flex md:hidden items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              background: "rgba(212, 175, 55, 0.05)",
              border: "1px solid var(--border-color)",
            }}
          >
            <Calendar className="w-4 h-4" style={{ color: "var(--primary-color)" }} />
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>
              {formattedDate}
            </span>
          </div>
        </div>

        {/* ---------- CENTER: SEARCH ---------- */}
        <div className="flex-1 max-w-xl mx-6">
          <div className="relative">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
                </div>
                <input
                  type="text"
                  placeholder="Search employees, attendance, payroll..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                  onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg transition-colors"
                  style={{
                    background: "var(--card-bg)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                      style={{
                        background: "var(--border-color)",
                        color: "var(--text-tertiary)",
                      }}
                    >
                      ×
                    </div>
                  </button>
                )}
              </div>
            </form>

            {/* Search results dropdown */}
            {showSearchResults && filteredRoutes.length > 0 && (
              <div
                className="absolute top-full left-0 right-0 mt-1 rounded-lg shadow-xl z-50"
                style={{
                  background: "var(--card-bg)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <div
                  className="p-3 border-b"
                  style={{ borderColor: "var(--border-color)" }}
                >
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Quick Navigation
                  </span>
                </div>
                <div className="max-h-80 overflow-auto">
                  {filteredRoutes.map((route, index) => (
                    <button
                      key={index}
                      onClick={() => handleRouteSelect(route.path)}
                      className="w-full text-left px-4 py-3 transition-colors border-b last:border-b-0 text-sm flex justify-between items-center hover:bg-[var(--card-hover-bg)]"
                      style={{ borderColor: "var(--border-color)" }}
                    >
                      <span style={{ color: "var(--text-primary)" }}>{route.name}</span>
                      <span
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          background: "var(--card-secondary-bg)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {route.category}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ---------- RIGHT SECTION (Notification Bell - hidden for now) ---------- */}
        <div className="flex items-center gap-3 hidden">
          <button
            className="relative p-2 rounded-lg transition-colors"
            style={{
              background: "rgba(212, 175, 55, 0.1)",
              border: "1px solid var(--border-color)",
              color: "var(--primary-color)",
            }}
          >
            <Bell className="w-5 h-5" />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: "var(--status-cancelled)" }}
            ></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
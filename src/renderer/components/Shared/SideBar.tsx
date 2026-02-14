// src/renderer/components/SideBar.tsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  DollarSign,
  FileText,
  Settings,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Receipt,
  BarChart2,
  ClipboardList,
  Mail,
  TrendingUp,
  CalendarDays,
  Clock,
  CreditCard,
} from "lucide-react";
import { version } from "../../../../package.json";
import dashboardAPI from "../../api/dashboard";

interface SidebarProps {
  isOpen: boolean;
}

interface MenuItem {
  path: string;
  name: string;
  icon: React.ComponentType<any>;
  category?: string;
  children?: MenuItem[];
}

interface PayTrackStats {
  totalEmployees: number;
  presentToday: number;
  pendingPayrolls: number;
  upcomingPayDate: string | null;
}

const SideBar: React.FC<SidebarProps> = ({ isOpen }) => {
  const location = useLocation();
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState<PayTrackStats>({
    totalEmployees: 0,
    presentToday: 0,
    pendingPayrolls: 0,
    upcomingPayDate: null,
  });
  const [loading, setLoading] = useState(true);

  // ----------------------------------------------------------------------
  // 📋 PAYTRACK MENU ITEMS (based on README structure)
  // ----------------------------------------------------------------------
  const menuItems: MenuItem[] = [
    { path: "/", name: "Dashboard", icon: LayoutDashboard, category: "core" },
    { path: "/employees", name: "Employees", icon: Users, category: "core" },
    { path: "/attendance", name: "Attendance", icon: CalendarCheck, category: "core" },
    { path: "/payroll", name: "Payroll", icon: DollarSign, category: "core" },
    {
      path: "/reports",
      name: "Reports",
      icon: FileText,
      category: "analytics",
      children: [
        { path: "/reports/attendance", name: "Attendance Report", icon: BarChart2 },
        { path: "/reports/payroll", name: "Payroll Report", icon: CreditCard },
        { path: "/reports/export", name: "Export Data", icon: FileText },
      ],
    },
    {
      path: "/settings",
      name: "Settings",
      icon: Settings,
      category: "system",
      children: [
        { path: "/settings/audit", name: "Audit Trail", icon: ClipboardList },
        { path: "/settings/notifications", name: "Notifications", icon: Mail },
        { path: "/settings/preferences", name: "Preferences", icon: Settings },
      ],
    },
  ];

  // ----------------------------------------------------------------------
  // 📊 FETCH PAYTRACK STATS VIA DASHBOARD API
  // ----------------------------------------------------------------------
  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getDashboardData();
      if (response.status) {
        const data = response.data;
        setStats({
          totalEmployees: data.employeeStats?.total || 0,
          presentToday: data.attendanceToday?.present || 0,
          pendingPayrolls: data.pendingPeriods || 0,
          upcomingPayDate: data.upcomingPayDate || null,
        });
      }
    } catch (error) {
      console.error("Failed to fetch sidebar stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 120000); // refresh every 2 min
    return () => clearInterval(interval);
  }, []);

  // ----------------------------------------------------------------------
  // 🎛️ DROPDOWN LOGIC
  // ----------------------------------------------------------------------
  const toggleDropdown = (name: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const isActivePath = (path: string) => location.pathname === path;

  const isDropdownActive = (items: MenuItem[] = []) =>
    items.some((item) => isActivePath(item.path));

  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.children && isDropdownActive(item.children)) {
        setOpenDropdowns((prev) => ({ ...prev, [item.name]: true }));
      }
    });
  }, [location.pathname]);

  // ----------------------------------------------------------------------
  // 🖌️ RENDER MENU (with theme variables)
  // ----------------------------------------------------------------------
  const renderMenuItems = (items: MenuItem[]) =>
    items.map((item) => {
      const hasChildren = !!item.children?.length;
      const isActive = hasChildren
        ? isDropdownActive(item.children)
        : isActivePath(item.path);
      const isOpen = openDropdowns[item.name];

      return (
        <li key={item.path || item.name} className="mb-1">
          {hasChildren ? (
            <>
              <div
                onClick={() => toggleDropdown(item.name)}
                className={`group flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer
                  ${
                    isActive
                      ? "bg-[var(--primary-color)] text-[var(--secondary-color)] shadow-md"
                      : "text-[var(--sidebar-text)] hover:bg-[var(--card-hover-bg)]"
                  }
                `}
                style={isActive ? { backgroundColor: "var(--primary-color)" } : {}}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={`w-5 h-5 ${
                      isActive ? "text-[var(--secondary-color)]" : "text-[var(--sidebar-text)]"
                    }`}
                  />
                  <span className="font-medium">{item.name}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  } ${isActive ? "text-[var(--secondary-color)]" : "text-[var(--sidebar-text)]"}`}
                />
              </div>

              {isOpen && (
                <ul className="ml-4 mt-1 space-y-1">
                  {item.children?.map((child) => {
                    const isChildActive = isActivePath(child.path);
                    return (
                      <li key={child.path} className="mb-1">
                        <Link
                          to={child.path}
                          className={`group flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm
                            ${
                              isChildActive
                                ? "bg-[var(--border-color)]/20 text-[var(--primary-color)] border-l-2 border-[var(--primary-color)] pl-3"
                                : "text-[var(--sidebar-text)]/80 hover:bg-[var(--card-hover-bg)] hover:text-[var(--sidebar-text)]"
                            }
                          `}
                        >
                          <child.icon className="w-4 h-4" />
                          <span>{child.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : (
            <Link
              to={item.path}
              className={`group flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200
                ${
                  isActive
                    ? "bg-[var(--primary-color)] text-[var(--secondary-color)] shadow-md"
                    : "text-[var(--sidebar-text)] hover:bg-[var(--card-hover-bg)]"
                }
              `}
              style={isActive ? { backgroundColor: "var(--primary-color)" } : {}}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={`w-5 h-5 ${
                    isActive ? "text-[var(--secondary-color)]" : "text-[var(--sidebar-text)]"
                  }`}
                />
                <span className="font-medium">{item.name}</span>
              </div>
              <ChevronRight
                className={`w-4 h-4 transition-opacity duration-200 ${
                  isActive
                    ? "opacity-100 text-[var(--secondary-color)]"
                    : "opacity-0 group-hover:opacity-100 text-[var(--sidebar-text)]"
                }`}
              />
            </Link>
          )}
        </li>
      );
    });

  const categories = [
    { id: "core", name: "CORE MODULES" },
    { id: "analytics", name: "ANALYTICS & REPORTS" },
    { id: "system", name: "SYSTEM" },
  ];

  // ----------------------------------------------------------------------
  // 📦 SIDEBAR LAYOUT – THEMED WITH CSS VARIABLES
  // ----------------------------------------------------------------------
  return (
    <div
      className={`fixed md:relative inset-y-0 left-0 w-64
        transform ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 transition-all duration-300 ease-in-out
        z-30 flex flex-col h-screen shadow-xl`}
      style={{
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* ----- Header / Brand ----- */}
      <div
        className="flex-shrink-0 p-5 border-b"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
            style={{
              background: "var(--primary-color)",
              color: "var(--secondary-color)",
            }}
          >
            <Receipt className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              PayTrack
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Lite Payroll Attendance
            </p>
          </div>
        </div>
      </div>

      {/* ----- Navigation ----- */}
      <nav className="flex-1 overflow-y-auto p-4">
        {categories.map((category) => {
          const categoryItems = menuItems.filter(
            (item) => item.category === category.id
          );
          if (categoryItems.length === 0) return null;
          return (
            <div key={category.id} className="mb-6">
              <h6
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: "var(--text-tertiary)" }}
              >
                {category.name}
              </h6>
              <ul className="space-y-1">{renderMenuItems(categoryItems)}</ul>
            </div>
          );
        })}
      </nav>

      {/* ----- Quick Stats (PayTrack specific) ----- */}
      <div
        className="p-4 border-t"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <h4 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          {loading ? "Loading stats..." : "Today's Snapshot"}
        </h4>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div
            className="p-3 rounded-lg text-center"
            style={{
              background: "rgba(212, 175, 55, 0.1)", // gold tint
              border: "1px solid var(--border-color)",
            }}
          >
            <Users className="w-4 h-4 mx-auto mb-1" style={{ color: "var(--primary-color)" }} />
            <div className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {loading ? "..." : stats.totalEmployees}
            </div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Total Employees
            </div>
          </div>
          <div
            className="p-3 rounded-lg text-center"
            style={{
              background: "rgba(212, 175, 55, 0.1)",
              border: "1px solid var(--border-color)",
            }}
          >
            <CalendarCheck className="w-4 h-4 mx-auto mb-1" style={{ color: "var(--primary-color)" }} />
            <div className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {loading ? "..." : stats.presentToday}
            </div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Present Today
            </div>
          </div>
          <div
            className="p-3 rounded-lg text-center"
            style={{
              background: "rgba(212, 175, 55, 0.1)",
              border: "1px solid var(--border-color)",
            }}
          >
            <Clock className="w-4 h-4 mx-auto mb-1" style={{ color: "var(--primary-color)" }} />
            <div className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {loading ? "..." : stats.pendingPayrolls}
            </div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Pending Payrolls
            </div>
          </div>
          <div
            className="p-3 rounded-lg text-center"
            style={{
              background: "rgba(212, 175, 55, 0.1)",
              border: "1px solid var(--border-color)",
            }}
          >
            <CreditCard className="w-4 h-4 mx-auto mb-1" style={{ color: "var(--primary-color)" }} />
            <div className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {loading ? "..." : stats.upcomingPayDate ? new Date(stats.upcomingPayDate).toLocaleDateString() : "N/A"}
            </div>
            <div className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Next Pay Date
            </div>
          </div>
        </div>
      </div>

      {/* ----- Footer ----- */}
      <div
        className="p-4 border-t"
        style={{ borderColor: "var(--sidebar-border)" }}
      >
        <div className="flex justify-center gap-3 mb-3">
          <button
            className="p-2 rounded-lg hover:bg-[var(--card-hover-bg)] transition-colors"
            title="Help"
            style={{ color: "var(--text-primary)" }}
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <Link
            to="/settings/preferences"
            className="p-2 rounded-lg hover:bg-[var(--card-hover-bg)] transition-colors"
            title="Settings"
            style={{ color: "var(--text-primary)" }}
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
        <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>
          v{version} · PayTrack Lite
        </p>
      </div>
    </div>
  );
};

export default SideBar;
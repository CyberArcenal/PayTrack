// src/renderer/components/PageNotFound.tsx
import React from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Home,
  Search,
  RefreshCw,
  ArrowLeft,
  Users,
  CalendarCheck,
  DollarSign,
  FileText,
  Settings,
  Receipt,
} from "lucide-react";
import { version } from "../../../../package.json";

const PageNotFound: React.FC = () => {
  const handleGoBack = () => {
    window.history.back();
  };

  // ----------------------------------------------------------------------
  // 📋 PAYTRACK QUICK LINKS
  // ----------------------------------------------------------------------
  const quickLinks = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/employees", label: "Employees", icon: Users },
    { path: "/attendance", label: "Attendance", icon: CalendarCheck },
    { path: "/payroll", label: "Payroll", icon: DollarSign },
    { path: "/reports", label: "Reports", icon: FileText },
    { path: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: "var(--background-color)" }}
    >
      <div className="relative z-10 max-w-4xl w-full">
        {/* ----- 404 Error Code ----- */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div
              className="text-9xl font-bold tracking-tighter"
              style={{ color: "var(--primary-color)" }}
            >
              4<span className="relative">0
                <div
                  className="absolute -top-2 -right-2 w-4 h-4 rounded-full animate-ping"
                  style={{ backgroundColor: "var(--primary-color)" }}
                ></div>
              </span>4
            </div>
            <div className="absolute -top-6 -right-6 animate-bounce">
              <AlertTriangle
                className="w-12 h-12"
                style={{ color: "var(--primary-color)" }}
              />
            </div>
          </div>
          <div
            className="mt-2 text-lg font-semibold tracking-widest uppercase"
            style={{ color: "var(--text-secondary)" }}
          >
            Page Not Found
          </div>
        </div>

        {/* ----- Error Message Card ----- */}
        <div
          className="rounded-xl p-8 mb-8 text-center shadow-sm"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border-color)",
          }}
        >
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ background: "rgba(212, 175, 55, 0.1)" }}
          >
            <Receipt
              className="w-10 h-10"
              style={{ color: "var(--primary-color)" }}
            />
          </div>

          <h1
            className="text-2xl font-bold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Oops! Page not found in PayTrack.
          </h1>

          <p
            className="text-base mb-6 max-w-2xl mx-auto"
            style={{ color: "var(--text-secondary)" }}
          >
            The page you're looking for doesn't exist or has been moved.
            Check the address or use one of the quick links below to find your way back.
          </p>

          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: "var(--card-secondary-bg)",
              border: "1px solid var(--border-color)",
              fontFamily: "monospace",
            }}
          >
            <Search
              className="w-4 h-4"
              style={{ color: "var(--text-secondary)" }}
            />
            <code
              className="text-sm font-mono"
              style={{ color: "var(--text-primary)" }}
            >
              {window.location.pathname}
            </code>
          </div>
        </div>

        {/* ----- Quick Navigation Grid ----- */}
        <div
          className="rounded-xl p-6 mb-8 shadow-sm"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border-color)",
          }}
        >
          <h2
            className="text-lg font-semibold mb-6 text-center"
            style={{ color: "var(--text-primary)" }}
          >
            Quick PayTrack Navigation
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <Link
                  key={index}
                  to={link.path}
                  className="group flex flex-col items-center p-4 rounded-lg transition-all duration-200 hover:shadow-md"
                  style={{
                    background: "var(--card-secondary-bg)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div
                    className="p-3 rounded-full mb-3 transition-all duration-200 group-hover:scale-110"
                    style={{
                      backgroundColor: "rgba(212, 175, 55, 0.1)",
                      border: "2px solid var(--border-color)",
                    }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: "var(--primary-color)" }}
                    />
                  </div>
                  <span
                    className="text-sm font-medium text-center"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ----- Action Buttons ----- */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleGoBack}
            className="px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-md"
            style={{
              background: "var(--card-secondary-bg)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <Link
            to="/"
            className="px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-md hover:scale-105"
            style={{
              background: "var(--primary-color)",
              color: "var(--secondary-color)",
            }}
          >
            <Home className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </Link>

          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 hover:shadow-md"
            style={{
              background: "var(--card-secondary-bg)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
            }}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Page</span>
          </button>
        </div>

        {/* ----- Footer ----- */}
        <div className="mt-8 text-center">
          <p
            className="text-sm mb-2"
            style={{ color: "var(--text-secondary)" }}
          >
            Need help? Contact your system administrator.
          </p>
          <div
            className="flex items-center justify-center gap-4 text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            <span className="flex items-center gap-1">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "var(--primary-color)" }}
              ></div>
              PayTrack Lite
            </span>
            <span>•</span>
            <span>Error 404</span>
            <span>•</span>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* ----- System Version ----- */}
        <div className="mt-6 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: "var(--card-secondary-bg)",
              border: "1px solid var(--border-color)",
            }}
          >
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--primary-color)" }}
            ></div>
            <span
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              PayTrack Lite • v{version || "0.0.0"} • {new Date().getFullYear()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;
// src/renderer/api/dashboard.ts
// Dashboard API – enriched to match backend

// ----------------------------------------------------------------------
// 📦 Types & Interfaces
// ----------------------------------------------------------------------

export interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  terminated: number;
  onLeave: number;
  newHiresThisMonth: number;
}

export interface DepartmentDistribution {
  department: string;
  count: number;
}

export interface AttendanceToday {
  total: number;
  present: number;
  late: number;
  halfDay: number;
  absent: number;
  others: number;
  bySource: Array<{ source: string; count: number }>;
  totalHoursWorked: number;
}

export interface PayrollSummary {
  latestPeriod: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    payDate: string;
    status: string;
    employeeCount: number;
    totalGross: number;
    totalNet: number;
    totalDeductions: number;
    totalOvertimePay: number;
    totalBonus: number;
    totalAllowance: number;
    averageGross: number;
    averageNet: number;
  } | null;
  comparison: {
    grossChangePercent: number;
    netChangePercent: number;
  } | null;
  currentMonthTotals: {
    gross: number;
    net: number;
    deductions: number;
  } | null;
}

export type UpcomingPayDate = string | null;

export type PendingPeriodsCount = number;

export interface AttendanceTrendEntry {
  date: string;
  present: number;
  late: number;
  absent: number;
  halfDay: number;
  other: number;
}

export interface RecentActivityItem {
  id: number;
  employeeName: string;
  timestamp: string;
  status: string;
  source: string;
}

export interface MonthlyAttendanceSummary {
  month: string; // YYYY-MM
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  others: number;
  totalLogs: number;
  uniqueDays: number;
}

export interface OvertimeSummary {
  totalOvertimeHours: number;
  employeesWithOvertime: number;
}

export interface TopEmployeeAttendance {
  employeeId: number;
  employeeName: string;
  presentCount: number; // number of days present in current month
}

export interface PayrollComparison {
  currentPeriod: { id: number; name: string };
  previousPeriod: { id: number; name: string };
  grossChangePercent: number;
  netChangePercent: number;
}

export interface DashboardData {
  employeeStats: EmployeeStats;
  attendanceToday: AttendanceToday;
  payrollSummary: PayrollSummary;
  upcomingPayDate: UpcomingPayDate;
  pendingPeriods: PendingPeriodsCount;
  attendanceTrend: AttendanceTrendEntry[];
  recentActivity: RecentActivityItem[];
  departmentDistribution: DepartmentDistribution[];
  monthlyAttendanceSummary: MonthlyAttendanceSummary;
  overtimeSummary: OvertimeSummary;
  topEmployeesByAttendance: TopEmployeeAttendance[];
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces
// ----------------------------------------------------------------------

export interface DashboardResponse<T> {
  status: boolean;
  message?: string;
  data: T;
}

export type EmployeeStatsResponse = DashboardResponse<EmployeeStats>;
export type DepartmentDistributionResponse = DashboardResponse<
  DepartmentDistribution[]
>;
export type AttendanceTodayResponse = DashboardResponse<AttendanceToday>;
export type PayrollSummaryResponse = DashboardResponse<PayrollSummary>;
export type UpcomingPayDateResponse = DashboardResponse<UpcomingPayDate>;
export type PendingPeriodsResponse = DashboardResponse<PendingPeriodsCount>;
export type AttendanceTrendResponse = DashboardResponse<AttendanceTrendEntry[]>;
export type RecentActivityResponse = DashboardResponse<RecentActivityItem[]>;
export type MonthlyAttendanceSummaryResponse =
  DashboardResponse<MonthlyAttendanceSummary>;
export type OvertimeSummaryResponse = DashboardResponse<OvertimeSummary>;
export type TopEmployeesResponse = DashboardResponse<TopEmployeeAttendance[]>;
export type PayrollComparisonResponse =
  DashboardResponse<PayrollComparison | null>;
export type DashboardDataResponse = DashboardResponse<DashboardData>;

// ----------------------------------------------------------------------
// 🧠 DashboardAPI Class
// ----------------------------------------------------------------------

class DashboardAPI {
  // Combined data
  async getDashboardData(): Promise<DashboardDataResponse> {
    try {
      if (!window.backendAPI?.dashboard) {
        throw new Error("Electron API (dashboard) not available");
      }

      const response = await window.backendAPI.dashboard({
        method: "getDashboardData",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch dashboard data");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch dashboard data");
    }
  }

  // Individual methods
  async getEmployeeStats(): Promise<EmployeeStatsResponse> {
    return this.callMethod("getEmployeeStats");
  }

  async getDepartmentDistribution(): Promise<DepartmentDistributionResponse> {
    return this.callMethod("getDepartmentDistribution");
  }

  async getAttendanceToday(): Promise<AttendanceTodayResponse> {
    return this.callMethod("getAttendanceToday");
  }

  async getPayrollSummary(): Promise<PayrollSummaryResponse> {
    return this.callMethod("getPayrollSummary");
  }

  async getUpcomingPayDate(): Promise<UpcomingPayDateResponse> {
    return this.callMethod("getUpcomingPayDate");
  }

  async getPendingPayrollPeriods(): Promise<PendingPeriodsResponse> {
    return this.callMethod("getPendingPayrollPeriods");
  }

  async getAttendanceTrend(): Promise<AttendanceTrendResponse> {
    return this.callMethod("getAttendanceTrend");
  }

  async getRecentActivity(): Promise<RecentActivityResponse> {
    return this.callMethod("getRecentActivity");
  }

  async getMonthlyAttendanceSummary(): Promise<MonthlyAttendanceSummaryResponse> {
    return this.callMethod("getMonthlyAttendanceSummary");
  }

  async getOvertimeSummary(): Promise<OvertimeSummaryResponse> {
    return this.callMethod("getOvertimeSummary");
  }

  async getTopEmployeesByAttendance(): Promise<TopEmployeesResponse> {
    return this.callMethod("getTopEmployeesByAttendance");
  }

  async getPayrollComparison(): Promise<PayrollComparisonResponse> {
    return this.callMethod("getPayrollComparison");
  }

  // Helper to reduce duplication
  private async callMethod(method: string, params: any = {}): Promise<any> {
    try {
      if (!window.backendAPI?.dashboard) {
        throw new Error("Electron API (dashboard) not available");
      }

      const response = await window.backendAPI.dashboard({ method, params });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || `Failed to fetch ${method}`);
    } catch (error: any) {
      throw new Error(error.message || `Failed to fetch ${method}`);
    }
  }

  async isAvailable(): Promise<boolean> {
    return !!window.backendAPI?.dashboard;
  }
}

const dashboardAPI = new DashboardAPI();
export default dashboardAPI;

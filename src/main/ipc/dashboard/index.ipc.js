// src/main/ipc/dashboard/index.ipc.js
// @ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../utils/logger");
const { withErrorHandling } = require("../../../middlewares/errorHandler");
const { AppDataSource } = require("../../db/datasource");
// @ts-ignore
const {
  Between,
  // @ts-ignore
  LessThanOrEqual,
  // @ts-ignore
  MoreThanOrEqual,
  In,
  LessThan,
} = require("typeorm");

class DashboardHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // All methods are implemented directly.
  }

  /**
   * Main dispatcher
   * @param {Electron.IpcMainInvokeEvent} event
   * @param {{ method: string; params?: any }} payload
   */

  // @ts-ignore
  async handleRequest(event, payload) {
    const { method, params = {} } = payload;

    // @ts-ignore
    logger.info(`DashboardHandler: ${method}`, { params });

    try {
      switch (method) {
        case "getDashboardData":
          return await this.getDashboardData(params);
        case "getEmployeeStats":
          return await this.getEmployeeStats(params);
        case "getAttendanceToday":
          return await this.getAttendanceToday(params);
        case "getPayrollSummary":
          return await this.getPayrollSummary(params);
        case "getUpcomingPayDate":
          return await this.getUpcomingPayDate(params);
        case "getPendingPayrollPeriods":
          return await this.getPendingPayrollPeriods(params);
        case "getAttendanceTrend":
          return await this.getAttendanceTrend(params);
        case "getRecentActivity":
          return await this.getRecentActivity(params);
        // New methods
        case "getDepartmentDistribution":
          return await this.getDepartmentDistribution(params);
        case "getMonthlyAttendanceSummary":
          return await this.getMonthlyAttendanceSummary(params);
        case "getOvertimeSummary":
          return await this.getOvertimeSummary(params);
        case "getTopEmployeesByAttendance":
          return await this.getTopEmployeesByAttendance(params);
        case "getPayrollComparison":
          return await this.getPayrollComparison(params);
        default:
          return {
            status: false,
            message: `Unknown dashboard method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      // @ts-ignore
      logger.error("DashboardHandler error:", error);
      return {
        status: false,

        // @ts-ignore
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }

  // ----------------------------------------------------------------------
  // 🔎 COMBINED DASHBOARD DATA
  // ----------------------------------------------------------------------

  // @ts-ignore
  async getDashboardData(params) {
    const [
      employeeStats,
      attendanceToday,
      payrollSummary,
      upcomingPayDate,
      pendingPeriods,
      attendanceTrend,
      recentActivity,
      departmentDist,
      monthlySummary,
      overtimeSummary,
      topEmployees,
    ] = await Promise.all([
      this.getEmployeeStats(params),
      this.getAttendanceToday(params),
      this.getPayrollSummary(params),
      this.getUpcomingPayDate(params),
      this.getPendingPayrollPeriods(params),
      this.getAttendanceTrend(params),
      this.getRecentActivity(params),
      this.getDepartmentDistribution(params),
      this.getMonthlyAttendanceSummary(params),
      this.getOvertimeSummary(params),
      this.getTopEmployeesByAttendance(params),
    ]);

    return {
      status: true,
      data: {
        employeeStats: employeeStats.data,
        attendanceToday: attendanceToday.data,
        payrollSummary: payrollSummary.data,
        upcomingPayDate: upcomingPayDate.data,
        pendingPeriods: pendingPeriods.data,
        attendanceTrend: attendanceTrend.data,
        recentActivity: recentActivity.data,
        departmentDistribution: departmentDist.data,
        monthlyAttendanceSummary: monthlySummary.data,
        overtimeSummary: overtimeSummary.data,
        topEmployeesByAttendance: topEmployees.data,
      },
    };
  }

  // ----------------------------------------------------------------------
  // 👥 EMPLOYEE STATISTICS (ENRICHED)
  // ----------------------------------------------------------------------

  // @ts-ignore
  async getEmployeeStats(params) {
    const employeeRepo = AppDataSource.getRepository("Employee");
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const total = await employeeRepo.count();
    const active = await employeeRepo.count({ where: { status: "active" } });
    const inactive = await employeeRepo.count({
      where: { status: "inactive" },
    });
    const terminated = await employeeRepo.count({
      where: { status: "terminated" },
    });
    const onLeave = await employeeRepo.count({ where: { status: "on-leave" } });

    const newHiresThisMonth = await employeeRepo.count({
      where: { hireDate: Between(firstDayOfMonth, now) },
    });

    return {
      status: true,
      data: {
        total,
        active,
        inactive,
        terminated,
        onLeave,
        newHiresThisMonth,
      },
    };
  }

  // ----------------------------------------------------------------------
  // 🏢 DEPARTMENT DISTRIBUTION
  // ----------------------------------------------------------------------

  // @ts-ignore
  async getDepartmentDistribution(params) {
    const employeeRepo = AppDataSource.getRepository("Employee");
    const result = await employeeRepo
      .createQueryBuilder("employee")
      .select("employee.department", "department")
      .addSelect("COUNT(*)", "count")
      .where("employee.department IS NOT NULL")
      .groupBy("employee.department")
      .orderBy("count", "DESC")
      .getRawMany();

    const distribution = result.map((row) => ({
      department: row.department,
      count: parseInt(row.count, 10),
    }));

    return { status: true, data: distribution };
  }

  // ----------------------------------------------------------------------
  // 📅 ATTENDANCE TODAY (ENRICHED)
  // ----------------------------------------------------------------------

  // @ts-ignore
  async getAttendanceToday(params) {
    const attendanceRepo = AppDataSource.getRepository("AttendanceLog");
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const logs = await attendanceRepo.find({
      where: { timestamp: Between(startOfDay, endOfDay) },
      relations: ["employee"],
    });

    const present = logs.filter((l) => l.status === "present").length;
    const late = logs.filter((l) => l.status === "late").length;
    const halfDay = logs.filter((l) => l.status === "half-day").length;
    const absent = logs.filter((l) => l.status === "absent").length;
    const others = logs.length - (present + late + halfDay + absent);

    // By source
    const sourceMap = new Map();
    logs.forEach((l) => {
      const src = l.source || "unknown";
      sourceMap.set(src, (sourceMap.get(src) || 0) + 1);
    });
    const bySource = Array.from(sourceMap.entries()).map(([source, count]) => ({
      source,
      count,
    }));

    // Total hours worked today
    const totalHoursWorked = logs.reduce(
      (sum, l) => sum + parseFloat(l.hoursWorked || 0),
      0,
    );

    return {
      status: true,
      data: {
        total: logs.length,
        present,
        late,
        halfDay,
        absent,
        others,
        bySource,
        totalHoursWorked,
      },
    };
  }

  // ----------------------------------------------------------------------
  // 💰 PAYROLL SUMMARY (ENRICHED WITH COMPARISON)
  // ----------------------------------------------------------------------

  // @ts-ignore
  async getPayrollSummary(params) {
    const periodRepo = AppDataSource.getRepository("PayrollPeriod");
    const payrollRepo = AppDataSource.getRepository("PayrollRecord");

    // Latest period (by endDate)
    const latestPeriod = await periodRepo.findOne({
      where: {},
      order: { endDate: "DESC" },
    });

    if (!latestPeriod) {
      return { status: true, data: null };
    }

    const records = await payrollRepo.find({
      where: { periodId: latestPeriod.id },
    });

    const employeeCount = records.length;
    const totalGross = records.reduce(
      (sum, r) => sum + parseFloat(r.grossPay || 0),
      0,
    );
    const totalNet = records.reduce(
      (sum, r) => sum + parseFloat(r.netPay || 0),
      0,
    );
    const totalDeductions = records.reduce(
      (sum, r) => sum + parseFloat(r.deductionsTotal || 0),
      0,
    );
    const totalOvertimePay = records.reduce(
      (sum, r) => sum + parseFloat(r.overtimePay || 0),
      0,
    );
    const totalBonus = records.reduce(
      (sum, r) => sum + parseFloat(r.bonus || 0),
      0,
    );
    const totalAllowance = records.reduce(
      (sum, r) => sum + parseFloat(r.allowance || 0),
      0,
    );

    const averageGross = employeeCount > 0 ? totalGross / employeeCount : 0;
    const averageNet = employeeCount > 0 ? totalNet / employeeCount : 0;

    // Previous period comparison
    const previousPeriod = await periodRepo.findOne({
      where: { endDate: LessThan(latestPeriod.startDate) },
      order: { endDate: "DESC" },
    });

    let comparison = null;
    if (previousPeriod) {
      const prevRecords = await payrollRepo.find({
        where: { periodId: previousPeriod.id },
      });
      const prevGross = prevRecords.reduce(
        (sum, r) => sum + parseFloat(r.grossPay || 0),
        0,
      );
      const prevNet = prevRecords.reduce(
        (sum, r) => sum + parseFloat(r.netPay || 0),
        0,
      );
      const grossChangePercent = prevGross
        ? ((totalGross - prevGross) / prevGross) * 100
        : 0;
      const netChangePercent = prevNet
        ? ((totalNet - prevNet) / prevNet) * 100
        : 0;
      comparison = { grossChangePercent, netChangePercent };
    }

    // Current month aggregates (if multiple periods exist within the same month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
    const periodsThisMonth = await periodRepo.find({
      where: { endDate: Between(startOfMonth, endOfMonth) },
    });
    let currentMonthTotals = null;
    if (periodsThisMonth.length > 0) {
      const recordsThisMonth = await payrollRepo.find({
        where: { periodId: In(periodsThisMonth.map((p) => p.id)) },
      });
      currentMonthTotals = {
        gross: recordsThisMonth.reduce(
          (sum, r) => sum + parseFloat(r.grossPay || 0),
          0,
        ),
        net: recordsThisMonth.reduce(
          (sum, r) => sum + parseFloat(r.netPay || 0),
          0,
        ),
        deductions: recordsThisMonth.reduce(
          (sum, r) => sum + parseFloat(r.deductionsTotal || 0),
          0,
        ),
      };
    }

    return {
      status: true,
      data: {
        latestPeriod: {
          id: latestPeriod.id,
          name: latestPeriod.name,
          startDate: latestPeriod.startDate,
          endDate: latestPeriod.endDate,
          payDate: latestPeriod.payDate,
          status: latestPeriod.status,
          employeeCount,
          totalGross,
          totalNet,
          totalDeductions,
          totalOvertimePay,
          totalBonus,
          totalAllowance,
          averageGross,
          averageNet,
        },
        comparison,
        currentMonthTotals,
      },
    };
  }

  // ----------------------------------------------------------------------
  // 📆 UPCOMING PAY DATE (unchanged)
  // ----------------------------------------------------------------------

  // @ts-ignore
  async getUpcomingPayDate(params) {
    const periodRepo = AppDataSource.getRepository("PayrollPeriod");

    // @ts-ignore
    const today = new Date();

    const upcoming = await periodRepo.findOne({
      where: [{ status: "open" }, { status: "processing" }],
      order: { payDate: "ASC" },
    });

    return {
      status: true,
      data: upcoming ? upcoming.payDate : null,
    };
  }

  // ----------------------------------------------------------------------
  // ⏳ PENDING PAYROLL PERIODS COUNT (unchanged)
  // ----------------------------------------------------------------------

  // @ts-ignore
  async getPendingPayrollPeriods(params) {
    const periodRepo = AppDataSource.getRepository("PayrollPeriod");
    const count = await periodRepo.count({
      where: [{ status: "open" }, { status: "processing" }],
    });
    return { status: true, data: count };
  }

  // ----------------------------------------------------------------------
  // 📊 ATTENDANCE TREND (last 7 days) – already returns by status, unchanged
  // ----------------------------------------------------------------------

  // @ts-ignore
  async getAttendanceTrend(params) {
    const attendanceRepo = AppDataSource.getRepository("AttendanceLog");
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6); // inclusive last 7 days

    const logs = await attendanceRepo
      .createQueryBuilder("attendance")
      .select("DATE(attendance.timestamp)", "date")
      .addSelect("attendance.status", "status")
      .addSelect("COUNT(*)", "count")
      .where("attendance.timestamp >= :start", { start: sevenDaysAgo })
      .groupBy("DATE(attendance.timestamp)")
      .addGroupBy("attendance.status")
      .orderBy("date", "ASC")
      .getRawMany();

    // Build map with zeros for all 7 days
    const trendMap = new Map();
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(sevenDaysAgo.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      trendMap.set(dateStr, {
        date: dateStr,
        present: 0,
        late: 0,
        absent: 0,
        halfDay: 0,
        other: 0,
      });
    }

    logs.forEach((row) => {
      const dateStr = row.date;
      if (trendMap.has(dateStr)) {
        const entry = trendMap.get(dateStr);
        const status = row.status;
        const count = parseInt(row.count, 10);
        if (["present", "late", "absent", "half-day"].includes(status)) {
          const key = status === "half-day" ? "halfDay" : status;
          entry[key] = (entry[key] || 0) + count;
        } else {
          entry.other = (entry.other || 0) + count;
        }
      }
    });

    const trend = Array.from(trendMap.values());
    return { status: true, data: trend };
  }

  // ----------------------------------------------------------------------
  // 🕒 RECENT ACTIVITY (unchanged)
  // ----------------------------------------------------------------------

  // @ts-ignore
  async getRecentActivity(params) {
    const attendanceRepo = AppDataSource.getRepository("AttendanceLog");
    const logs = await attendanceRepo.find({
      relations: ["employee"],
      order: { timestamp: "DESC" },
      take: 10,
    });

    const activities = logs.map((log) => ({
      id: log.id,
      employeeName: log.employee
        ? `${log.employee.firstName} ${log.employee.lastName}`
        : "Unknown",
      timestamp: log.timestamp,
      status: log.status,
      source: log.source,
    }));

    return { status: true, data: activities };
  }

  // ----------------------------------------------------------------------
  // 🆕 NEW METHODS
  // ----------------------------------------------------------------------

  /**
   * Monthly attendance summary (present, absent, late, half-day counts for current month)
   */

  // @ts-ignore
  async getMonthlyAttendanceSummary(params) {
    const attendanceRepo = AppDataSource.getRepository("AttendanceLog");
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const logs = await attendanceRepo.find({
      where: { timestamp: Between(startOfMonth, endOfMonth) },
    });

    const present = logs.filter((l) => l.status === "present").length;
    const absent = logs.filter((l) => l.status === "absent").length;
    const late = logs.filter((l) => l.status === "late").length;
    const halfDay = logs.filter((l) => l.status === "half-day").length;
    const others = logs.length - (present + absent + late + halfDay);

    // Count distinct days in month (for reference)
    const uniqueDays = new Set(
      logs.map((l) => l.timestamp.toISOString().split("T")[0]),
    ).size;

    return {
      status: true,
      data: {
        month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
        present,
        absent,
        late,
        halfDay,
        others,
        totalLogs: logs.length,
        uniqueDays,
      },
    };
  }

  /**
   * Overtime summary for current month
   */

  // @ts-ignore
  async getOvertimeSummary(params) {
    const attendanceRepo = AppDataSource.getRepository("AttendanceLog");
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    const logs = await attendanceRepo.find({
      where: { timestamp: Between(startOfMonth, endOfMonth) },
    });

    const totalOvertimeHours = logs.reduce(
      (sum, l) => sum + parseFloat(l.overtimeHours || 0),
      0,
    );
    const employeesWithOvertime = new Set(
      logs.filter((l) => l.overtimeHours > 0).map((l) => l.employeeId),
    ).size;

    return {
      status: true,
      data: {
        totalOvertimeHours,
        employeesWithOvertime,
      },
    };
  }

  /**
   * Top employees by attendance (most present days in current month)
   */

  // @ts-ignore
  async getTopEmployeesByAttendance(params) {
    const attendanceRepo = AppDataSource.getRepository("AttendanceLog");
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );

    // Get all present logs this month, group by employee, count distinct days
    const result = await attendanceRepo
      .createQueryBuilder("attendance")
      .select("attendance.employeeId", "employeeId")
      .addSelect("COUNT(DISTINCT DATE(attendance.timestamp))", "presentCount")
      .where("attendance.timestamp BETWEEN :start AND :end", {
        start: startOfMonth,
        end: endOfMonth,
      })
      .andWhere("attendance.status IN ('present', 'late', 'half-day')") // consider these as "present" days
      .groupBy("attendance.employeeId")
      .orderBy("presentCount", "DESC")
      .limit(5)
      .getRawMany();

    if (result.length === 0) {
      return { status: true, data: [] };
    }

    const employeeIds = result.map((r) => r.employeeId);
    const employeeRepo = AppDataSource.getRepository("Employee");
    const employees = await employeeRepo.findByIds(employeeIds);

    const topEmployees = result.map((row) => {
      const emp = employees.find((e) => e.id === row.employeeId);
      return {
        employeeId: row.employeeId,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : "Unknown",
        presentCount: parseInt(row.presentCount, 10),
      };
    });

    return { status: true, data: topEmployees };
  }

  /**
   * Payroll comparison: current period vs previous period (already used inside getPayrollSummary, but exposed separately)
   */

  // @ts-ignore
  async getPayrollComparison(params) {
    const periodRepo = AppDataSource.getRepository("PayrollPeriod");
    const payrollRepo = AppDataSource.getRepository("PayrollRecord");

    const currentPeriod = await periodRepo.findOne({
      where: {},
      order: { endDate: "DESC" },
    });

    if (!currentPeriod) {
      return { status: true, data: null };
    }

    const previousPeriod = await periodRepo.findOne({
      where: { endDate: LessThan(currentPeriod.startDate) },
      order: { endDate: "DESC" },
    });

    if (!previousPeriod) {
      return { status: true, data: null };
    }

    const currentRecords = await payrollRepo.find({
      where: { periodId: currentPeriod.id },
    });
    const prevRecords = await payrollRepo.find({
      where: { periodId: previousPeriod.id },
    });

    const currentGross = currentRecords.reduce(
      (sum, r) => sum + parseFloat(r.grossPay || 0),
      0,
    );
    const currentNet = currentRecords.reduce(
      (sum, r) => sum + parseFloat(r.netPay || 0),
      0,
    );
    const prevGross = prevRecords.reduce(
      (sum, r) => sum + parseFloat(r.grossPay || 0),
      0,
    );
    const prevNet = prevRecords.reduce(
      (sum, r) => sum + parseFloat(r.netPay || 0),
      0,
    );

    const grossChangePercent = prevGross
      ? ((currentGross - prevGross) / prevGross) * 100
      : 0;
    const netChangePercent = prevNet
      ? ((currentNet - prevNet) / prevNet) * 100
      : 0;

    return {
      status: true,
      data: {
        currentPeriod: { id: currentPeriod.id, name: currentPeriod.name },
        previousPeriod: { id: previousPeriod.id, name: previousPeriod.name },
        grossChangePercent,
        netChangePercent,
      },
    };
  }
}

// Register IPC handler
const dashboardHandler = new DashboardHandler();
ipcMain.handle(
  "dashboard",
  withErrorHandling(
    // @ts-ignore
    dashboardHandler.handleRequest.bind(dashboardHandler),
    "IPC:dashboard",
  ),
);

module.exports = { DashboardHandler, dashboardHandler };

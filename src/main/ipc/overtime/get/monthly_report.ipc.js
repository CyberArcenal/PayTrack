// src/ipc/handlers/overtime/get/monthly_report.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Generate monthly overtime report
 * @param {number} [year]
 * @param {number} [month] - 1-12
 * @param {Object} [filters]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getMonthlyOvertimeReport(year, month, filters = {}) {
  try {
    // Use current month if not specified
    const now = new Date();
    const reportYear = year || now.getFullYear();
    const reportMonth = month || now.getMonth() + 1; // 1-12

    // Validate inputs
    if (reportYear < 2000 || reportYear > 2100) {
      return {
        status: false,
        message: "Invalid year. Must be between 2000 and 2100",
        data: null,
      };
    }

    if (reportMonth < 1 || reportMonth > 12) {
      return {
        status: false,
        message: "Invalid month. Must be between 1 and 12",
        data: null,
      };
    }

    // Calculate date range
    const firstDay = new Date(reportYear, reportMonth - 1, 1);
    const lastDay = new Date(reportYear, reportMonth, 0);
    
    const startDate = firstDay.toISOString().split("T")[0];
    const endDate = lastDay.toISOString().split("T")[0];

    const overtimeLogRepo = AppDataSource.getRepository("OvertimeLog");
    
    // Get overtime logs for the month
    const query = overtimeLogRepo.createQueryBuilder("overtime")
      .leftJoinAndSelect("overtime.employee", "employee")
      .leftJoinAndSelect("overtime.payrollRecord", "payrollRecord")
      .where("overtime.date BETWEEN :startDate AND :endDate", { startDate, endDate });

    // Apply filters
    if (filters.department) {
      query.andWhere("employee.department = :department", { department: filters.department });
    }

    if (filters.status) {
      query.andWhere("overtime.approvalStatus = :status", { status: filters.status });
    }

    const logs = await query
      .orderBy("overtime.date", "ASC")
      .addOrderBy("employee.lastName", "ASC")
      .getMany();

    // Initialize report structure
    const report = {
      month: reportMonth,
      year: reportYear,
      dateRange: { startDate, endDate },
      totals: {
        daysWithOvertime: new Set(),
        totalLogs: logs.length,
        totalHours: 0,
        totalAmount: 0,
        totalEmployees: new Set(),
        byStatus: {},
        byType: {},
      },
      dailyData: {},
      employeeData: {},
      departmentData: {},
      trends: {
        dailyHours: {},
        dailyAmount: {},
      },
    };

    // Process each log
    logs.forEach(log => {
      const date = log.date;
      const employeeId = log.employeeId;
      const department = log.employee?.department || "Unknown";
      const status = log.approvalStatus;
      const type = log.type;
      const hours = parseFloat(log.hours) || 0;
      const amount = parseFloat(log.amount) || 0;

      // Update totals
      report.totals.daysWithOvertime.add(date);
      report.totals.totalEmployees.add(employeeId);
      report.totals.totalHours += hours;
      report.totals.totalAmount += amount;

      // Count by status
      report.totals.byStatus[status] = (report.totals.byStatus[status] || 0) + 1;

      // Count by type
      report.totals.byType[type] = (report.totals.byType[type] || 0) + 1;

      // Daily data
      if (!report.dailyData[date]) {
        report.dailyData[date] = {
          date,
          totalHours: 0,
          totalAmount: 0,
          employeeCount: new Set(),
          logs: [],
        };
        report.trends.dailyHours[date] = 0;
        report.trends.dailyAmount[date] = 0;
      }
      report.dailyData[date].totalHours += hours;
      report.dailyData[date].totalAmount += amount;
      report.dailyData[date].employeeCount.add(employeeId);
      report.dailyData[date].logs.push(log);
      report.trends.dailyHours[date] += hours;
      report.trends.dailyAmount[date] += amount;

      // Employee data
      if (!report.employeeData[employeeId]) {
        report.employeeData[employeeId] = {
          employeeId,
          employeeName: `${log.employee?.firstName || ""} ${log.employee?.lastName || ""}`.trim(),
          employeeNumber: log.employee?.employeeNumber,
          department: log.employee?.department,
          totalHours: 0,
          totalAmount: 0,
          daysWorked: new Set(),
          logs: [],
        };
      }
      report.employeeData[employeeId].totalHours += hours;
      report.employeeData[employeeId].totalAmount += amount;
      report.employeeData[employeeId].daysWorked.add(date);
      report.employeeData[employeeId].logs.push(log);

      // Department data
      if (!report.departmentData[department]) {
        report.departmentData[department] = {
          department,
          totalHours: 0,
          totalAmount: 0,
          employeeCount: new Set(),
          logs: [],
        };
      }
      report.departmentData[department].totalHours += hours;
      report.departmentData[department].totalAmount += amount;
      report.departmentData[department].employeeCount.add(employeeId);
      report.departmentData[department].logs.push(log);
    });

    // Convert Sets to counts/arrays
    report.totals.daysWithOvertime = report.totals.daysWithOvertime.size;
    report.totals.totalEmployees = report.totals.totalEmployees.size;

    Object.values(report.dailyData).forEach(day => {
      day.employeeCount = day.employeeCount.size;
    });

    Object.values(report.employeeData).forEach(emp => {
      emp.daysWorked = emp.daysWorked.size;
      emp.averageHoursPerDay = emp.daysWorked > 0 ? (emp.totalHours / emp.daysWorked).toFixed(2) : 0;
    });

    Object.values(report.departmentData).forEach(dept => {
      dept.employeeCount = dept.employeeCount.size;
      dept.averageHoursPerEmployee = dept.employeeCount > 0 ? (dept.totalHours / dept.employeeCount).toFixed(2) : 0;
    });

    // Calculate averages
    report.totals.averageHoursPerDay = report.totals.daysWithOvertime > 0 
      ? (report.totals.totalHours / report.totals.daysWithOvertime).toFixed(2)
      : 0;
    
    report.totals.averageHoursPerEmployee = report.totals.totalEmployees > 0
      ? (report.totals.totalHours / report.totals.totalEmployees).toFixed(2)
      : 0;

    // Sort data
    report.sortedEmployees = Object.values(report.employeeData)
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 10); // Top 10

    report.sortedDepartments = Object.values(report.departmentData)
      .sort((a, b) => b.totalHours - a.totalHours);

    // Previous month comparison (if available)
    const prevMonth = reportMonth === 1 ? 12 : reportMonth - 1;
    const prevYear = reportMonth === 1 ? reportYear - 1 : reportYear;
    
    const prevFirstDay = new Date(prevYear, prevMonth - 1, 1);
    const prevLastDay = new Date(prevYear, prevMonth, 0);
    
    const prevStartDate = prevFirstDay.toISOString().split("T")[0];
    const prevEndDate = prevLastDay.toISOString().split("T")[0];

    const prevMonthLogs = await overtimeLogRepo.count({
      where: {
        date: {
          $between: [prevStartDate, prevEndDate],
        },
      },
    });

    report.previousMonthComparison = {
      month: prevMonth,
      year: prevYear,
      totalLogs: prevMonthLogs,
      percentageChange: logs.length > 0 
        ? (((logs.length - prevMonthLogs) / prevMonthLogs) * 100).toFixed(2)
        : 0,
    };

    logger.info(`Generated monthly overtime report for ${reportYear}-${reportMonth}: ${logs.length} logs`);

    return {
      status: true,
      message: "Monthly overtime report generated successfully",
      data: report,
    };
  } catch (error) {
    logger.error(`Error in getMonthlyOvertimeReport for ${year}-${month}:`, error);
    
    return {
      status: false,
      message: error.message || "Failed to generate monthly overtime report",
      data: null,
    };
  }
};
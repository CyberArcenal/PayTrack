// src/ipc/handlers/overtime/get/report.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Generate comprehensive overtime report
 * @param {Object} [dateRange]
 * @param {Object} [filters]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getOvertimeReport(dateRange = {}, filters = {}) {
  try {
    const overtimeLogRepo = AppDataSource.getRepository("OvertimeLog");
    const employeeRepo = AppDataSource.getRepository("Employee");

    // Build base query
    const query = overtimeLogRepo.createQueryBuilder("overtime")
      .leftJoinAndSelect("overtime.employee", "employee")
      .leftJoinAndSelect("overtime.payrollRecord", "payrollRecord");

    // Apply date range
    if (dateRange.startDate && dateRange.endDate) {
      query.andWhere("overtime.date BETWEEN :startDate AND :endDate", {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
    } else {
      // Default to current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      query.andWhere("overtime.date BETWEEN :startDate AND :endDate", {
        startDate: firstDay.toISOString().split("T")[0],
        endDate: lastDay.toISOString().split("T")[0],
      });
    }

    // Apply filters
    if (filters.employeeId) {
      query.andWhere("overtime.employeeId = :employeeId", { employeeId: filters.employeeId });
    }

    if (filters.department) {
      query.andWhere("employee.department = :department", { department: filters.department });
    }

    if (filters.status) {
      query.andWhere("overtime.approvalStatus = :status", { status: filters.status });
    }

    // Get all logs
    const logs = await query
      .orderBy("overtime.date", "DESC")
      .addOrderBy("employee.lastName", "ASC")
      .getMany();

    // Generate report data
    const reportData = {
      summary: {
        totalLogs: logs.length,
        totalHours: 0,
        totalAmount: 0,
        byStatus: {},
        byType: {},
        byDepartment: {},
      },
      dailyBreakdown: {},
      employeeBreakdown: {},
      departmentBreakdown: {},
    };

    // Process each log
    logs.forEach(log => {
      const hours = parseFloat(log.hours) || 0;
      const amount = parseFloat(log.amount) || 0;
      const date = log.date;
      const employeeId = log.employeeId;
      const department = log.employee?.department || "Unknown";
      const status = log.approvalStatus;
      const type = log.type;

      // Update totals
      reportData.summary.totalHours += hours;
      reportData.summary.totalAmount += amount;

      // Count by status
      reportData.summary.byStatus[status] = (reportData.summary.byStatus[status] || 0) + 1;

      // Count by type
      reportData.summary.byType[type] = (reportData.summary.byType[type] || 0) + 1;

      // Count by department
      reportData.summary.byDepartment[department] = (reportData.summary.byDepartment[department] || 0) + 1;

      // Daily breakdown
      if (!reportData.dailyBreakdown[date]) {
        reportData.dailyBreakdown[date] = {
          date,
          totalHours: 0,
          totalAmount: 0,
          employeeCount: new Set(),
          logs: [],
        };
      }
      reportData.dailyBreakdown[date].totalHours += hours;
      reportData.dailyBreakdown[date].totalAmount += amount;
      reportData.dailyBreakdown[date].employeeCount.add(employeeId);
      reportData.dailyBreakdown[date].logs.push(log);

      // Employee breakdown
      if (!reportData.employeeBreakdown[employeeId]) {
        reportData.employeeBreakdown[employeeId] = {
          employeeId,
          employeeName: `${log.employee?.firstName || ""} ${log.employee?.lastName || ""}`.trim(),
          employeeNumber: log.employee?.employeeNumber,
          department: log.employee?.department,
          totalHours: 0,
          totalAmount: 0,
          logs: [],
        };
      }
      reportData.employeeBreakdown[employeeId].totalHours += hours;
      reportData.employeeBreakdown[employeeId].totalAmount += amount;
      reportData.employeeBreakdown[employeeId].logs.push(log);

      // Department breakdown
      if (!reportData.departmentBreakdown[department]) {
        reportData.departmentBreakdown[department] = {
          department,
          totalHours: 0,
          totalAmount: 0,
          employeeCount: new Set(),
        };
      }
      reportData.departmentBreakdown[department].totalHours += hours;
      reportData.departmentBreakdown[department].totalAmount += amount;
      reportData.departmentBreakdown[department].employeeCount.add(employeeId);
    });

    // Convert Sets to counts
    Object.values(reportData.dailyBreakdown).forEach(day => {
      day.employeeCount = day.employeeCount.size;
      // Sort logs by time
      day.logs.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    Object.values(reportData.departmentBreakdown).forEach(dept => {
      dept.employeeCount = dept.employeeCount.size;
    });

    // Sort employee breakdown by total hours (descending)
    const sortedEmployees = Object.values(reportData.employeeBreakdown)
      .sort((a, b) => b.totalHours - a.totalHours);

    // Sort department breakdown by total hours (descending)
    const sortedDepartments = Object.values(reportData.departmentBreakdown)
      .sort((a, b) => b.totalHours - a.totalHours);

    // Sort daily breakdown by date (descending)
    const sortedDaily = Object.values(reportData.dailyBreakdown)
      .sort((a, b) => b.date.localeCompare(a.date));

    logger.info(`Generated overtime report with ${logs.length} logs`);

    return {
      status: true,
      message: "Overtime report generated successfully",
      data: {
        ...reportData,
        dailyBreakdown: sortedDaily,
        employeeBreakdown: sortedEmployees,
        departmentBreakdown: sortedDepartments,
        generatedAt: new Date().toISOString(),
        dateRange: dateRange.startDate && dateRange.endDate 
          ? { startDate: dateRange.startDate, endDate: dateRange.endDate }
          : { currentMonth: true },
      },
    };
  } catch (error) {
    logger.error("Error in getOvertimeReport:", error);
    
    return {
      status: false,
      message: error.message || "Failed to generate overtime report",
      data: null,
    };
  }
};
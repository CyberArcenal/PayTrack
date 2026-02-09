// src/ipc/handlers/overtime/get/daily_report.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Generate daily overtime report
 * @param {string} [date] - YYYY-MM-DD format
 * @param {Object} [filters]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getDailyOvertimeReport(date, filters = {}) {
  try {
    // Use today if no date provided
    const reportDate = date || new Date().toISOString().split("T")[0];
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
      return {
        status: false,
        message: "Invalid date format. Use YYYY-MM-DD",
        data: null,
      };
    }

    const overtimeLogRepo = AppDataSource.getRepository("OvertimeLog");
    
    // Get overtime logs for the day
    const logs = await overtimeLogRepo.find({
      where: { date: reportDate },
      relations: ["employee", "payrollRecord"],
      order: { startTime: "ASC" },
    });

    // Group by status
    const byStatus = {
      pending: { count: 0, hours: 0, amount: 0, logs: [] },
      approved: { count: 0, hours: 0, amount: 0, logs: [] },
      rejected: { count: 0, hours: 0, amount: 0, logs: [] },
    };

    // Group by department
    const byDepartment = {};
    const departmentTotals = {};

    // Process each log
    logs.forEach(log => {
      const status = log.approvalStatus;
      const department = log.employee?.department || "Unknown";
      const hours = parseFloat(log.hours) || 0;
      const amount = parseFloat(log.amount) || 0;

      // Update status group
      byStatus[status].count += 1;
      byStatus[status].hours += hours;
      byStatus[status].amount += amount;
      byStatus[status].logs.push(log);

      // Update department group
      if (!byDepartment[department]) {
        byDepartment[department] = [];
        departmentTotals[department] = { hours: 0, amount: 0, count: 0 };
      }
      byDepartment[department].push(log);
      departmentTotals[department].hours += hours;
      departmentTotals[department].amount += amount;
      departmentTotals[department].count += 1;
    });

    // Calculate totals
    const totals = {
      totalLogs: logs.length,
      totalHours: Object.values(byStatus).reduce((sum, status) => sum + status.hours, 0),
      totalAmount: Object.values(byStatus).reduce((sum, status) => sum + status.amount, 0),
      totalEmployees: new Set(logs.map(log => log.employeeId)).size,
    };

    // Prepare department summary
    const departmentSummary = Object.entries(departmentTotals).map(([dept, stats]) => ({
      department: dept,
      ...stats,
      averageHours: stats.count > 0 ? (stats.hours / stats.count).toFixed(2) : 0,
    })).sort((a, b) => b.hours - a.hours);

    // Find busiest time slots
    const timeSlots = {};
    logs.forEach(log => {
      const startHour = parseInt(log.startTime.split(":")[0]);
      const endHour = parseInt(log.endTime.split(":")[0]);
      
      for (let hour = startHour; hour < endHour; hour++) {
        const slot = `${hour}:00-${hour + 1}:00`;
        timeSlots[slot] = (timeSlots[slot] || 0) + 1;
      }
    });

    const busiestSlots = Object.entries(timeSlots)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([slot, count]) => ({ slot, count }));

    logger.info(`Generated daily overtime report for ${reportDate}: ${logs.length} logs`);

    return {
      status: true,
      message: "Daily overtime report generated successfully",
      data: {
        date: reportDate,
        totals,
        byStatus,
        byDepartment: {
          details: byDepartment,
          summary: departmentSummary,
        },
        timeAnalysis: {
          busiestSlots,
          totalSlots: Object.keys(timeSlots).length,
        },
        logs,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error(`Error in getDailyOvertimeReport for date ${date}:`, error);
    
    return {
      status: false,
      message: error.message || "Failed to generate daily overtime report",
      data: null,
    };
  }
};
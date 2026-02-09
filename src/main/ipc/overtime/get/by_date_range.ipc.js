// src/ipc/handlers/overtime/get/by_date_range.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get overtime logs by date range
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @param {Object} [filters]
 * @returns {Promise<{status: boolean, message: string, data: any[]}>}
 */
module.exports = async function getOvertimeLogsByDateRange(startDate, endDate, filters = {}) {
  try {
    // Validate dates
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!startDate || !endDate || !dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return {
        status: false,
        message: "Invalid date format. Use YYYY-MM-DD for both start and end dates",
        data: [],
      };
    }

    if (new Date(startDate) > new Date(endDate)) {
      return {
        status: false,
        message: "Start date cannot be after end date",
        data: [],
      };
    }

    const overtimeLogRepo = AppDataSource.getRepository("OvertimeLog");
    const query = overtimeLogRepo.createQueryBuilder("overtime")
      .leftJoinAndSelect("overtime.employee", "employee")
      .where("overtime.date BETWEEN :startDate AND :endDate", { startDate, endDate })
      .orderBy("overtime.date", "DESC")
      .addOrderBy("overtime.startTime", "ASC");

    // Apply filters
    if (filters.employeeId) {
      query.andWhere("overtime.employeeId = :employeeId", { employeeId: filters.employeeId });
    }

    if (filters.status) {
      query.andWhere("overtime.approvalStatus = :status", { status: filters.status });
    }

    if (filters.type) {
      query.andWhere("overtime.type = :type", { type: filters.type });
    }

    if (filters.department) {
      query.andWhere("employee.department = :department", { department: filters.department });
    }

    const overtimeLogs = await query.getMany();

    // Group by date for daily breakdown
    const dailyBreakdown = overtimeLogs.reduce((acc, log) => {
      const date = log.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          totalHours: 0,
          totalAmount: 0,
          employeeCount: new Set(),
          logs: [],
        };
      }
      acc[date].totalHours += parseFloat(log.hours) || 0;
      acc[date].totalAmount += parseFloat(log.amount) || 0;
      acc[date].employeeCount.add(log.employeeId);
      acc[date].logs.push(log);
      return acc;
    }, {});

    // Convert Set to count
    Object.values(dailyBreakdown).forEach(day => {
      day.employeeCount = day.employeeCount.size;
    });

    // Calculate totals
    const totals = {
      totalDays: Object.keys(dailyBreakdown).length,
      totalHours: Object.values(dailyBreakdown).reduce((sum, day) => sum + day.totalHours, 0),
      totalAmount: Object.values(dailyBreakdown).reduce((sum, day) => sum + day.totalAmount, 0),
      totalLogs: overtimeLogs.length,
    };

    logger.info(`Retrieved ${overtimeLogs.length} overtime logs from ${startDate} to ${endDate}`);

    return {
      status: true,
      message: "Overtime logs retrieved successfully",
      data: {
        dateRange: { startDate, endDate },
        logs: overtimeLogs,
        dailyBreakdown: Object.values(dailyBreakdown),
        totals,
      },
    };
  } catch (error) {
    logger.error(`Error in getOvertimeLogsByDateRange from ${startDate} to ${endDate}:`, error);
    
    return {
      status: false,
      message: error.message || "Failed to retrieve overtime logs",
      data: [],
    };
  }
};
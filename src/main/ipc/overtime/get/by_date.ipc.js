// src/ipc/handlers/overtime/get/by_date.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get overtime logs by specific date
 * @param {string} date - YYYY-MM-DD format
 * @param {Object} [filters]
 * @returns {Promise<{status: boolean, message: string, data: any[]}>}
 */
module.exports = async function getOvertimeLogsByDate(date, filters = {}) {
  try {
    // Validate date format
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return {
        status: false,
        message: "Invalid date format. Use YYYY-MM-DD",
        data: [],
      };
    }

    const overtimeLogRepo = AppDataSource.getRepository("OvertimeLog");
    const query = overtimeLogRepo.createQueryBuilder("overtime")
      .leftJoinAndSelect("overtime.employee", "employee")
      .where("overtime.date = :date", { date })
      .orderBy("overtime.startTime", "ASC");

    // Apply additional filters
    if (filters.status) {
      query.andWhere("overtime.approvalStatus = :status", { status: filters.status });
    }

    if (filters.department) {
      query.andWhere("employee.department = :department", { department: filters.department });
    }

    const overtimeLogs = await query.getMany();

    // Group by employee for summary
    const summary = overtimeLogs.reduce((acc, log) => {
      const key = log.employeeId;
      if (!acc[key]) {
        acc[key] = {
          employeeId: log.employeeId,
          employeeName: `${log.employee?.firstName || ""} ${log.employee?.lastName || ""}`.trim(),
          totalHours: 0,
          totalAmount: 0,
          logs: [],
        };
      }
      acc[key].totalHours += parseFloat(log.hours) || 0;
      acc[key].totalAmount += parseFloat(log.amount) || 0;
      acc[key].logs.push(log);
      return acc;
    }, {});

    const dailyTotal = {
      totalEmployees: Object.keys(summary).length,
      totalHours: Object.values(summary).reduce((sum, emp) => sum + emp.totalHours, 0),
      totalAmount: Object.values(summary).reduce((sum, emp) => sum + emp.totalAmount, 0),
    };

    logger.info(`Retrieved ${overtimeLogs.length} overtime logs for date ${date}`);

    return {
      status: true,
      message: "Overtime logs retrieved successfully",
      data: {
        date,
        logs: overtimeLogs,
        summary: Object.values(summary),
        totals: dailyTotal,
      },
    };
  } catch (error) {
    logger.error(`Error in getOvertimeLogsByDate for date ${date}:`, error);
    
    return {
      status: false,
      message: error.message || "Failed to retrieve overtime logs",
      data: [],
    };
  }
};
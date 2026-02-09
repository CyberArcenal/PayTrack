// src/ipc/handlers/overtime/get/pending.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get pending overtime logs awaiting approval
 * @param {Object} [filters]
 * @returns {Promise<{status: boolean, message: string, data: any[]}>}
 */
module.exports = async function getPendingOvertimeLogs(filters = {}) {
  try {
    const overtimeLogRepo = AppDataSource.getRepository("OvertimeLog");
    const query = overtimeLogRepo.createQueryBuilder("overtime")
      .leftJoinAndSelect("overtime.employee", "employee")
      .where("overtime.approvalStatus = :status", { status: "pending" })
      .orderBy("overtime.date", "ASC")
      .addOrderBy("overtime.createdAt", "ASC");

    // Apply filters
    if (filters.department) {
      query.andWhere("employee.department = :department", { department: filters.department });
    }

    if (filters.dateFrom) {
      query.andWhere("overtime.date >= :dateFrom", { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      query.andWhere("overtime.date <= :dateTo", { dateTo: filters.dateTo });
    }

    // Limit for dashboard display
    const limit = filters.limit || 50;
    query.limit(limit);

    const pendingLogs = await query.getMany();

    // Group by employee for easier review
    const groupedByEmployee = pendingLogs.reduce((acc, log) => {
      const employeeId = log.employeeId;
      if (!acc[employeeId]) {
        acc[employeeId] = {
          employeeId,
          employeeName: `${log.employee?.firstName || ""} ${log.employee?.lastName || ""}`.trim(),
          employeeNumber: log.employee?.employeeNumber,
          department: log.employee?.department,
          totalPending: 0,
          totalHours: 0,
          totalAmount: 0,
          logs: [],
        };
      }
      acc[employeeId].totalPending += 1;
      acc[employeeId].totalHours += parseFloat(log.hours) || 0;
      acc[employeeId].totalAmount += parseFloat(log.amount) || 0;
      acc[employeeId].logs.push(log);
      return acc;
    }, {});

    logger.info(`Retrieved ${pendingLogs.length} pending overtime logs`);

    return {
      status: true,
      message: "Pending overtime logs retrieved successfully",
      data: {
        logs: pendingLogs,
        groupedByEmployee: Object.values(groupedByEmployee),
        totalPending: pendingLogs.length,
        totalEmployees: Object.keys(groupedByEmployee).length,
        summary: {
          totalHours: Object.values(groupedByEmployee).reduce((sum, emp) => sum + emp.totalHours, 0),
          totalAmount: Object.values(groupedByEmployee).reduce((sum, emp) => sum + emp.totalAmount, 0),
        },
      },
    };
  } catch (error) {
    logger.error("Error in getPendingOvertimeLogs:", error);
    
    return {
      status: false,
      message: error.message || "Failed to retrieve pending overtime logs",
      data: [],
    };
  }
};
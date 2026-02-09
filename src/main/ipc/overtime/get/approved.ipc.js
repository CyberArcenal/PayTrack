// src/ipc/handlers/overtime/get/approved.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get approved overtime logs
 * @param {Object} [dateRange]
 * @param {Object} [filters]
 * @returns {Promise<{status: boolean, message: string, data: any[]}>}
 */
module.exports = async function getApprovedOvertimeLogs(dateRange = {}, filters = {}) {
  try {
    const overtimeLogRepo = AppDataSource.getRepository("OvertimeLog");
    const query = overtimeLogRepo.createQueryBuilder("overtime")
      .leftJoinAndSelect("overtime.employee", "employee")
      .leftJoinAndSelect("overtime.payrollRecord", "payrollRecord")
      .where("overtime.approvalStatus = :status", { status: "approved" })
      .orderBy("overtime.date", "DESC");

    // Apply date range
    if (dateRange.startDate && dateRange.endDate) {
      query.andWhere("overtime.date BETWEEN :startDate AND :endDate", {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
    } else {
      // Default to last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.andWhere("overtime.date >= :thirtyDaysAgo", {
        thirtyDaysAgo: thirtyDaysAgo.toISOString().split("T")[0],
      });
    }

    // Apply filters
    if (filters.employeeId) {
      query.andWhere("overtime.employeeId = :employeeId", { employeeId: filters.employeeId });
    }

    if (filters.department) {
      query.andWhere("employee.department = :department", { department: filters.department });
    }

    if (filters.payrollProcessed === true) {
      query.andWhere("overtime.payrollRecordId IS NOT NULL");
    } else if (filters.payrollProcessed === false) {
      query.andWhere("overtime.payrollRecordId IS NULL");
    }

    const approvedLogs = await query.getMany();

    // Calculate statistics
    const stats = approvedLogs.reduce(
      (acc, log) => {
        acc.totalHours += parseFloat(log.hours) || 0;
        acc.totalAmount += parseFloat(log.amount) || 0;
        
        if (log.payrollRecordId) {
          acc.payrollProcessed += 1;
        } else {
          acc.pendingPayroll += 1;
        }
        
        // Count by type
        acc.byType[log.type] = (acc.byType[log.type] || 0) + 1;
        
        return acc;
      },
      {
        totalHours: 0,
        totalAmount: 0,
        payrollProcessed: 0,
        pendingPayroll: 0,
        byType: {},
      }
    );

    logger.info(`Retrieved ${approvedLogs.length} approved overtime logs`);

    return {
      status: true,
      message: "Approved overtime logs retrieved successfully",
      data: {
        logs: approvedLogs,
        stats,
        total: approvedLogs.length,
        dateRange: dateRange.startDate && dateRange.endDate 
          ? { startDate: dateRange.startDate, endDate: dateRange.endDate }
          : { last30Days: true },
      },
    };
  } catch (error) {
    logger.error("Error in getApprovedOvertimeLogs:", error);
    
    return {
      status: false,
      message: error.message || "Failed to retrieve approved overtime logs",
      data: [],
    };
  }
};
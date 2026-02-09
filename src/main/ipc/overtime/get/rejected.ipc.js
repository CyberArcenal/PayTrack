// src/ipc/handlers/overtime/get/rejected.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get rejected overtime logs
 * @param {Object} [dateRange]
 * @param {Object} [filters]
 * @returns {Promise<{status: boolean, message: string, data: any[]}>}
 */
module.exports = async function getRejectedOvertimeLogs(dateRange = {}, filters = {}) {
  try {
    const overtimeLogRepo = AppDataSource.getRepository("OvertimeLog");
    const query = overtimeLogRepo.createQueryBuilder("overtime")
      .leftJoinAndSelect("overtime.employee", "employee")
      .where("overtime.approvalStatus = :status", { status: "rejected" })
      .orderBy("overtime.updatedAt", "DESC");

    // Apply date range
    if (dateRange.startDate && dateRange.endDate) {
      query.andWhere("overtime.date BETWEEN :startDate AND :endDate", {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
    } else {
      // Default to last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      query.andWhere("overtime.date >= :ninetyDaysAgo", {
        ninetyDaysAgo: ninetyDaysAgo.toISOString().split("T")[0],
      });
    }

    // Apply filters
    if (filters.employeeId) {
      query.andWhere("overtime.employeeId = :employeeId", { employeeId: filters.employeeId });
    }

    if (filters.department) {
      query.andWhere("employee.department = :department", { department: filters.department });
    }

    if (filters.reviewer) {
      query.andWhere("overtime.approvedBy LIKE :reviewer", { reviewer: `%${filters.reviewer}%` });
    }

    const rejectedLogs = await query.getMany();

    // Analyze rejection patterns
    const rejectionAnalysis = rejectedLogs.reduce(
      (acc, log) => {
        // Count by month
        const month = log.date.substring(0, 7); // YYYY-MM
        acc.byMonth[month] = (acc.byMonth[month] || 0) + 1;
        
        // Count by employee
        acc.byEmployee[log.employeeId] = (acc.byEmployee[log.employeeId] || 0) + 1;
        
        // Count by department
        const dept = log.employee?.department || "Unknown";
        acc.byDepartment[dept] = (acc.byDepartment[dept] || 0) + 1;
        
        // Note analysis (if available)
        if (log.note && log.note.length > 5) {
          acc.withNotes += 1;
        }
        
        return acc;
      },
      {
        byMonth: {},
        byEmployee: {},
        byDepartment: {},
        withNotes: 0,
        total: rejectedLogs.length,
      }
    );

    logger.info(`Retrieved ${rejectedLogs.length} rejected overtime logs`);

    return {
      status: true,
      message: "Rejected overtime logs retrieved successfully",
      data: {
        logs: rejectedLogs,
        analysis: rejectionAnalysis,
        dateRange: dateRange.startDate && dateRange.endDate 
          ? { startDate: dateRange.startDate, endDate: dateRange.endDate }
          : { last90Days: true },
      },
    };
  } catch (error) {
    logger.error("Error in getRejectedOvertimeLogs:", error);
    
    return {
      status: false,
      message: error.message || "Failed to retrieve rejected overtime logs",
      data: [],
    };
  }
};
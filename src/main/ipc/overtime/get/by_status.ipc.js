// src/ipc/handlers/overtime/get/by_status.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get overtime logs by approval status
 * @param {string} status
 * @param {Object} [filters]
 * @returns {Promise<{status: boolean, message: string, data: any[]}>}
 */
module.exports = async function getOvertimeLogsByStatus(status, filters = {}) {
  try {
    const validStatuses = ["pending", "approved", "rejected"];
    
    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return {
        status: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        data: [],
      };
    }

    const overtimeLogRepo = AppDataSource.getRepository("OvertimeLog");
    const query = overtimeLogRepo.createQueryBuilder("overtime")
      .leftJoinAndSelect("overtime.employee", "employee")
      .where("overtime.approvalStatus = :status", { status: status.toLowerCase() })
      .orderBy("overtime.date", "DESC");

    // Apply additional filters
    if (filters.dateFrom && filters.dateTo) {
      query.andWhere("overtime.date BETWEEN :dateFrom AND :dateTo", {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
    }

    if (filters.employeeId) {
      query.andWhere("overtime.employeeId = :employeeId", { employeeId: filters.employeeId });
    }

    if (filters.department) {
      query.andWhere("employee.department = :department", { department: filters.department });
    }

    // Pagination
    if (filters.limit) {
      query.limit(filters.limit);
      if (filters.offset) {
        query.offset(filters.offset);
      }
    }

    const overtimeLogs = await query.getMany();

    // Get counts for all statuses
    const statusCounts = await Promise.all(
      validStatuses.map(async (s) => {
        const count = await overtimeLogRepo.count({ where: { approvalStatus: s } });
        return { status: s, count };
      })
    );

    logger.info(`Retrieved ${overtimeLogs.length} overtime logs with status: ${status}`);

    return {
      status: true,
      message: "Overtime logs retrieved successfully",
      data: {
        logs: overtimeLogs,
        status: status.toLowerCase(),
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item.status] = item.count;
          return acc;
        }, {}),
        total: overtimeLogs.length,
      },
    };
  } catch (error) {
    logger.error(`Error in getOvertimeLogsByStatus for status ${status}:`, error);
    
    return {
      status: false,
      message: error.message || "Failed to retrieve overtime logs",
      data: [],
    };
  }
};
// src/ipc/handlers/overtime/get/all.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * @typedef {Object} OvertimeFilters
 * @property {number} [employeeId]
 * @property {string} [dateFrom]
 * @property {string} [dateTo]
 * @property {string} [status]
 * @property {string} [type]
 * @property {number} [limit]
 * @property {number} [offset]
 * @property {string} [orderBy]
 * @property {'ASC'|'DESC'} [order]
 */

/**
 * Get all overtime logs with optional filters
 * @param {OvertimeFilters} [filters]
 * @returns {Promise<{status: boolean, message: string, data: any[]}>}
 */
module.exports = async function getAllOvertimeLogs(filters = {}) {
  try {
    const overtimeLogRepo = AppDataSource.getRepository("OvertimeLog");
    
    const query = overtimeLogRepo.createQueryBuilder("overtime")
      .leftJoinAndSelect("overtime.employee", "employee")
      .leftJoinAndSelect("overtime.payrollRecord", "payrollRecord")
      .where("1=1");

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

    if (filters.dateFrom && filters.dateTo) {
      query.andWhere("overtime.date BETWEEN :dateFrom AND :dateTo", {
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      });
    } else if (filters.dateFrom) {
      query.andWhere("overtime.date >= :dateFrom", { dateFrom: filters.dateFrom });
    } else if (filters.dateTo) {
      query.andWhere("overtime.date <= :dateTo", { dateTo: filters.dateTo });
    }

    // Ordering
    const orderBy = filters.orderBy || "overtime.date";
    const order = filters.order || "DESC";
    query.orderBy(orderBy, order);

    // Pagination
    if (filters.limit) {
      query.limit(filters.limit);
      if (filters.offset) {
        query.offset(filters.offset);
      }
    }

    const overtimeLogs = await query.getMany();
    
    // Calculate total for pagination
    const total = await query.getCount();

    logger.info(`Retrieved ${overtimeLogs.length} overtime logs`);

    return {
      status: true,
      message: "Overtime logs retrieved successfully",
      data: {
        logs: overtimeLogs,
        total,
        limit: filters.limit || null,
        offset: filters.offset || 0,
      },
    };
  } catch (error) {
    logger.error("Error in getAllOvertimeLogs:", error);
    
    return {
      status: false,
      message: error.message || "Failed to retrieve overtime logs",
      data: [],
    };
  }
};
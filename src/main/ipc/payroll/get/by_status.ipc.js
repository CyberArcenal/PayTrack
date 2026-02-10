// src/ipc/handlers/payroll-period/get/by_status.ipc.js
const { AppDataSource } = require("../../../db/datasource");
const { logger } = require("../../../../utils/logger");

/**
 * Get payroll periods by status
 * @param {string} status - Period status (open, processing, locked, closed)
 * @param {Object} [filters] - Additional filters
 * @returns {Promise<Object>} Response object
 */
module.exports = async function getPayrollPeriodsByStatus(status, filters = {}) {
  try {
    // Validate status
    const validStatuses = ["open", "processing", "locked", "closed"];
    if (!validStatuses.includes(status)) {
      return {
        status: false,
        message: `Invalid status. Valid values: ${validStatuses.join(", ")}`,
        data: null
      };
    }
    
    const periodRepository = AppDataSource.getRepository("PayrollPeriod");
    const queryBuilder = periodRepository.createQueryBuilder("period");
    
    queryBuilder.where("period.status = :status", { status });
    
    // Apply additional filters
    if (filters.periodType) {
      queryBuilder.andWhere("period.periodType = :periodType", { 
        periodType: filters.periodType 
      });
    }
    
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      if (!isNaN(startDate.getTime())) {
        queryBuilder.andWhere("period.startDate >= :startDate", { startDate });
      }
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      if (!isNaN(endDate.getTime())) {
        queryBuilder.andWhere("period.endDate <= :endDate", { endDate });
      }
    }
    
    // Sorting
    const sortBy = filters.sortBy || "startDate";
    const sortOrder = (filters.sortOrder || "DESC").toUpperCase();
    queryBuilder.orderBy(`period.${sortBy}`, sortOrder);
    
    // Pagination
    if (filters.limit && filters.limit > 0) {
      queryBuilder.limit(filters.limit);
      if (filters.offset && filters.offset >= 0) {
        queryBuilder.offset(filters.offset);
      }
    }
    
    const [periods, total] = await queryBuilder.getManyAndCount();
    
    logger?.info(`Found ${periods.length} ${status} payroll periods`);
    
    return {
      status: true,
      message: `Payroll periods with status '${status}' retrieved successfully`,
      data: {
        periods,
        total,
        status
      }
    };
  } catch (error) {
    logger?.error(`Error in getPayrollPeriodsByStatus for status '${status}':`, error);
    return {
      status: false,
      message: `Failed to retrieve payroll periods: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};
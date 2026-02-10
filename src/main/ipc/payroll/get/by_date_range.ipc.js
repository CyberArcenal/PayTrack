// src/ipc/handlers/payroll-period/get/by_date_range.ipc.js

const { AppDataSource } = require("../../../db/datasource");
const { logger } = require("../../../../utils/logger");

/**
 * Get payroll periods within a date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @param {Object} [filters] - Additional filters
 * @returns {Promise<Object>} Response object
 */
module.exports = async function getPayrollPeriodsByDateRange(startDate, endDate, filters = {}) {
  try {
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        status: false,
        message: "Invalid date range provided",
        data: null
      };
    }
    
    if (start > end) {
      return {
        status: false,
        message: "Start date cannot be after end date",
        data: null
      };
    }
    
    const periodRepository = AppDataSource.getRepository("PayrollPeriod");
    const queryBuilder = periodRepository.createQueryBuilder("period");
    
    // Find periods that overlap with the date range
    queryBuilder.where("period.endDate >= :start", { start })
                .andWhere("period.startDate <= :end", { end });
    
    // Apply additional filters
    if (filters.status) {
      queryBuilder.andWhere("period.status = :status", { status: filters.status });
    }
    
    if (filters.periodType) {
      queryBuilder.andWhere("period.periodType = :periodType", { 
        periodType: filters.periodType 
      });
    }
    
    queryBuilder.orderBy("period.startDate", "ASC");
    
    const periods = await queryBuilder.getMany();
    
    logger?.info(`Found ${periods.length} periods between ${start.toISOString().split('T')[0]} and ${end.toISOString().split('T')[0]}`);
    
    return {
      status: true,
      message: "Payroll periods retrieved successfully",
      data: periods
    };
  } catch (error) {
    logger?.error("Error in getPayrollPeriodsByDateRange:", error);
    return {
      status: false,
      message: `Failed to retrieve payroll periods: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};
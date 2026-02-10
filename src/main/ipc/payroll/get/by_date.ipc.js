// src/ipc/handlers/payroll-period/get/by_date.ipc.js

const { AppDataSource } = require("../../../db/datasource");
const { logger } = require("../../../../utils/logger");

/**
 * Get payroll periods by date (find period that contains the date)
 * @param {Date|string} date - Date to search for
 * @param {Object} [filters] - Additional filters
 * @returns {Promise<Object>} Response object
 */
module.exports = async function getPayrollPeriodsByDate(date, filters = {}) {
  try {
    // Validate date
    const searchDate = new Date(date);
    if (isNaN(searchDate.getTime())) {
      return {
        status: false,
        message: "Invalid date provided",
        data: null
      };
    }
    
    const periodRepository = AppDataSource.getRepository("PayrollPeriod");
    const queryBuilder = periodRepository.createQueryBuilder("period");
    
    // Find periods where the date falls between start and end dates
    queryBuilder.where("period.startDate <= :date", { date: searchDate })
                .andWhere("period.endDate >= :date", { date: searchDate });
    
    // Apply additional filters
    if (filters.status) {
      queryBuilder.andWhere("period.status = :status", { status: filters.status });
    }
    
    if (filters.periodType) {
      queryBuilder.andWhere("period.periodType = :periodType", { 
        periodType: filters.periodType 
      });
    }
    
    queryBuilder.orderBy("period.startDate", "DESC");
    
    const periods = await queryBuilder.getMany();
    
    logger?.info(`Found ${periods.length} periods for date ${searchDate.toISOString().split('T')[0]}`);
    
    return {
      status: true,
      message: "Payroll periods retrieved successfully",
      data: periods
    };
  } catch (error) {
    logger?.error("Error in getPayrollPeriodsByDate:", error);
    return {
      status: false,
      message: `Failed to retrieve payroll periods: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};
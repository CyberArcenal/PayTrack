// src/ipc/handlers/payroll-period/get/all.ipc.js

const { AppDataSource } = require("../../../db/datasource");
const { logger } = require("../../../../utils/logger");

/**
 * Get all payroll periods with optional filters
 * @param {Object} filters - Filter criteria
 * @param {string} [filters.status] - Filter by status
 * @param {string} [filters.periodType] - Filter by period type
 * @param {Date|string} [filters.startDate] - Filter by start date
 * @param {Date|string} [filters.endDate] - Filter by end date
 * @param {number} [filters.limit] - Limit results
 * @param {number} [filters.offset] - Offset for pagination
 * @param {string} [filters.sortBy] - Field to sort by
 * @param {'ASC'|'DESC'} [filters.sortOrder] - Sort order
 * @returns {Promise<Object>} Response object
 */
module.exports = async function getAllPayrollPeriods(filters = {}) {
  try {
    const periodRepository = AppDataSource.getRepository("PayrollPeriod");
    
    // Build query
    const queryBuilder = periodRepository.createQueryBuilder("period");
    
    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere("period.status = :status", { status: filters.status });
    }
    
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
    
    // Apply sorting
    const sortBy = filters.sortBy || "startDate";
    const sortOrder = (filters.sortOrder || "DESC").toUpperCase();
    queryBuilder.orderBy(`period.${sortBy}`, sortOrder);
    
    // Apply pagination
    if (filters.limit && filters.limit > 0) {
      queryBuilder.limit(filters.limit);
      if (filters.offset && filters.offset >= 0) {
        queryBuilder.offset(filters.offset);
      }
    }
    
    // Execute query
    const [periods, total] = await queryBuilder.getManyAndCount();
    
    logger?.info(`Retrieved ${periods.length} payroll periods`);
    
    return {
      status: true,
      message: "Payroll periods retrieved successfully",
      data: {
        periods,
        total,
        limit: filters.limit || total,
        offset: filters.offset || 0
      }
    };
  } catch (error) {
    logger?.error("Error in getAllPayrollPeriods:", error);
    return {
      status: false,
      message: `Failed to retrieve payroll periods: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};
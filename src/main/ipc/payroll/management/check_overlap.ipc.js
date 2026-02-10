// src/ipc/handlers/payroll-period/management/check_overlap.ipc.js
const { AppDataSource } = require("../../../db/datasource");
const { logger } = require("../../../../utils/logger");

/**
 * Check if a date range overlaps with existing payroll periods
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @param {number} [excludePeriodId] - Period ID to exclude from check
 * @returns {Promise<Object>} Response object
 */
module.exports = async function checkPeriodOverlap(startDate, endDate, excludePeriodId) {
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
    
    // Build query to find overlapping periods
    const queryBuilder = periodRepository.createQueryBuilder("period");
    
    // Conditions for overlap:
    // 1. New period starts during existing period
    // 2. New period ends during existing period
    // 3. New period completely contains existing period
    // 4. Existing period completely contains new period
    queryBuilder.where(
      "(period.startDate <= :end AND period.endDate >= :start)",
      { start, end }
    );
    
    // Exclude specified period (for updates)
    if (excludePeriodId && !isNaN(Number(excludePeriodId))) {
      queryBuilder.andWhere("period.id != :excludeId", { 
        excludeId: parseInt(excludePeriodId) 
      });
    }
    
    queryBuilder.orderBy("period.startDate", "ASC");
    
    const overlappingPeriods = await queryBuilder.getMany();
    
    const hasOverlap = overlappingPeriods.length > 0;
    
    logger?.info(`Checked overlap for ${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}: ${hasOverlap ? 'OVERLAP' : 'NO OVERLAP'}`);
    
    return {
      status: true,
      message: hasOverlap ? "Overlapping periods found" : "No overlapping periods",
      data: {
        hasOverlap,
        overlappingPeriods,
        overlapCount: overlappingPeriods.length,
        dateRange: {
          start,
          end
        }
      }
    };
  } catch (error) {
    logger?.error("Error in checkPeriodOverlap:", error);
    return {
      status: false,
      message: `Failed to check period overlap: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};
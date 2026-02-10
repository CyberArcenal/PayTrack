// src/ipc/handlers/payroll-period/check_duplicate.ipc.js
const { AppDataSource } = require("../../db/datasource");
const { logger } = require("../../../utils/logger");

/**
 * Check for duplicate payroll period
 * @param {Object} periodData - Period data to check
 * @returns {Promise<Object>} Response object
 */
module.exports = async function checkDuplicatePeriod(periodData) {
  try {
    const periodRepository = AppDataSource.getRepository("PayrollPeriod");
    
    const conditions = [];
    const parameters = {};
    
    // Check by name
    if (periodData.name) {
      conditions.push("period.name = :name");
      parameters.name = periodData.name;
    }
    
    // Check by exact date range
    if (periodData.startDate && periodData.endDate) {
      const startDate = new Date(periodData.startDate);
      const endDate = new Date(periodData.endDate);
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        conditions.push("(period.startDate = :startDate AND period.endDate = :endDate)");
        parameters.startDate = startDate;
        parameters.endDate = endDate;
      }
    }
    
    // If no conditions, return early
    if (conditions.length === 0) {
      return {
        status: true,
        message: "No duplicate check criteria provided",
        data: {
          isDuplicate: false,
          duplicatePeriods: [],
          criteria: []
        }
      };
    }
    
    // Build query
    const queryBuilder = periodRepository.createQueryBuilder("period");
    queryBuilder.where(`(${conditions.join(" OR ")})`, parameters);
    
    // Exclude current period for updates
    if (periodData.id && !isNaN(Number(periodData.id))) {
      queryBuilder.andWhere("period.id != :excludeId", { 
        excludeId: parseInt(periodData.id) 
      });
    }
    
    const duplicatePeriods = await queryBuilder.getMany();
    const isDuplicate = duplicatePeriods.length > 0;
    
    logger?.info(`Checked for duplicate period: ${isDuplicate ? 'DUPLICATE FOUND' : 'NO DUPLICATE'}`);
    
    return {
      status: true,
      message: isDuplicate ? "Duplicate period found" : "No duplicate period",
      data: {
        isDuplicate,
        duplicatePeriods,
        duplicateCount: duplicatePeriods.length,
        criteria: conditions
      }
    };
  } catch (error) {
    logger?.error("Error in checkDuplicatePeriod:", error);
    return {
      status: false,
      message: `Failed to check for duplicate period: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};
// src/ipc/handlers/payroll-period/get/current.ipc.js
const { AppDataSource } = require("../../../db/datasource");
const { logger } = require("../../../../utils/logger");

/**
 * Get current payroll period (open period that contains current date)
 * @param {Date|string} [date] - Optional date (defaults to current date)
 * @returns {Promise<Object>} Response object
 */
module.exports = async function getCurrentPayrollPeriod(date) {
  try {
    const targetDate = date ? new Date(date) : new Date();
    
    if (isNaN(targetDate.getTime())) {
      return {
        status: false,
        message: "Invalid date provided",
        data: null
      };
    }
    
    const periodRepository = AppDataSource.getRepository("PayrollPeriod");
    
    // Find open period that contains the target date
    const period = await periodRepository.findOne({
      where: {
        status: "open",
        startDate: { $lte: targetDate },
        endDate: { $gte: targetDate }
      },
      order: { startDate: "DESC" }
    });
    
    if (!period) {
      // Try to find any period that contains the date (including locked/processing)
      const anyPeriod = await periodRepository.findOne({
        where: {
          startDate: { $lte: targetDate },
          endDate: { $gte: targetDate }
        },
        order: { startDate: "DESC" }
      });
      
      if (anyPeriod) {
        logger?.info(`Found ${anyPeriod.status} period for date ${targetDate.toISOString().split('T')[0]}`);
        return {
          status: true,
          message: `Found ${anyPeriod.status} period (not open)`,
          data: anyPeriod,
          isOpen: anyPeriod.status === "open"
        };
      }
      
      return {
        status: false,
        message: `No payroll period found for date ${targetDate.toISOString().split('T')[0]}`,
        data: null,
        isOpen: false
      };
    }
    
    logger?.info(`Found open payroll period for date ${targetDate.toISOString().split('T')[0]}`);
    
    return {
      status: true,
      message: "Current open payroll period found",
      data: period,
      isOpen: true
    };
  } catch (error) {
    logger?.error("Error in getCurrentPayrollPeriod:", error);
    return {
      status: false,
      message: `Failed to retrieve current payroll period: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};
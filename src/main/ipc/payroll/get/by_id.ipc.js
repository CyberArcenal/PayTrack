// src/ipc/handlers/payroll-period/get/by_id.ipc.js

const { AppDataSource } = require("../../../db/datasource");
const { logger } = require("../../../../utils/logger");

/**
 * Get payroll period by ID
 * @param {number} periodId - Payroll period ID
 * @returns {Promise<Object>} Response object
 */
module.exports = async function getPayrollPeriodById(periodId) {
  try {
    // Validate input
    if (!periodId || isNaN(Number(periodId))) {
      return {
        status: false,
        message: "Invalid period ID",
        data: null
      };
    }
    
    const id = parseInt(periodId);
    const periodRepository = AppDataSource.getRepository("PayrollPeriod");
    
    const period = await periodRepository.findOne({
      where: { id },
      relations: ["payrollRecords", "payrollRecords.employee"]
    });
    
    if (!period) {
      return {
        status: false,
        message: `Payroll period with ID ${id} not found`,
        data: null
      };
    }
    
    logger?.info(`Retrieved payroll period ${id}`);
    
    return {
      status: true,
      message: "Payroll period retrieved successfully",
      data: period
    };
  } catch (error) {
    logger?.error(`Error in getPayrollPeriodById for ID ${periodId}:`, error);
    return {
      status: false,
      message: `Failed to retrieve payroll period: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};
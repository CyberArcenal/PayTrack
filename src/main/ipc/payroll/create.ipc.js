// src/ipc/handlers/payroll-period/create.ipc.js
const { AppDataSource } = require("../../db/datasource");
const { logger } = require("../../../utils/logger");

/**
 * Create a new payroll period
 * @param {Object} periodData - Payroll period data
 * @param {import("typeorm").QueryRunner} [queryRunner] - Optional query runner for transaction
 * @returns {Promise<Object>} Response object
 */
module.exports = async function createPayrollPeriod(periodData, queryRunner) {
  let shouldReleaseQueryRunner = false;
  let localQueryRunner = queryRunner;
  
  try {
    // Validate required fields
    const requiredFields = ['startDate', 'endDate', 'payDate', 'periodType'];
    const missingFields = requiredFields.filter(field => !periodData[field]);
    
    if (missingFields.length > 0) {
      return {
        status: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        data: null
      };
    }
    
    // Validate dates
    const startDate = new Date(periodData.startDate);
    const endDate = new Date(periodData.endDate);
    const payDate = new Date(periodData.payDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || isNaN(payDate.getTime())) {
      return {
        status: false,
        message: "Invalid date format",
        data: null
      };
    }
    
    if (startDate > endDate) {
      return {
        status: false,
        message: "Start date cannot be after end date",
        data: null
      };
    }
    
    if (payDate < endDate) {
      return {
        status: false,
        message: "Pay date should be on or after end date",
        data: null
      };
    }
    
    // Validate period type
    const validPeriodTypes = ['weekly', 'bi-weekly', 'semi-monthly', 'monthly'];
    if (!validPeriodTypes.includes(periodData.periodType)) {
      return {
        status: false,
        message: `Invalid period type. Valid values: ${validPeriodTypes.join(', ')}`,
        data: null
      };
    }
    
    // Create query runner if not provided
    if (!localQueryRunner) {
      localQueryRunner = AppDataSource.createQueryRunner();
      await localQueryRunner.connect();
      await localQueryRunner.startTransaction();
      shouldReleaseQueryRunner = true;
    }
    
    const periodRepository = localQueryRunner.manager.getRepository("PayrollPeriod");
    
    // Check for overlapping periods
    const overlappingPeriod = await periodRepository.findOne({
      where: [
        {
          startDate: { $lte: endDate },
          endDate: { $gte: startDate }
        }
      ]
    });
    
    if (overlappingPeriod) {
      if (shouldReleaseQueryRunner) {
        await localQueryRunner.rollbackTransaction();
        await localQueryRunner.release();
      }
      
      return {
        status: false,
        message: `Period overlaps with existing period: ${overlappingPeriod.name || overlappingPeriod.id}`,
        data: null
      };
    }
    
    // Calculate working days if not provided
    let workingDays = periodData.workingDays;
    if (!workingDays || workingDays <= 0) {
      // Simple calculation: weekdays between dates
      const start = new Date(startDate);
      const end = new Date(endDate);
      let count = 0;
      
      while (start <= end) {
        const day = start.getDay();
        if (day !== 0 && day !== 6) { // Not Sunday (0) or Saturday (6)
          count++;
        }
        start.setDate(start.getDate() + 1);
      }
      
      workingDays = count || 10; // Default to 10 if calculation fails
    }
    
    // Create period object
    const period = periodRepository.create({
      name: periodData.name || `Payroll ${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`,
      periodType: periodData.periodType,
      startDate,
      endDate,
      payDate,
      workingDays,
      status: periodData.status || 'open',
      totalEmployees: 0,
      totalGrossPay: 0,
      totalDeductions: 0,
      totalNetPay: 0
    });
    
    // Save period
    const savedPeriod = await periodRepository.save(period);
    
    if (shouldReleaseQueryRunner) {
      await localQueryRunner.commitTransaction();
      await localQueryRunner.release();
    }
    
    logger?.info(`Created payroll period ${savedPeriod.id}: ${savedPeriod.name}`);
    
    return {
      status: true,
      message: "Payroll period created successfully",
      data: savedPeriod
    };
  } catch (error) {
    if (shouldReleaseQueryRunner && localQueryRunner) {
      await localQueryRunner.rollbackTransaction();
      await localQueryRunner.release();
    }
    
    logger?.error("Error in createPayrollPeriod:", error);
    return {
      status: false,
      message: `Failed to create payroll period: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};
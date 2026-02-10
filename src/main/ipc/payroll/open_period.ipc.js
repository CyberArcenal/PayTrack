// src/ipc/handlers/payroll-period/open_period.ipc.js
const { AppDataSource } = require("../../db/datasource");
const { logger } = require("../../../utils/logger");

/**
 * Open a payroll period (set status to open)
 * @param {Object} periodData - Period data containing id
 * @param {import("typeorm").QueryRunner} [queryRunner] - Optional query runner for transaction
 * @returns {Promise<Object>} Response object
 */
module.exports = async function openPayrollPeriod(periodData, queryRunner) {
  let shouldReleaseQueryRunner = false;
  let localQueryRunner = queryRunner;
  
  try {
    // Validate required fields
    if (!periodData.id || isNaN(Number(periodData.id))) {
      return {
        status: false,
        message: "Valid period ID is required",
        data: null
      };
    }
    
    const periodId = parseInt(periodData.id);
    
    // Create query runner if not provided
    if (!localQueryRunner) {
      localQueryRunner = AppDataSource.createQueryRunner();
      await localQueryRunner.connect();
      await localQueryRunner.startTransaction();
      shouldReleaseQueryRunner = true;
    }
    
    const periodRepository = localQueryRunner.manager.getRepository("PayrollPeriod");
    
    // Check if period exists
    const existingPeriod = await periodRepository.findOne({ where: { id: periodId } });
    
    if (!existingPeriod) {
      if (shouldReleaseQueryRunner) {
        await localQueryRunner.rollbackTransaction();
        await localQueryRunner.release();
      }
      
      return {
        status: false,
        message: `Payroll period with ID ${periodId} not found`,
        data: null
      };
    }
    
    // Check if period can be opened
    if (existingPeriod.status === 'closed') {
      if (shouldReleaseQueryRunner) {
        await localQueryRunner.rollbackTransaction();
        await localQueryRunner.release();
      }
      
      return {
        status: false,
        message: "Cannot open a closed period",
        data: null
      };
    }
    
    // Update period status to open
    await periodRepository.update(periodId, { 
      status: 'open',
      lockedAt: null // Clear lockedAt if it was locked
    });
    
    // Get updated period
    const updatedPeriod = await periodRepository.findOne({ where: { id: periodId } });
    
    if (shouldReleaseQueryRunner) {
      await localQueryRunner.commitTransaction();
      await localQueryRunner.release();
    }
    
    logger?.info(`Opened payroll period ${periodId}`);
    
    return {
      status: true,
      message: "Payroll period opened successfully",
      data: updatedPeriod
    };
  } catch (error) {
    if (shouldReleaseQueryRunner && localQueryRunner) {
      await localQueryRunner.rollbackTransaction();
      await localQueryRunner.release();
    }
    
    logger?.error(`Error in openPayrollPeriod for period ${periodData.id}:`, error);
    return {
      status: false,
      message: `Failed to open payroll period: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};
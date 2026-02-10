// src/ipc/handlers/payroll-period/close_period.ipc.js
const { AppDataSource } = require("../../db/datasource");
const { logger } = require("../../../utils/logger");

/**
 * Close a payroll period (set status to closed)
 * @param {Object} periodData - Period data containing id
 * @param {import("typeorm").QueryRunner} [queryRunner] - Optional query runner for transaction
 * @returns {Promise<Object>} Response object
 */
module.exports = async function closePayrollPeriod(periodData, queryRunner) {
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
    const payrollRecordRepository = localQueryRunner.manager.getRepository("PayrollRecord");
    
    // Check if period exists
    const existingPeriod = await periodRepository.findOne({ 
      where: { id: periodId },
      relations: ["payrollRecords"]
    });
    
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
    
    // Check if period can be closed (must be locked first)
    if (existingPeriod.status !== 'locked') {
      if (shouldReleaseQueryRunner) {
        await localQueryRunner.rollbackTransaction();
        await localQueryRunner.release();
      }
      
      return {
        status: false,
        message: "Period must be locked before closing",
        data: null,
        currentStatus: existingPeriod.status
      };
    }
    
    // Check if all payroll records are paid
    if (existingPeriod.payrollRecords && existingPeriod.payrollRecords.length > 0) {
      const unpaidRecords = existingPeriod.payrollRecords.filter(
        record => record.paymentStatus !== 'paid'
      );
      
      if (unpaidRecords.length > 0) {
        if (shouldReleaseQueryRunner) {
          await localQueryRunner.rollbackTransaction();
          await localQueryRunner.release();
        }
        
        return {
          status: false,
          message: `Cannot close period with ${unpaidRecords.length} unpaid payroll records`,
          data: null,
          unpaidCount: unpaidRecords.length
        };
      }
    }
    
    // Update period status to closed
    const now = new Date();
    await periodRepository.update(periodId, { 
      status: 'closed',
      closedAt: now
    });
    
    // Get updated period
    const updatedPeriod = await periodRepository.findOne({ where: { id: periodId } });
    
    if (shouldReleaseQueryRunner) {
      await localQueryRunner.commitTransaction();
      await localQueryRunner.release();
    }
    
    logger?.info(`Closed payroll period ${periodId} at ${now.toISOString()}`);
    
    return {
      status: true,
      message: "Payroll period closed successfully",
      data: updatedPeriod
    };
  } catch (error) {
    if (shouldReleaseQueryRunner && localQueryRunner) {
      await localQueryRunner.rollbackTransaction();
      await localQueryRunner.release();
    }
    
    logger?.error(`Error in closePayrollPeriod for period ${periodData.id}:`, error);
    return {
      status: false,
      message: `Failed to close payroll period: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};
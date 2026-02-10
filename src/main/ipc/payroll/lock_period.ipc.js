// src/ipc/handlers/payroll-period/lock_period.ipc.js
const { AppDataSource } = require("../../db/datasource");
const { logger } = require("../../../utils/logger");

/**
 * Lock a payroll period (set status to locked)
 * @param {Object} periodData - Period data containing id
 * @param {import("typeorm").QueryRunner} [queryRunner] - Optional query runner for transaction
 * @returns {Promise<Object>} Response object
 */
module.exports = async function lockPayrollPeriod(periodData, queryRunner) {
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
    
    // Check if period can be locked
    if (existingPeriod.status === 'closed') {
      if (shouldReleaseQueryRunner) {
        await localQueryRunner.rollbackTransaction();
        await localQueryRunner.release();
      }
      
      return {
        status: false,
        message: "Cannot lock a closed period",
        data: null
      };
    }
    
    // Check if all payroll records are computed
    if (existingPeriod.payrollRecords && existingPeriod.payrollRecords.length > 0) {
      const uncomputedRecords = existingPeriod.payrollRecords.filter(
        record => !record.computedAt
      );
      
      if (uncomputedRecords.length > 0) {
        if (shouldReleaseQueryRunner) {
          await localQueryRunner.rollbackTransaction();
          await localQueryRunner.release();
        }
        
        return {
          status: false,
          message: `Cannot lock period with ${uncomputedRecords.length} uncomputed payroll records`,
          data: null,
          uncomputedCount: uncomputedRecords.length
        };
      }
    }
    
    // Update period status to locked
    const now = new Date();
    await periodRepository.update(periodId, { 
      status: 'locked',
      lockedAt: now
    });
    
    // Get updated period
    const updatedPeriod = await periodRepository.findOne({ where: { id: periodId } });
    
    if (shouldReleaseQueryRunner) {
      await localQueryRunner.commitTransaction();
      await localQueryRunner.release();
    }
    
    logger?.info(`Locked payroll period ${periodId} at ${now.toISOString()}`);
    
    return {
      status: true,
      message: "Payroll period locked successfully",
      data: updatedPeriod
    };
  } catch (error) {
    if (shouldReleaseQueryRunner && localQueryRunner) {
      await localQueryRunner.rollbackTransaction();
      await localQueryRunner.release();
    }
    
    logger?.error(`Error in lockPayrollPeriod for period ${periodData.id}:`, error);
    return {
      status: false,
      message: `Failed to lock payroll period: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};
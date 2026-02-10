// src/ipc/handlers/payroll-period/delete/delete.ipc.js
//@ts-check
const { AppDataSource } = require("../../../db/datasource");
const { logger } = require("../../../../utils/logger");

/**
 * Delete a payroll period
 * @param {Object} deleteData - Delete data containing id
 * @param {import("typeorm").QueryRunner} [queryRunner] - Optional query runner for transaction
 * @returns {Promise<Object>} Response object
 */
module.exports = async function deletePayrollPeriod(deleteData, queryRunner) {
  let shouldReleaseQueryRunner = false;
  let localQueryRunner = queryRunner;
  
  try {
    // Validate required fields
    if (!deleteData.id || isNaN(Number(deleteData.id))) {
      return {
        status: false,
        message: "Valid period ID is required",
        data: null
      };
    }
    
    const periodId = parseInt(deleteData.id);
    
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
    
    // Prevent deletion of locked or closed periods
    if (existingPeriod.status === 'locked' || existingPeriod.status === 'closed') {
      if (shouldReleaseQueryRunner) {
        await localQueryRunner.rollbackTransaction();
        await localQueryRunner.release();
      }
      
      return {
        status: false,
        message: `Cannot delete ${existingPeriod.status} payroll period`,
        data: null
      };
    }
    
    // Check if period has payroll records
    if (existingPeriod.payrollRecords && existingPeriod.payrollRecords.length > 0) {
      if (shouldReleaseQueryRunner) {
        await localQueryRunner.rollbackTransaction();
        await localQueryRunner.release();
      }
      
      return {
        status: false,
        message: `Cannot delete period with ${existingPeriod.payrollRecords.length} payroll records`,
        data: null,
        recordCount: existingPeriod.payrollRecords.length
      };
    }
    
    // Delete period
    await periodRepository.delete(periodId);
    
    if (shouldReleaseQueryRunner) {
      await localQueryRunner.commitTransaction();
      await localQueryRunner.release();
    }
    
    logger?.info(`Deleted payroll period ${periodId}`);
    
    return {
      status: true,
      message: "Payroll period deleted successfully",
      data: { id: periodId }
    };
  } catch (error) {
    if (shouldReleaseQueryRunner && localQueryRunner) {
      await localQueryRunner.rollbackTransaction();
      await localQueryRunner.release();
    }
    
    logger?.error(`Error in deletePayrollPeriod for period ${deleteData.id}:`, error);
    return {
      status: false,
      message: `Failed to delete payroll period: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};
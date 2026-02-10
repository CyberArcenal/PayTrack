// src/ipc/handlers/payroll-period/update_totals.ipc.js
const { AppDataSource } = require("../../db/datasource");
const { logger } = require("../../../utils/logger");

/**
 * Update period totals from payroll records
 * @param {Object} updateData - Update data containing id
 * @param {import("typeorm").QueryRunner} [queryRunner] - Optional query runner for transaction
 * @returns {Promise<Object>} Response object
 */
module.exports = async function updatePeriodTotals(updateData, queryRunner) {
  let shouldReleaseQueryRunner = false;
  let localQueryRunner = queryRunner;
  
  try {
    // Validate required fields
    if (!updateData.id || isNaN(Number(updateData.id))) {
      return {
        status: false,
        message: "Valid period ID is required",
        data: null
      };
    }
    
    const periodId = parseInt(updateData.id);
    
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
    
    // Get all payroll records for this period
    const payrollRecords = await payrollRecordRepository.find({
      where: { periodId },
      select: ['grossPay', 'deductionsTotal', 'netPay', 'paymentStatus']
    });
    
    // Calculate totals
    let totalEmployees = payrollRecords.length;
    let totalGrossPay = 0;
    let totalDeductions = 0;
    let totalNetPay = 0;
    let paidEmployees = 0;
    
    payrollRecords.forEach(record => {
      totalGrossPay += parseFloat(record.grossPay) || 0;
      totalDeductions += parseFloat(record.deductionsTotal) || 0;
      totalNetPay += parseFloat(record.netPay) || 0;
      
      if (record.paymentStatus === 'paid') {
        paidEmployees++;
      }
    });
    
    // Update period with calculated totals
    await periodRepository.update(periodId, {
      totalEmployees,
      totalGrossPay,
      totalDeductions,
      totalNetPay
    });
    
    // Get updated period
    const updatedPeriod = await periodRepository.findOne({ where: { id: periodId } });
    
    if (shouldReleaseQueryRunner) {
      await localQueryRunner.commitTransaction();
      await localQueryRunner.release();
    }
    
    logger?.info(`Updated totals for payroll period ${periodId}: ${totalEmployees} employees, ${totalNetPay} net pay`);
    
    return {
      status: true,
      message: "Payroll period totals updated successfully",
      data: {
        period: updatedPeriod,
        summary: {
          totalEmployees,
          totalGrossPay,
          totalDeductions,
          totalNetPay,
          paidEmployees,
          unpaidEmployees: totalEmployees - paidEmployees
        }
      }
    };
  } catch (error) {
    if (shouldReleaseQueryRunner && localQueryRunner) {
      await localQueryRunner.rollbackTransaction();
      await localQueryRunner.release();
    }
    
    logger?.error(`Error in updatePeriodTotals for period ${updateData.id}:`, error);
    return {
      status: false,
      message: `Failed to update period totals: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};
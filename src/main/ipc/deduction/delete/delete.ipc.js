// ===================== src/ipc/handlers/deduction/delete/delete.ipc.js =====================
// @ts-check

const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Delete a deduction
 * @param {Object} params
 * @param {string|number} params.id - Deduction ID
 * @param {import("typeorm").QueryRunner} [queryRunner] - Optional query runner for transaction
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function deleteDeduction(params, queryRunner) {
  const { id } = params;
  
  if (!id) {
    return {
      status: false,
      message: "Deduction ID is required",
      data: null
    };
  }
  
  // @ts-ignore
  const deductionId = parseInt(id);
  if (isNaN(deductionId) || deductionId <= 0) {
    return {
      status: false,
      message: "Invalid deduction ID",
      data: null
    };
  }
  
  const deductionRepo = queryRunner 
    ? queryRunner.manager.getRepository("Deduction")
    : AppDataSource.getRepository("Deduction");
  
  try {
    // Find the deduction first to get payroll record info
    const deduction = await deductionRepo.findOne({
      where: { id: deductionId },
      relations: ["payrollRecord"]
    });
    
    if (!deduction) {
      return {
        status: false,
        message: `Deduction with ID ${deductionId} not found`,
        data: null
      };
    }
    
    // Check if payroll record is locked/processed
    if (deduction.payrollRecord) {
      const payrollRecordRepo = queryRunner 
        ? queryRunner.manager.getRepository("PayrollRecord")
        : AppDataSource.getRepository("PayrollRecord");
      
      const payrollRecord = await payrollRecordRepo.findOne({
        where: { id: deduction.payrollRecordId },
        relations: ["period"]
      });
      
      if (payrollRecord?.period?.status === 'locked' || payrollRecord?.period?.status === 'closed') {
        return {
          status: false,
          message: "Cannot delete deduction for locked or closed payroll period",
          data: null
        };
      }
      
      if (payrollRecord?.paymentStatus === 'paid') {
        return {
          status: false,
          message: "Cannot delete deduction for already paid payroll",
          data: null
        };
      }
    }
    
    // Store deduction info for audit log
    const deductionInfo = {
      id: deduction.id,
      type: deduction.type,
      amount: deduction.amount,
      payrollRecordId: deduction.payrollRecordId
    };
    
    // Remove from payroll totals first
    if (deduction.payrollRecordId) {
      await adjustPayrollRecordTotals(
        deduction.payrollRecordId,
        deduction.type,
        -parseFloat(deduction.amount),
        queryRunner
      );
    }
    
    // Delete the deduction
    const result = await deductionRepo.delete(deductionId);
    
    if (result.affected === 0) {
      return {
        status: false,
        message: `Failed to delete deduction with ID ${deductionId}`,
        data: null
      };
    }
    
    logger.info(`Deduction deleted: ID ${deductionId}, Type: ${deduction.type}, Amount: ${deduction.amount}`);
    
    return {
      status: true,
      message: "Deduction deleted successfully",
      data: {
        deletedId: deductionId,
        deletedDeduction: deductionInfo
      }
    };
    
  } catch (error) {
    // @ts-ignore
    logger.error(`Error in deleteDeduction for ID ${deductionId}:`, error);
    
    // Handle foreign key constraint errors
    // @ts-ignore
    if (error.code === 'SQLITE_CONSTRAINT') {
      return {
        status: false,
        message: "Cannot delete deduction due to existing references",
        data: null
      };
    }
    
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to delete deduction",
      data: null
    };
  }
};

/**
 * Adjust payroll record totals after deletion
 */
// @ts-ignore
async function adjustPayrollRecordTotals(payrollRecordId, deductionType, amount, queryRunner) {
  const payrollRecordRepo = queryRunner 
    ? queryRunner.manager.getRepository("PayrollRecord")
    : AppDataSource.getRepository("PayrollRecord");
  
  try {
    const payrollRecord = await payrollRecordRepo.findOne({
      where: { id: payrollRecordId }
    });
    
    if (!payrollRecord) return;
    
    const updateFields = {};
    
    // Adjust the appropriate field
    switch (deductionType) {
      case 'sss':
        // @ts-ignore
        updateFields.sssDeduction = Math.max(0, (parseFloat(payrollRecord.sssDeduction) || 0) + amount);
        break;
      case 'philhealth':
        // @ts-ignore
        updateFields.philhealthDeduction = Math.max(0, (parseFloat(payrollRecord.philhealthDeduction) || 0) + amount);
        break;
      case 'pagibig':
        // @ts-ignore
        updateFields.pagibigDeduction = Math.max(0, (parseFloat(payrollRecord.pagibigDeduction) || 0) + amount);
        break;
      case 'tax':
        // @ts-ignore
        updateFields.taxDeduction = Math.max(0, (parseFloat(payrollRecord.taxDeduction) || 0) + amount);
        break;
      case 'loan':
        // @ts-ignore
        updateFields.loanDeduction = Math.max(0, (parseFloat(payrollRecord.loanDeduction) || 0) + amount);
        break;
      case 'advance':
        // @ts-ignore
        updateFields.advanceDeduction = Math.max(0, (parseFloat(payrollRecord.advanceDeduction) || 0) + amount);
        break;
      default:
        // @ts-ignore
        updateFields.otherDeductions = Math.max(0, (parseFloat(payrollRecord.otherDeductions) || 0) + amount);
    }
    
    // Recalculate totals
    const totalDeductions = 
      (parseFloat(payrollRecord.sssDeduction) || 0) +
      (parseFloat(payrollRecord.philhealthDeduction) || 0) +
      (parseFloat(payrollRecord.pagibigDeduction) || 0) +
      (parseFloat(payrollRecord.taxDeduction) || 0) +
      (parseFloat(payrollRecord.loanDeduction) || 0) +
      (parseFloat(payrollRecord.advanceDeduction) || 0) +
      (parseFloat(payrollRecord.otherDeductions) || 0);
    
    updateFields.deductionsTotal = totalDeductions;
    updateFields.netPay = Math.max(0, (parseFloat(payrollRecord.grossPay) || 0) - totalDeductions);
    
    await payrollRecordRepo.update(payrollRecordId, updateFields);
    
  } catch (error) {
    // @ts-ignore
    logger.error(`Error adjusting payroll totals after deletion:`, error);
  }
}
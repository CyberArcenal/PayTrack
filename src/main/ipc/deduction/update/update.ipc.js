// ===================== src/ipc/handlers/deduction/update/update.ipc.js =====================
// @ts-check

const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Update an existing deduction
 * @param {Object} params
 * @param {string|number} params.id - Deduction ID
 * @param {Object} params.data - Updated deduction data
 * @param {import("typeorm").QueryRunner} [queryRunner] - Optional query runner for transaction
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function updateDeduction(params, queryRunner) {
  const { id, data = {} } = params;
  
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
    // Find existing deduction
    const existingDeduction = await deductionRepo.findOne({
      where: { id: deductionId },
      relations: ["payrollRecord"]
    });
    
    if (!existingDeduction) {
      return {
        status: false,
        message: `Deduction with ID ${deductionId} not found`,
        data: null
      };
    }
    
    // Store old amount for rollback calculation
    const oldAmount = parseFloat(existingDeduction.amount) || 0;
    const oldType = existingDeduction.type;
    
    // Prepare update data with validation
    const updateData = {};
    
    // @ts-ignore
    if (data.type !== undefined) {
      // @ts-ignore
      if (typeof data.type !== 'string' || data.type.trim() === '') {
        return {
          status: false,
          message: "Invalid deduction type",
          data: null
        };
      }
      // @ts-ignore
      updateData.type = data.type.trim();
    }
    
    // @ts-ignore
    if (data.code !== undefined) {
      // @ts-ignore
      updateData.code = data.code ? data.code.trim() : null;
    }
    
    // @ts-ignore
    if (data.description !== undefined) {
      // @ts-ignore
      updateData.description = data.description ? data.description.trim() : null;
    }
    
    // @ts-ignore
    if (data.amount !== undefined) {
      // @ts-ignore
      const newAmount = parseFloat(data.amount);
      if (isNaN(newAmount) || newAmount < 0) {
        return {
          status: false,
          message: "Invalid amount. Must be a non-negative number",
          data: null
        };
      }
      // @ts-ignore
      updateData.amount = newAmount;
    }
    
    // @ts-ignore
    if (data.percentage !== undefined) {
      // @ts-ignore
      if (data.percentage === null) {
        // @ts-ignore
        updateData.percentage = null;
      } else {
        // @ts-ignore
        const percentage = parseFloat(data.percentage);
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
          return {
            status: false,
            message: "Invalid percentage. Must be between 0 and 100",
            data: null
          };
        }
        // @ts-ignore
        updateData.percentage = percentage;
      }
    }
    
    // @ts-ignore
    if (data.isRecurring !== undefined) {
      // @ts-ignore
      updateData.isRecurring = Boolean(data.isRecurring);
    }
    
    // @ts-ignore
    if (data.appliedDate !== undefined) {
      // @ts-ignore
      if (data.appliedDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.appliedDate)) {
        return {
          status: false,
          message: "Invalid appliedDate format. Use YYYY-MM-DD",
          data: null
        };
      }
      // @ts-ignore
      updateData.appliedDate = data.appliedDate || new Date().toISOString().split('T')[0];
    }
    
    // @ts-ignore
    if (data.note !== undefined) {
      // @ts-ignore
      updateData.note = data.note ? data.note.trim() : null;
    }
    
    updateData.updatedAt = new Date();
    
    // Apply update
    await deductionRepo.update(deductionId, updateData);
    
    // Update payroll record totals if amount changed or type changed
    // @ts-ignore
    const newAmount = updateData.amount !== undefined ? updateData.amount : oldAmount;
    // @ts-ignore
    const newType = updateData.type || oldType;
    
    if (existingDeduction.payrollRecordId && 
        (oldAmount !== newAmount || oldType !== newType)) {
      // First, remove old amount from totals
      await adjustPayrollRecordTotals(
        existingDeduction.payrollRecordId,
        oldType,
        -oldAmount,
        queryRunner
      );
      
      // Then add new amount
      await adjustPayrollRecordTotals(
        existingDeduction.payrollRecordId,
        newType,
        newAmount,
        queryRunner
      );
    }
    
    // Get updated deduction
    const updatedDeduction = await deductionRepo.findOne({
      where: { id: deductionId },
      relations: ["payrollRecord", "payrollRecord.employee"]
    });
    
    logger.info(`Deduction updated: ID ${deductionId}, New amount: ${newAmount}`);
    
    return {
      status: true,
      message: "Deduction updated successfully",
      data: {
        // @ts-ignore
        id: updatedDeduction.id,
        ...updatedDeduction
      }
    };
    
  } catch (error) {
    // @ts-ignore
    logger.error(`Error in updateDeduction for ID ${deductionId}:`, error);
    
    return {
      status: false,
      // @ts-ignore
      message: error.code === 'SQLITE_CONSTRAINT' 
        ? "Database constraint violation"
        // @ts-ignore
        : error.message || "Failed to update deduction",
      data: null
    };
  }
};

/**
 * Adjust payroll record totals
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
    
    // Update the appropriate field
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
    logger.error(`Error adjusting payroll totals for record ${payrollRecordId}:`, error);
  }
}
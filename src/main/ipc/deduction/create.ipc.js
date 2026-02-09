// ===================== src/ipc/handlers/deduction/create.ipc.js =====================
// @ts-check

const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");

/**
 * Validate deduction data
 * @param {Object} data - Deduction data
 * @returns {{isValid: boolean, errors: string[]}}
 */
function validateDeductionData(data) {
  const errors = [];
  
  // Required fields
  // @ts-ignore
  if (!data.payrollRecordId) {
    errors.push("payrollRecordId is required");
  // @ts-ignore
  } else if (isNaN(Number(data.payrollRecordId)) || Number(data.payrollRecordId) <= 0) {
    errors.push("Invalid payrollRecordId");
  }
  
  // @ts-ignore
  if (!data.type || typeof data.type !== 'string' || data.type.trim() === '') {
    errors.push("Valid deduction type is required");
  }
  
  // @ts-ignore
  if (data.amount === undefined || data.amount === null) {
    errors.push("Amount is required");
  // @ts-ignore
  } else if (isNaN(parseFloat(data.amount)) || parseFloat(data.amount) < 0) {
    errors.push("Invalid amount. Must be a non-negative number");
  }
  
  // Validate percentage if provided
  // @ts-ignore
  if (data.percentage !== undefined && data.percentage !== null) {
    // @ts-ignore
    const percentage = parseFloat(data.percentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      errors.push("Invalid percentage. Must be between 0 and 100");
    }
  }
  
  // Validate date
  // @ts-ignore
  if (data.appliedDate) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    // @ts-ignore
    if (!dateRegex.test(data.appliedDate)) {
      errors.push("Invalid appliedDate format. Use YYYY-MM-DD");
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Create a new deduction
 * @param {Object} deductionData - Deduction data
 * @param {import("typeorm").QueryRunner} [queryRunner] - Optional query runner for transaction
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function createDeduction(deductionData, queryRunner) {
  const deductionRepo = queryRunner 
    ? queryRunner.manager.getRepository("Deduction")
    : AppDataSource.getRepository("Deduction");
  
  try {
    // Validate input data
    const validation = validateDeductionData(deductionData);
    if (!validation.isValid) {
      return {
        status: false,
        message: "Validation failed",
        data: { errors: validation.errors }
      };
    }
    
    // Check if payroll record exists
    const payrollRecordRepo = queryRunner 
      ? queryRunner.manager.getRepository("PayrollRecord")
      : AppDataSource.getRepository("PayrollRecord");
    
    const payrollRecord = await payrollRecordRepo.findOne({
      // @ts-ignore
      where: { id: Number(deductionData.payrollRecordId) }
    });
    
    if (!payrollRecord) {
      return {
        status: false,
        // @ts-ignore
        message: `Payroll record with ID ${deductionData.payrollRecordId} not found`,
        data: null
      };
    }
    
    // Check for duplicate deduction if needed
    // @ts-ignore
    if (deductionData.type === 'loan' && deductionData.code) {
      const existingLoan = await deductionRepo.findOne({
        where: {
          // @ts-ignore
          payrollRecordId: Number(deductionData.payrollRecordId),
          type: 'loan',
          // @ts-ignore
          code: deductionData.code
        }
      });
      
      if (existingLoan) {
        return {
          status: false,
          // @ts-ignore
          message: `Loan deduction with code ${deductionData.code} already exists for this payroll record`,
          data: null
        };
      }
    }
    
    // Prepare deduction entity
    const deduction = {
      // @ts-ignore
      payrollRecordId: Number(deductionData.payrollRecordId),
      // @ts-ignore
      type: deductionData.type.trim(),
      // @ts-ignore
      code: deductionData.code ? deductionData.code.trim() : null,
      // @ts-ignore
      description: deductionData.description ? deductionData.description.trim() : null,
      // @ts-ignore
      amount: parseFloat(deductionData.amount),
      // @ts-ignore
      percentage: deductionData.percentage ? parseFloat(deductionData.percentage) : null,
      // @ts-ignore
      isRecurring: Boolean(deductionData.isRecurring) || false,
      // @ts-ignore
      appliedDate: deductionData.appliedDate || new Date().toISOString().split('T')[0],
      // @ts-ignore
      note: deductionData.note ? deductionData.note.trim() : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Save deduction
    const savedDeduction = await deductionRepo.save(deduction);
    
    // Update payroll record totals if needed
    if (['tax', 'sss', 'philhealth', 'pagibig'].includes(deduction.type)) {
      await updatePayrollRecordTotals(
        payrollRecord.id, 
        deduction.type, 
        deduction.amount,
        queryRunner
      );
    }
    
    // Log the creation
    logger.info(`Deduction created: ID ${savedDeduction.id}, Type: ${savedDeduction.type}, Amount: ${savedDeduction.amount}`);
    
    return {
      status: true,
      message: "Deduction created successfully",
      data: {
        id: savedDeduction.id,
        ...savedDeduction
      }
    };
    
  } catch (error) {
    // @ts-ignore
    logger.error("Error in createDeduction:", error);
    
    // Handle specific database errors
    let errorMessage = "Failed to create deduction";
    // @ts-ignore
    if (error.code === 'SQLITE_CONSTRAINT') {
      // @ts-ignore
      if (error.message.includes('FOREIGN KEY')) {
        errorMessage = "Invalid payroll record reference";
      // @ts-ignore
      } else if (error.message.includes('UNIQUE')) {
        errorMessage = "Duplicate deduction detected";
      }
    }
    
    return {
      status: false,
      message: errorMessage,
      data: null
    };
  }
};

/**
 * Update payroll record totals
 * @param {number} payrollRecordId
 * @param {string} deductionType
 * @param {number} amount
 * @param {import("typeorm").QueryRunner} [queryRunner]
 */
async function updatePayrollRecordTotals(payrollRecordId, deductionType, amount, queryRunner) {
  const payrollRecordRepo = queryRunner 
    ? queryRunner.manager.getRepository("PayrollRecord")
    : AppDataSource.getRepository("PayrollRecord");
  
  try {
    const payrollRecord = await payrollRecordRepo.findOne({
      where: { id: payrollRecordId }
    });
    
    if (!payrollRecord) return;
    
    // Update specific deduction field based on type
    const updateFields = {};
    switch (deductionType) {
      case 'sss':
        // @ts-ignore
        updateFields.sssDeduction = (parseFloat(payrollRecord.sssDeduction) || 0) + amount;
        break;
      case 'philhealth':
        // @ts-ignore
        updateFields.philhealthDeduction = (parseFloat(payrollRecord.philhealthDeduction) || 0) + amount;
        break;
      case 'pagibig':
        // @ts-ignore
        updateFields.pagibigDeduction = (parseFloat(payrollRecord.pagibigDeduction) || 0) + amount;
        break;
      case 'tax':
        // @ts-ignore
        updateFields.taxDeduction = (parseFloat(payrollRecord.taxDeduction) || 0) + amount;
        break;
      case 'loan':
        // @ts-ignore
        updateFields.loanDeduction = (parseFloat(payrollRecord.loanDeduction) || 0) + amount;
        break;
      case 'advance':
        // @ts-ignore
        updateFields.advanceDeduction = (parseFloat(payrollRecord.advanceDeduction) || 0) + amount;
        break;
      default:
        // @ts-ignore
        updateFields.otherDeductions = (parseFloat(payrollRecord.otherDeductions) || 0) + amount;
    }
    
    // Recalculate total deductions
    const totalDeductions = 
      (parseFloat(payrollRecord.sssDeduction) || 0) +
      (parseFloat(payrollRecord.philhealthDeduction) || 0) +
      (parseFloat(payrollRecord.pagibigDeduction) || 0) +
      (parseFloat(payrollRecord.taxDeduction) || 0) +
      (parseFloat(payrollRecord.loanDeduction) || 0) +
      (parseFloat(payrollRecord.advanceDeduction) || 0) +
      (parseFloat(payrollRecord.otherDeductions) || 0);
    
    updateFields.deductionsTotal = totalDeductions;
    updateFields.netPay = (parseFloat(payrollRecord.grossPay) || 0) - totalDeductions;
    
    await payrollRecordRepo.update(payrollRecordId, updateFields);
    
  } catch (error) {
    // @ts-ignore
    logger.error(`Error updating payroll record totals for ID ${payrollRecordId}:`, error);
  }
}
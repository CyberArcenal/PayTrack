// ===================== src/ipc/handlers/deduction/get/by_id.ipc.js =====================
// @ts-check
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get deduction by ID
 * @param {string|number} deductionId - Deduction ID
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getDeductionById(deductionId) {
  try {
    // Validate input
    if (!deductionId) {
      return {
        status: false,
        message: "Deduction ID is required",
        data: null
      };
    }
    
    // @ts-ignore
    const id = parseInt(deductionId);
    if (isNaN(id) || id <= 0) {
      return {
        status: false,
        message: "Invalid deduction ID format",
        data: null
      };
    }
    
    const deductionRepo = AppDataSource.getRepository("Deduction");
    
    const deduction = await deductionRepo.findOne({
      where: { id },
      relations: [
        "payrollRecord",
        "payrollRecord.employee",
        "payrollRecord.period"
      ]
    });
    
    if (!deduction) {
      return {
        status: false,
        message: `Deduction with ID ${id} not found`,
        data: null
      };
    }
    
    // Sanitize and format response data
    const responseData = {
      id: deduction.id,
      payrollRecordId: deduction.payrollRecordId,
      type: deduction.type,
      code: deduction.code,
      description: deduction.description,
      amount: parseFloat(deduction.amount) || 0,
      percentage: deduction.percentage ? parseFloat(deduction.percentage) : null,
      isRecurring: Boolean(deduction.isRecurring),
      appliedDate: deduction.appliedDate,
      note: deduction.note,
      createdAt: deduction.createdAt,
      updatedAt: deduction.updatedAt,
      payrollRecord: deduction.payrollRecord ? {
        id: deduction.payrollRecord.id,
        periodId: deduction.payrollRecord.periodId,
        grossPay: deduction.payrollRecord.grossPay,
        netPay: deduction.payrollRecord.netPay,
        paymentStatus: deduction.payrollRecord.paymentStatus
      } : null,
      employee: deduction.payrollRecord?.employee ? {
        id: deduction.payrollRecord.employee.id,
        employeeNumber: deduction.payrollRecord.employee.employeeNumber,
        firstName: deduction.payrollRecord.employee.firstName,
        lastName: deduction.payrollRecord.employee.lastName,
        department: deduction.payrollRecord.employee.department
      } : null,
      period: deduction.payrollRecord?.period ? {
        id: deduction.payrollRecord.period.id,
        name: deduction.payrollRecord.period.name,
        startDate: deduction.payrollRecord.period.startDate,
        endDate: deduction.payrollRecord.period.endDate,
        payDate: deduction.payrollRecord.period.payDate
      } : null
    };
    
    return {
      status: true,
      message: "Deduction retrieved successfully",
      data: responseData
    };
    
  } catch (error) {
    // @ts-ignore
    logger.error(`Error in getDeductionById for ID ${deductionId}:`, error);
    
    return {
      status: false,
      // @ts-ignore
      message: error.code === 'SQLITE_CONSTRAINT' 
        ? "Database constraint violation"
        // @ts-ignore
        : error.message || "Failed to retrieve deduction",
      data: null
    };
  }
};
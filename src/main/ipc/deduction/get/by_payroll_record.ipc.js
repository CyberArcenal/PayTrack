// ===================== src/ipc/handlers/deduction/get/by_payroll_record.ipc.js =====================
// @ts-check
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get deductions by payroll record
 * @param {string|number} payrollRecordId - Payroll record ID
 * @param {Object} [filters] - Optional filters
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getDeductionsByPayrollRecord(payrollRecordId, filters = {}) {
  try {
    // Validate input
    if (!payrollRecordId) {
      return {
        status: false,
        message: "Payroll record ID is required",
        data: null
      };
    }
    
    // @ts-ignore
    const recordId = parseInt(payrollRecordId);
    if (isNaN(recordId) || recordId <= 0) {
      return {
        status: false,
        message: "Invalid payroll record ID",
        data: null
      };
    }
    
    const deductionRepo = AppDataSource.getRepository("Deduction");
    const payrollRecordRepo = AppDataSource.getRepository("PayrollRecord");
    
    // Verify payroll record exists
    const payrollRecord = await payrollRecordRepo.findOne({
      where: { id: recordId }
    });
    
    if (!payrollRecord) {
      return {
        status: false,
        message: `Payroll record with ID ${recordId} not found`,
        data: null
      };
    }
    
    // Build query
    const queryBuilder = deductionRepo.createQueryBuilder("deduction")
      .where("deduction.payrollRecordId = :recordId", { recordId })
      .orderBy("deduction.type", "ASC")
      .addOrderBy("deduction.createdAt", "DESC");
    
    // Apply optional filters
    // @ts-ignore
    if (filters.type && typeof filters.type === 'string') {
      // @ts-ignore
      queryBuilder.andWhere("deduction.type = :type", { type: filters.type });
    }
    
    // @ts-ignore
    if (typeof filters.isRecurring === 'boolean') {
      queryBuilder.andWhere("deduction.isRecurring = :isRecurring", {
        // @ts-ignore
        isRecurring: filters.isRecurring
      });
    }
    
    // @ts-ignore
    if (filters.startDate) {
      queryBuilder.andWhere("deduction.appliedDate >= :startDate", {
        // @ts-ignore
        startDate: filters.startDate
      });
    }
    
    // @ts-ignore
    if (filters.endDate) {
      queryBuilder.andWhere("deduction.appliedDate <= :endDate", {
        // @ts-ignore
        endDate: filters.endDate
      });
    }
    
    // Execute query
    const deductions = await queryBuilder.getMany();
    
    // Calculate totals
    const totals = deductions.reduce((acc, deduction) => {
      const amount = parseFloat(deduction.amount) || 0;
      acc.totalAmount += amount;
      
      // Group by type
      if (!acc.byType[deduction.type]) {
        acc.byType[deduction.type] = 0;
      }
      acc.byType[deduction.type] += amount;
      
      // Count recurring
      if (deduction.isRecurring) {
        acc.recurringCount++;
        acc.recurringAmount += amount;
      }
      
      return acc;
    }, {
      totalAmount: 0,
      byType: {},
      recurringCount: 0,
      recurringAmount: 0
    });
    
    // Format response
    const formattedDeductions = deductions.map(deduction => ({
      id: deduction.id,
      type: deduction.type,
      code: deduction.code,
      description: deduction.description,
      amount: parseFloat(deduction.amount) || 0,
      percentage: deduction.percentage ? parseFloat(deduction.percentage) : null,
      isRecurring: Boolean(deduction.isRecurring),
      appliedDate: deduction.appliedDate,
      note: deduction.note,
      createdAt: deduction.createdAt,
      updatedAt: deduction.updatedAt
    }));
    
    return {
      status: true,
      message: `Found ${deductions.length} deductions for payroll record ${recordId}`,
      data: {
        deductions: formattedDeductions,
        totals,
        meta: {
          payrollRecordId: recordId,
          count: deductions.length,
          types: Object.keys(totals.byType),
          hasRecurring: totals.recurringCount > 0
        }
      }
    };
    
  } catch (error) {
    // @ts-ignore
    logger.error(`Error in getDeductionsByPayrollRecord for ID ${payrollRecordId}:`, error);
    
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to retrieve deductions for payroll record",
      data: null
    };
  }
};
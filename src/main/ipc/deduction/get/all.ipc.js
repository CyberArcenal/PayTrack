// ===================== src/ipc/handlers/deduction/get/all.ipc.js =====================
// @ts-check
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get all deductions with optional filters
 * @param {Object} params
 * @param {Object} [params.filters] - Optional filters
 * @param {number} [params.filters.page] - Page number (1-based)
 * @param {number} [params.filters.limit] - Items per page
 * @param {string} [params.filters.type] - Filter by deduction type
 * @param {number} [params.filters.payrollRecordId] - Filter by payroll record
 * @param {boolean} [params.filters.isRecurring] - Filter recurring deductions
 * @param {string} [params.filters.startDate] - Start date filter (YYYY-MM-DD)
 * @param {string} [params.filters.endDate] - End date filter (YYYY-MM-DD)
 * @param {string} [params.filters.sortBy] - Sort field
 * @param {'ASC'|'DESC'} [params.filters.sortOrder] - Sort order
 * @returns {Promise<{status: boolean, message: string, data: any, meta?: any}>}
 */
module.exports = async function getAllDeductions(params = {}) {
  const { filters = {} } = params;
  
  try {
    const deductionRepo = AppDataSource.getRepository("Deduction");
    
    // Build query with type-safe filters
    const queryBuilder = deductionRepo.createQueryBuilder("deduction")
      .leftJoinAndSelect("deduction.payrollRecord", "payrollRecord")
      .leftJoinAndSelect("payrollRecord.employee", "employee");
    
    // Apply filters if provided
    if (filters.type && typeof filters.type === 'string') {
      queryBuilder.andWhere("deduction.type = :type", { type: filters.type });
    }
    
    if (filters.payrollRecordId && !isNaN(Number(filters.payrollRecordId))) {
      queryBuilder.andWhere("deduction.payrollRecordId = :payrollRecordId", {
        payrollRecordId: Number(filters.payrollRecordId)
      });
    }
    
    if (typeof filters.isRecurring === 'boolean') {
      queryBuilder.andWhere("deduction.isRecurring = :isRecurring", {
        isRecurring: filters.isRecurring
      });
    }
    
    if (filters.startDate) {
      queryBuilder.andWhere("deduction.appliedDate >= :startDate", {
        startDate: filters.startDate
      });
    }
    
    if (filters.endDate) {
      queryBuilder.andWhere("deduction.appliedDate <= :endDate", {
        endDate: filters.endDate
      });
    }
    
    // Apply sorting
    const sortBy = filters.sortBy || "deduction.createdAt";
    const sortOrder = (filters.sortOrder === 'ASC' || filters.sortOrder === 'DESC') 
      ? filters.sortOrder 
      : "DESC";
    
    queryBuilder.orderBy(sortBy, sortOrder);
    
    // Pagination
    // @ts-ignore
    const page = Math.max(1, parseInt(filters.page) || 1);
    // @ts-ignore
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit) || 20));
    const skip = (page - 1) * limit;
    
    queryBuilder.skip(skip).take(limit);
    
    // Execute query
    const [deductions, total] = await queryBuilder.getManyAndCount();
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    
    // Sanitize data for response (remove sensitive info if needed)
    const sanitizedDeductions = deductions.map(deduction => ({
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
      updatedAt: deduction.updatedAt,
      payrollRecord: deduction.payrollRecord ? {
        id: deduction.payrollRecord.id,
        employeeId: deduction.payrollRecord.employeeId,
        periodId: deduction.payrollRecord.periodId,
        grossPay: deduction.payrollRecord.grossPay,
        netPay: deduction.payrollRecord.netPay
      } : null,
      employee: deduction.payrollRecord?.employee ? {
        id: deduction.payrollRecord.employee.id,
        employeeNumber: deduction.payrollRecord.employee.employeeNumber,
        firstName: deduction.payrollRecord.employee.firstName,
        lastName: deduction.payrollRecord.employee.lastName
      } : null
    }));
    
    return {
      status: true,
      message: "Deductions retrieved successfully",
      data: sanitizedDeductions,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
    
  } catch (error) {
    // @ts-ignore
    logger.error("Error in getAllDeductions:", error);
    
    // Return appropriate error response
    return {
      status: false,
      // @ts-ignore
      message: error.code === 'SQLITE_ERROR' 
        ? "Database error while retrieving deductions"
        // @ts-ignore
        : error.message || "Failed to retrieve deductions",
      data: null,
      meta: null
    };
  }
};
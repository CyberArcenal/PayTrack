// ===================== src/ipc/handlers/deduction/get/by_type.ipc.js =====================
// @ts-check
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get deductions by type
 * @param {string} type - Deduction type
 * @param {Object} [filters] - Optional filters
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getDeductionsByType(type, filters = {}) {
  try {
    // Validate input
    if (!type || typeof type !== 'string' || type.trim() === '') {
      return {
        status: false,
        message: "Valid deduction type is required",
        data: null
      };
    }
    
    const deductionType = type.trim();
    const deductionRepo = AppDataSource.getRepository("Deduction");
    
    // Build query
    const queryBuilder = deductionRepo.createQueryBuilder("deduction")
      .where("deduction.type = :type", { type: deductionType })
      .leftJoinAndSelect("deduction.payrollRecord", "payrollRecord")
      .leftJoinAndSelect("payrollRecord.employee", "employee")
      .leftJoinAndSelect("payrollRecord.period", "period")
      .orderBy("deduction.appliedDate", "DESC")
      .addOrderBy("deduction.createdAt", "DESC");
    
    // Apply additional filters
    // @ts-ignore
    if (filters.employeeId && !isNaN(Number(filters.employeeId))) {
      queryBuilder.andWhere("payrollRecord.employeeId = :employeeId", {
        // @ts-ignore
        employeeId: Number(filters.employeeId)
      });
    }
    
    // @ts-ignore
    if (filters.payrollRecordId && !isNaN(Number(filters.payrollRecordId))) {
      queryBuilder.andWhere("deduction.payrollRecordId = :payrollRecordId", {
        // @ts-ignore
        payrollRecordId: Number(filters.payrollRecordId)
      });
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
    
    // Pagination
    // @ts-ignore
    const page = Math.max(1, parseInt(filters.page) || 1);
    // @ts-ignore
    const limit = Math.min(100, Math.max(1, parseInt(filters.limit) || 50));
    const skip = (page - 1) * limit;
    
    queryBuilder.skip(skip).take(limit);
    
    // Execute query
    const [deductions, total] = await queryBuilder.getManyAndCount();
    
    // Calculate statistics
    let totalAmount = 0;
    let recurringCount = 0;
    let recurringAmount = 0;
    const employees = new Set();
    const periods = new Set();
    
    deductions.forEach(deduction => {
      const amount = parseFloat(deduction.amount) || 0;
      totalAmount += amount;
      
      if (deduction.isRecurring) {
        recurringCount++;
        recurringAmount += amount;
      }
      
      if (deduction.payrollRecord?.employeeId) {
        employees.add(deduction.payrollRecord.employeeId);
      }
      
      if (deduction.payrollRecord?.periodId) {
        periods.add(deduction.payrollRecord.periodId);
      }
    });
    
    // Format response
    const formattedDeductions = deductions.map(deduction => ({
      id: deduction.id,
      payrollRecordId: deduction.payrollRecordId,
      code: deduction.code,
      description: deduction.description,
      amount: parseFloat(deduction.amount) || 0,
      percentage: deduction.percentage ? parseFloat(deduction.percentage) : null,
      isRecurring: Boolean(deduction.isRecurring),
      appliedDate: deduction.appliedDate,
      note: deduction.note,
      createdAt: deduction.createdAt,
      payrollRecord: deduction.payrollRecord ? {
        id: deduction.payrollRecord.id,
        periodId: deduction.payrollRecord.periodId,
        grossPay: deduction.payrollRecord.grossPay,
        netPay: deduction.payrollRecord.netPay
      } : null,
      employee: deduction.payrollRecord?.employee ? {
        id: deduction.payrollRecord.employee.id,
        employeeNumber: deduction.payrollRecord.employee.employeeNumber,
        firstName: deduction.payrollRecord.employee.firstName,
        lastName: deduction.payrollRecord.employee.lastName
      } : null,
      period: deduction.payrollRecord?.period ? {
        id: deduction.payrollRecord.period.id,
        name: deduction.payrollRecord.period.name,
        startDate: deduction.payrollRecord.period.startDate,
        endDate: deduction.payrollRecord.period.endDate
      } : null
    }));
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      status: true,
      message: `Found ${deductions.length} deductions of type '${deductionType}'`,
      data: {
        deductions: formattedDeductions,
        statistics: {
          type: deductionType,
          totalCount: total,
          totalAmount,
          averageAmount: total > 0 ? totalAmount / total : 0,
          recurringCount,
          recurringAmount,
          uniqueEmployees: employees.size,
          uniquePeriods: periods.size
        },
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          filters: {
            type: deductionType,
            ...filters
          }
        }
      }
    };
    
  } catch (error) {
    // @ts-ignore
    logger.error(`Error in getDeductionsByType for type '${type}':`, error);
    
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to retrieve deductions by type",
      data: null
    };
  }
};
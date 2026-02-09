// ===================== src/ipc/handlers/deduction/get/by_date_range.ipc.js =====================
// @ts-check
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get deductions by date range
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {Object} [filters] - Optional filters
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getDeductionsByDateRange(startDate, endDate, filters = {}) {
  try {
    // Validate dates
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    
    if (!startDate || !dateRegex.test(startDate)) {
      return {
        status: false,
        message: "Valid start date is required (YYYY-MM-DD)",
        data: null
      };
    }
    
    if (!endDate || !dateRegex.test(endDate)) {
      return {
        status: false,
        message: "Valid end date is required (YYYY-MM-DD)",
        data: null
      };
    }
    
    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        status: false,
        message: "Invalid date values",
        data: null
      };
    }
    
    if (start > end) {
      return {
        status: false,
        message: "Start date cannot be after end date",
        data: null
      };
    }
    
    // Limit date range to prevent excessive queries
    const maxDays = 365; // 1 year max
    // @ts-ignore
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    if (diffDays > maxDays) {
      return {
        status: false,
        message: `Date range cannot exceed ${maxDays} days`,
        data: null
      };
    }
    
    const deductionRepo = AppDataSource.getRepository("Deduction");
    
    // Build query
    const queryBuilder = deductionRepo.createQueryBuilder("deduction")
      .where("deduction.appliedDate BETWEEN :startDate AND :endDate", {
        startDate,
        endDate
      })
      .leftJoinAndSelect("deduction.payrollRecord", "payrollRecord")
      .leftJoinAndSelect("payrollRecord.employee", "employee")
      .leftJoinAndSelect("payrollRecord.period", "period")
      .orderBy("deduction.appliedDate", "DESC")
      .addOrderBy("deduction.type", "ASC");
    
    // Apply additional filters
    // @ts-ignore
    if (filters.type && typeof filters.type === 'string') {
      // @ts-ignore
      queryBuilder.andWhere("deduction.type = :type", { type: filters.type });
    }
    
    // @ts-ignore
    if (filters.employeeId && !isNaN(Number(filters.employeeId))) {
      queryBuilder.andWhere("payrollRecord.employeeId = :employeeId", {
        // @ts-ignore
        employeeId: Number(filters.employeeId)
      });
    }
    
    // @ts-ignore
    if (filters.department && typeof filters.department === 'string') {
      queryBuilder.andWhere("employee.department = :department", {
        // @ts-ignore
        department: filters.department
      });
    }
    
    // @ts-ignore
    if (typeof filters.isRecurring === 'boolean') {
      queryBuilder.andWhere("deduction.isRecurring = :isRecurring", {
        // @ts-ignore
        isRecurring: filters.isRecurring
      });
    }
    
    // Pagination for large result sets
    // @ts-ignore
    const page = Math.max(1, parseInt(filters.page) || 1);
    // @ts-ignore
    const limit = Math.min(500, Math.max(1, parseInt(filters.limit) || 100));
    const skip = (page - 1) * limit;
    
    queryBuilder.skip(skip).take(limit);
    
    // Execute query
    const [deductions, total] = await queryBuilder.getManyAndCount();
    
    // Calculate detailed statistics
    let totalAmount = 0;
    let recurringAmount = 0;
    const typeSummary = {};
    const dailySummary = {};
    const employeeSummary = {};
    
    deductions.forEach(deduction => {
      const amount = parseFloat(deduction.amount) || 0;
      totalAmount += amount;
      
      if (deduction.isRecurring) {
        recurringAmount += amount;
      }
      
      // Group by type
      // @ts-ignore
      if (!typeSummary[deduction.type]) {
        // @ts-ignore
        typeSummary[deduction.type] = {
          type: deduction.type,
          count: 0,
          totalAmount: 0
        };
      }
      // @ts-ignore
      typeSummary[deduction.type].count++;
      // @ts-ignore
      typeSummary[deduction.type].totalAmount += amount;
      
      // Group by date
      const date = deduction.appliedDate;
      // @ts-ignore
      if (!dailySummary[date]) {
        // @ts-ignore
        dailySummary[date] = {
          date,
          count: 0,
          totalAmount: 0,
          types: new Set()
        };
      }
      // @ts-ignore
      dailySummary[date].count++;
      // @ts-ignore
      dailySummary[date].totalAmount += amount;
      // @ts-ignore
      dailySummary[date].types.add(deduction.type);
      
      // Group by employee
      const employeeId = deduction.payrollRecord?.employee?.id;
      if (employeeId) {
        const empName = `${deduction.payrollRecord.employee.firstName} ${deduction.payrollRecord.employee.lastName}`;
        // @ts-ignore
        if (!employeeSummary[employeeId]) {
          // @ts-ignore
          employeeSummary[employeeId] = {
            employeeId,
            employeeName: empName,
            department: deduction.payrollRecord.employee.department,
            count: 0,
            totalAmount: 0
          };
        }
        // @ts-ignore
        employeeSummary[employeeId].count++;
        // @ts-ignore
        employeeSummary[employeeId].totalAmount += amount;
      }
    });
    
    // Convert Sets to Arrays for daily summary
    Object.keys(dailySummary).forEach(date => {
      // @ts-ignore
      dailySummary[date].types = Array.from(dailySummary[date].types);
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
      payrollRecordId: deduction.payrollRecordId,
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
        endDate: deduction.payrollRecord.period.endDate
      } : null,
      createdAt: deduction.createdAt
    }));
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      status: true,
      message: `Found ${deductions.length} deductions between ${startDate} and ${endDate}`,
      data: {
        dateRange: {
          startDate,
          endDate,
          days: diffDays + 1
        },
        deductions: formattedDeductions,
        statistics: {
          totalDeductions: total,
          totalAmount,
          averageAmount: total > 0 ? totalAmount / total : 0,
          averageDailyAmount: diffDays > 0 ? totalAmount / (diffDays + 1) : 0,
          recurringAmount,
          typeSummary: Object.values(typeSummary),
          dailySummary: Object.values(dailySummary),
          employeeSummary: Object.values(employeeSummary)
        },
        meta: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          dateRange: `${startDate} to ${endDate}`,
          uniqueTypes: Object.keys(typeSummary).length,
          uniqueEmployees: Object.keys(employeeSummary).length,
          uniqueDays: Object.keys(dailySummary).length
        }
      }
    };
    
  } catch (error) {
    // @ts-ignore
    logger.error(`Error in getDeductionsByDateRange for ${startDate} to ${endDate}:`, error);
    
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to retrieve deductions by date range",
      data: null
    };
  }
};
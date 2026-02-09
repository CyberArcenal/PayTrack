// ===================== src/ipc/handlers/deduction/get/by_date.ipc.js =====================
// @ts-check
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get deductions by specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {Object} [filters] - Optional filters
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getDeductionsByDate(date, filters = {}) {
  try {
    // Validate date
    if (!date || typeof date !== 'string') {
      return {
        status: false,
        message: "Date is required (YYYY-MM-DD format)",
        data: null
      };
    }
    
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return {
        status: false,
        message: "Invalid date format. Use YYYY-MM-DD",
        data: null
      };
    }
    
    // Validate date is a valid calendar date
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return {
        status: false,
        message: "Invalid date value",
        data: null
      };
    }
    
    const deductionRepo = AppDataSource.getRepository("Deduction");
    
    // Build query
    const queryBuilder = deductionRepo.createQueryBuilder("deduction")
      .where("DATE(deduction.appliedDate) = DATE(:date)", { date })
      .leftJoinAndSelect("deduction.payrollRecord", "payrollRecord")
      .leftJoinAndSelect("payrollRecord.employee", "employee")
      .leftJoinAndSelect("payrollRecord.period", "period")
      .orderBy("deduction.type", "ASC")
      .addOrderBy("employee.lastName", "ASC");
    
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
    
    // Execute query
    const deductions = await queryBuilder.getMany();
    
    // Calculate statistics
    let totalAmount = 0;
    const typeSummary = {};
    const departmentSummary = {};
    
    deductions.forEach(deduction => {
      const amount = parseFloat(deduction.amount) || 0;
      totalAmount += amount;
      
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
      
      // Group by department
      const department = deduction.payrollRecord?.employee?.department || 'Unknown';
      // @ts-ignore
      if (!departmentSummary[department]) {
        // @ts-ignore
        departmentSummary[department] = {
          department,
          count: 0,
          totalAmount: 0
        };
      }
      // @ts-ignore
      departmentSummary[department].count++;
      // @ts-ignore
      departmentSummary[department].totalAmount += amount;
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
        name: deduction.payrollRecord.period.name
      } : null,
      createdAt: deduction.createdAt
    }));
    
    return {
      status: true,
      message: `Found ${deductions.length} deductions applied on ${date}`,
      data: {
        date,
        deductions: formattedDeductions,
        summary: {
          totalDeductions: deductions.length,
          totalAmount,
          typeSummary: Object.values(typeSummary),
          departmentSummary: Object.values(departmentSummary),
          averageAmount: deductions.length > 0 ? totalAmount / deductions.length : 0
        },
        meta: {
          date,
          count: deductions.length,
          uniqueTypes: Object.keys(typeSummary).length,
          uniqueDepartments: Object.keys(departmentSummary).length
        }
      }
    };
    
  } catch (error) {
    // @ts-ignore
    logger.error(`Error in getDeductionsByDate for date '${date}':`, error);
    
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to retrieve deductions by date",
      data: null
    };
  }
};
// ===================== src/ipc/handlers/deduction/get/by_employee.ipc.js =====================
// @ts-check
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get deductions by employee
 * @param {string|number} employeeId - Employee ID
 * @param {Object} [dateRange] - Optional date range filter
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getDeductionsByEmployee(employeeId, dateRange = {}) {
  try {
    // Validate input
    if (!employeeId) {
      return {
        status: false,
        message: "Employee ID is required",
        data: null
      };
    }
    
    // @ts-ignore
    const empId = parseInt(employeeId);
    if (isNaN(empId) || empId <= 0) {
      return {
        status: false,
        message: "Invalid employee ID",
        data: null
      };
    }
    
    const deductionRepo = AppDataSource.getRepository("Deduction");
    const employeeRepo = AppDataSource.getRepository("Employee");
    
    // Verify employee exists
    const employee = await employeeRepo.findOne({
      where: { id: empId }
    });
    
    if (!employee) {
      return {
        status: false,
        message: `Employee with ID ${empId} not found`,
        data: null
      };
    }
    
    // Build query to get deductions via payroll records
    const queryBuilder = deductionRepo.createQueryBuilder("deduction")
      .innerJoin("deduction.payrollRecord", "payrollRecord")
      .innerJoin("payrollRecord.employee", "employee")
      .where("employee.id = :empId", { empId })
      .leftJoinAndSelect("payrollRecord.period", "period")
      .orderBy("period.startDate", "DESC")
      .addOrderBy("deduction.type", "ASC");
    
    // Apply date range filters
    // @ts-ignore
    if (dateRange.startDate) {
      queryBuilder.andWhere("deduction.appliedDate >= :startDate", {
        // @ts-ignore
        startDate: dateRange.startDate
      });
    }
    
    // @ts-ignore
    if (dateRange.endDate) {
      queryBuilder.andWhere("deduction.appliedDate <= :endDate", {
        // @ts-ignore
        endDate: dateRange.endDate
      });
    }
    
    // @ts-ignore
    if (dateRange.periodId) {
      // @ts-ignore
      const periodId = parseInt(dateRange.periodId);
      if (!isNaN(periodId)) {
        queryBuilder.andWhere("payrollRecord.periodId = :periodId", { periodId });
      }
    }
    
    // Optional type filter
    // @ts-ignore
    if (dateRange.type) {
      // @ts-ignore
      queryBuilder.andWhere("deduction.type = :type", { type: dateRange.type });
    }
    
    // Execute query
    const deductions = await queryBuilder.getMany();
    
    // Group deductions by period for better organization
    const deductionsByPeriod = {};
    const deductionsByType = {};
    let totalAmount = 0;
    
    deductions.forEach(deduction => {
      const amount = parseFloat(deduction.amount) || 0;
      totalAmount += amount;
      
      // Get period info from relations
      const periodId = deduction.payrollRecord?.period?.id;
      if (periodId) {
        // @ts-ignore
        if (!deductionsByPeriod[periodId]) {
          // @ts-ignore
          deductionsByPeriod[periodId] = {
            periodId,
            periodName: deduction.payrollRecord.period.name,
            startDate: deduction.payrollRecord.period.startDate,
            endDate: deduction.payrollRecord.period.endDate,
            deductions: [],
            totalAmount: 0
          };
        }
        // @ts-ignore
        deductionsByPeriod[periodId].deductions.push(deduction);
        // @ts-ignore
        deductionsByPeriod[periodId].totalAmount += amount;
      }
      
      // Group by type
      // @ts-ignore
      if (!deductionsByType[deduction.type]) {
        // @ts-ignore
        deductionsByType[deduction.type] = {
          type: deduction.type,
          count: 0,
          totalAmount: 0,
          isRecurring: false
        };
      }
      // @ts-ignore
      deductionsByType[deduction.type].count++;
      // @ts-ignore
      deductionsByType[deduction.type].totalAmount += amount;
      if (deduction.isRecurring) {
        // @ts-ignore
        deductionsByType[deduction.type].isRecurring = true;
      }
    });
    
    // Format response data
    const responseData = {
      employee: {
        id: employee.id,
        employeeNumber: employee.employeeNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        department: employee.department
      },
      deductions: deductions.map(d => ({
        id: d.id,
        type: d.type,
        code: d.code,
        description: d.description,
        amount: parseFloat(d.amount) || 0,
        percentage: d.percentage ? parseFloat(d.percentage) : null,
        isRecurring: Boolean(d.isRecurring),
        appliedDate: d.appliedDate,
        payrollRecordId: d.payrollRecordId,
        period: d.payrollRecord?.period ? {
          id: d.payrollRecord.period.id,
          name: d.payrollRecord.period.name,
          startDate: d.payrollRecord.period.startDate,
          endDate: d.payrollRecord.period.endDate
        } : null,
        createdAt: d.createdAt
      })),
      summary: {
        totalDeductions: deductions.length,
        totalAmount,
        deductionsByPeriod: Object.values(deductionsByPeriod),
        deductionsByType: Object.values(deductionsByType),
        // @ts-ignore
        dateRange: dateRange.startDate && dateRange.endDate 
          // @ts-ignore
          ? `${dateRange.startDate} to ${dateRange.endDate}`
          : 'All time'
      }
    };
    
    return {
      status: true,
      message: `Found ${deductions.length} deductions for employee ${employee.firstName} ${employee.lastName}`,
      data: responseData
    };
    
  } catch (error) {
    // @ts-ignore
    logger.error(`Error in getDeductionsByEmployee for ID ${employeeId}:`, error);
    
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to retrieve employee deductions",
      data: null
    };
  }
};
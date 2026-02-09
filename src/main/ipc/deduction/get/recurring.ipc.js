// ===================== src/ipc/handlers/deduction/get/recurring.ipc.js =====================
// @ts-nocheck
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get recurring deductions
 * @param {string|number} [employeeId] - Optional employee ID filter
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getRecurringDeductions(employeeId) {
  try {
    const deductionRepo = AppDataSource.getRepository("Deduction");
    const employeeRepo = AppDataSource.getRepository("Employee");
    
    // Build query for recurring deductions
    const queryBuilder = deductionRepo.createQueryBuilder("deduction")
      .where("deduction.isRecurring = :isRecurring", { isRecurring: true })
      .leftJoinAndSelect("deduction.payrollRecord", "payrollRecord")
      .leftJoinAndSelect("payrollRecord.employee", "employee")
      .leftJoinAndSelect("payrollRecord.period", "period")
      .orderBy("employee.lastName", "ASC")
      .addOrderBy("deduction.type", "ASC");
    
    // Filter by employee if specified
    if (employeeId) {
      const empId = parseInt(employeeId);
      if (!isNaN(empId) && empId > 0) {
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
        
        queryBuilder.andWhere("payrollRecord.employeeId = :employeeId", {
          employeeId: empId
        });
      }
    }
    
    // Execute query
    const deductions = await queryBuilder.getMany();
    
    // Group recurring deductions by employee
    const recurringByEmployee = {};
    const recurringByType = {};
    let totalMonthlyAmount = 0;
    let totalYearlyAmount = 0;
    
    deductions.forEach(deduction => {
      const amount = parseFloat(deduction.amount) || 0;
      const employee = deduction.payrollRecord?.employee;
      
      if (!employee) return;
      
      const employeeId = employee.id;
      const employeeKey = `${employee.lastName}, ${employee.firstName}`;
      
      // Group by employee
      if (!recurringByEmployee[employeeId]) {
        recurringByEmployee[employeeId] = {
          employeeId,
          employeeName: employeeKey,
          employeeNumber: employee.employeeNumber,
          department: employee.department,
          deductions: [],
          totalAmount: 0,
          deductionCount: 0
        };
      }
      
      recurringByEmployee[employeeId].deductions.push({
        id: deduction.id,
        type: deduction.type,
        code: deduction.code,
        description: deduction.description,
        amount,
        percentage: deduction.percentage ? parseFloat(deduction.percentage) : null,
        appliedDate: deduction.appliedDate,
        createdAt: deduction.createdAt
      });
      
      recurringByEmployee[employeeId].totalAmount += amount;
      recurringByEmployee[employeeId].deductionCount++;
      
      // Group by type
      if (!recurringByType[deduction.type]) {
        recurringByType[deduction.type] = {
          type: deduction.type,
          count: 0,
          totalAmount: 0,
          affectedEmployees: new Set()
        };
      }
      
      recurringByType[deduction.type].count++;
      recurringByType[deduction.type].totalAmount += amount;
      recurringByType[deduction.type].affectedEmployees.add(employeeId);
      
      // Calculate estimated yearly impact (assuming monthly recurrence)
      totalMonthlyAmount += amount;
      totalYearlyAmount += amount * 12;
    });
    
    // Convert Sets to counts
    Object.keys(recurringByType).forEach(type => {
      recurringByType[type].affectedEmployees = recurringByType[type].affectedEmployees.size;
    });
    
    // Format response
    const responseData = {
      recurringDeductions: deductions.map(d => ({
        id: d.id,
        type: d.type,
        code: d.code,
        description: d.description,
        amount: parseFloat(d.amount) || 0,
        percentage: d.percentage ? parseFloat(d.percentage) : null,
        appliedDate: d.appliedDate,
        employee: d.payrollRecord?.employee ? {
          id: d.payrollRecord.employee.id,
          employeeNumber: d.payrollRecord.employee.employeeNumber,
          firstName: d.payrollRecord.employee.firstName,
          lastName: d.payrollRecord.employee.lastName,
          department: d.payrollRecord.employee.department
        } : null,
        payrollRecord: d.payrollRecord ? {
          id: d.payrollRecord.id,
          periodId: d.payrollRecord.periodId,
          period: d.payrollRecord.period ? {
            id: d.payrollRecord.period.id,
            name: d.payrollRecord.period.name,
            startDate: d.payrollRecord.period.startDate
          } : null
        } : null,
        createdAt: d.createdAt
      })),
      summary: {
        totalRecurringDeductions: deductions.length,
        totalAffectedEmployees: Object.keys(recurringByEmployee).length,
        totalMonthlyAmount,
        totalYearlyAmount,
        recurringByEmployee: Object.values(recurringByEmployee),
        recurringByType: Object.values(recurringByType),
        averagePerEmployee: Object.keys(recurringByEmployee).length > 0 
          ? totalMonthlyAmount / Object.keys(recurringByEmployee).length 
          : 0
      },
      meta: {
        filter: employeeId ? `Employee ID: ${employeeId}` : 'All employees',
        count: deductions.length,
        timestamp: new Date().toISOString()
      }
    };
    
    return {
      status: true,
      message: employeeId 
        ? `Found ${deductions.length} recurring deductions for employee ${employeeId}`
        : `Found ${deductions.length} recurring deductions across ${Object.keys(recurringByEmployee).length} employees`,
      data: responseData
    };
    
  } catch (error) {
    logger.error("Error in getRecurringDeductions:", error);
    
    return {
      status: false,
      message: error.message || "Failed to retrieve recurring deductions",
      data: null
    };
  }
};
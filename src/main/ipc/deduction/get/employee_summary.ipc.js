// ===================== src/ipc/handlers/deduction/get/employee_summary.ipc.js =====================
// @ts-nocheck
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get employee deductions summary
 * @param {string|number} employeeId - Employee ID
 * @param {string|number} [periodId] - Optional period ID
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getEmployeeDeductionsSummary(employeeId, periodId) {
  try {
    // Validate employee ID
    if (!employeeId) {
      return {
        status: false,
        message: "Employee ID is required",
        data: null
      };
    }
    
    const empId = parseInt(employeeId);
    if (isNaN(empId) || empId <= 0) {
      return {
        status: false,
        message: "Invalid employee ID",
        data: null
      };
    }
    
    const employeeRepo = AppDataSource.getRepository("Employee");
    const deductionRepo = AppDataSource.getRepository("Deduction");
    const payrollRecordRepo = AppDataSource.getRepository("PayrollRecord");
    
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
    
    // Get payroll records for employee
    const payrollQuery = payrollRecordRepo.createQueryBuilder("payroll")
      .where("payroll.employeeId = :empId", { empId })
      .leftJoinAndSelect("payroll.period", "period")
      .orderBy("period.startDate", "DESC");
    
    if (periodId) {
      const periodIdNum = parseInt(periodId);
      if (!isNaN(periodIdNum)) {
        payrollQuery.andWhere("payroll.periodId = :periodId", { periodId: periodIdNum });
      }
    }
    
    const payrollRecords = await payrollQuery.getMany();
    
    if (payrollRecords.length === 0) {
      return {
        status: true,
        message: "No payroll records found for employee",
        data: {
          employee: {
            id: employee.id,
            employeeNumber: employee.employeeNumber,
            firstName: employee.firstName,
            lastName: employee.lastName,
            department: employee.department
          },
          summary: {
            totalDeductions: 0,
            totalAmount: 0,
            breakdown: {},
            periods: []
          }
        }
      };
    }
    
    // Get all deductions for these payroll records
    const payrollRecordIds = payrollRecords.map(pr => pr.id);
    
    const deductions = await deductionRepo.createQueryBuilder("deduction")
      .where("deduction.payrollRecordId IN (:...ids)", { ids: payrollRecordIds })
      .orderBy("deduction.appliedDate", "DESC")
      .getMany();
    
    // Calculate summary statistics
    const summary = {
      totalDeductions: deductions.length,
      totalAmount: 0,
      breakdown: {},
      byPeriod: {},
      recurring: {
        count: 0,
        amount: 0,
        types: new Set()
      },
      governmentContributions: {
        sss: 0,
        philhealth: 0,
        pagibig: 0,
        tax: 0,
        total: 0
      },
      loansAdvances: {
        count: 0,
        amount: 0,
        activeLoans: 0
      }
    };
    
    // Process each deduction
    deductions.forEach(deduction => {
      const amount = parseFloat(deduction.amount) || 0;
      summary.totalAmount += amount;
      
      // Group by type
      if (!summary.breakdown[deduction.type]) {
        summary.breakdown[deduction.type] = {
          type: deduction.type,
          count: 0,
          amount: 0
        };
      }
      summary.breakdown[deduction.type].count++;
      summary.breakdown[deduction.type].amount += amount;
      
      // Group by period
      const payrollRecord = payrollRecords.find(pr => pr.id === deduction.payrollRecordId);
      if (payrollRecord) {
        const periodKey = payrollRecord.periodId;
        if (!summary.byPeriod[periodKey]) {
          summary.byPeriod[periodKey] = {
            periodId: payrollRecord.periodId,
            periodName: payrollRecord.period?.name || `Period ${payrollRecord.periodId}`,
            startDate: payrollRecord.period?.startDate,
            endDate: payrollRecord.period?.endDate,
            count: 0,
            amount: 0,
            types: new Set()
          };
        }
        summary.byPeriod[periodKey].count++;
        summary.byPeriod[periodKey].amount += amount;
        summary.byPeriod[periodKey].types.add(deduction.type);
      }
      
      // Track recurring deductions
      if (deduction.isRecurring) {
        summary.recurring.count++;
        summary.recurring.amount += amount;
        summary.recurring.types.add(deduction.type);
      }
      
      // Track government contributions
      switch (deduction.type) {
        case 'sss':
          summary.governmentContributions.sss += amount;
          summary.governmentContributions.total += amount;
          break;
        case 'philhealth':
          summary.governmentContributions.philhealth += amount;
          summary.governmentContributions.total += amount;
          break;
        case 'pagibig':
          summary.governmentContributions.pagibig += amount;
          summary.governmentContributions.total += amount;
          break;
        case 'tax':
          summary.governmentContributions.tax += amount;
          summary.governmentContributions.total += amount;
          break;
      }
      
      // Track loans and advances
      if (deduction.type === 'loan' || deduction.type === 'advance') {
        summary.loansAdvances.count++;
        summary.loansAdvances.amount += amount;
        if (deduction.isRecurring) {
          summary.loansAdvances.activeLoans++;
        }
      }
    });
    
    // Convert Sets to Arrays
    summary.recurring.types = Array.from(summary.recurring.types);
    Object.keys(summary.byPeriod).forEach(key => {
      summary.byPeriod[key].types = Array.from(summary.byPeriod[key].types);
    });
    
    // Calculate averages
    summary.averagePerPeriod = payrollRecords.length > 0 
      ? summary.totalAmount / payrollRecords.length 
      : 0;
    
    summary.averagePerDeduction = deductions.length > 0 
      ? summary.totalAmount / deductions.length 
      : 0;
    
    // Get latest deduction
    const latestDeduction = deductions.length > 0 ? deductions[0] : null;
    
    // Format response
    const responseData = {
      employee: {
        id: employee.id,
        employeeNumber: employee.employeeNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        department: employee.department,
        hireDate: employee.hireDate,
        basePay: employee.basePay
      },
      summary: {
        ...summary,
        breakdown: Object.values(summary.breakdown),
        byPeriod: Object.values(summary.byPeriod),
        payrollPeriods: payrollRecords.length,
        dateRange: periodId 
          ? 'Specific period' 
          : `All periods (${payrollRecords.length} total)`
      },
      latestDeduction: latestDeduction ? {
        id: latestDeduction.id,
        type: latestDeduction.type,
        amount: parseFloat(latestDeduction.amount) || 0,
        appliedDate: latestDeduction.appliedDate,
        isRecurring: Boolean(latestDeduction.isRecurring)
      } : null,
      meta: {
        employeeId: empId,
        periodId: periodId || 'All periods',
        generatedAt: new Date().toISOString(),
        timeRange: periodId ? 'Specific period' : 'All time'
      }
    };
    
    return {
      status: true,
      message: `Deductions summary for ${employee.firstName} ${employee.lastName}`,
      data: responseData
    };
    
  } catch (error) {
    logger.error(`Error in getEmployeeDeductionsSummary for employee ${employeeId}:`, error);
    
    return {
      status: false,
      message: error.message || "Failed to generate employee deductions summary",
      data: null
    };
  }
};
// src/ipc/handlers/payroll-period/get/report.ipc.js
const { AppDataSource } = require("../../../db/datasource");
const { logger } = require("../../../../utils/logger");

/**
 * Generate payroll period report
 * @param {number} periodId - Payroll period ID
 * @param {string} reportType - Type of report (summary, detailed, export)
 * @returns {Promise<Object>} Response object
 */
module.exports = async function getPayrollPeriodReport(periodId, reportType = 'summary') {
  try {
    // Validate inputs
    if (!periodId || isNaN(Number(periodId))) {
      return {
        status: false,
        message: "Valid period ID is required",
        data: null
      };
    }
    
    const id = parseInt(periodId);
    const validReportTypes = ['summary', 'detailed', 'export'];
    
    if (!validReportTypes.includes(reportType)) {
      return {
        status: false,
        message: `Invalid report type. Valid values: ${validReportTypes.join(', ')}`,
        data: null
      };
    }
    
    const periodRepository = AppDataSource.getRepository("PayrollPeriod");
    const payrollRecordRepository = AppDataSource.getRepository("PayrollRecord");
    const employeeRepository = AppDataSource.getRepository("Employee");
    
    // Get period with relations
    const period = await periodRepository.findOne({
      where: { id },
      relations: ["payrollRecords"]
    });
    
    if (!period) {
      return {
        status: false,
        message: `Payroll period with ID ${id} not found`,
        data: null
      };
    }
    
    // Get payroll records with employee details
    const payrollRecords = await payrollRecordRepository.find({
      where: { periodId: id },
      relations: ["employee", "deductions"],
      order: { employee: { lastName: "ASC", firstName: "ASC" } }
    });
    
    // Generate report based on type
    let report;
    
    switch (reportType) {
      case 'summary':
        report = generateSummaryReport(period, payrollRecords);
        break;
        
      case 'detailed':
        report = generateDetailedReport(period, payrollRecords);
        break;
        
      case 'export':
        report = generateExportReport(period, payrollRecords);
        break;
        
      default:
        report = generateSummaryReport(period, payrollRecords);
    }
    
    logger?.info(`Generated ${reportType} report for payroll period ${id}`);
    
    return {
      status: true,
      message: `Payroll period ${reportType} report generated successfully`,
      data: report
    };
  } catch (error) {
    logger?.error(`Error in getPayrollPeriodReport for period ${periodId}:`, error);
    return {
      status: false,
      message: `Failed to generate report: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};

// Helper functions for report generation
function generateSummaryReport(period, payrollRecords) {
  const summary = {
    periodId: period.id,
    periodName: period.name,
    startDate: period.startDate,
    endDate: period.endDate,
    payDate: period.payDate,
    status: period.status,
    workingDays: period.workingDays,
    
    totals: {
      employees: payrollRecords.length,
      grossPay: parseFloat(period.totalGrossPay) || 0,
      deductions: parseFloat(period.totalDeductions) || 0,
      netPay: parseFloat(period.totalNetPay) || 0
    },
    
    breakdown: {
      byDepartment: {},
      byPaymentStatus: {
        unpaid: 0,
        paid: 0,
        "partially-paid": 0,
        cancelled: 0
      }
    },
    
    averages: {
      grossPay: 0,
      netPay: 0,
      deductions: 0
    }
  };
  
  // Calculate breakdowns
  payrollRecords.forEach(record => {
    // Department breakdown
    const dept = record.employee?.department || "Unknown";
    if (!summary.breakdown.byDepartment[dept]) {
      summary.breakdown.byDepartment[dept] = {
        count: 0,
        totalGross: 0,
        totalNet: 0
      };
    }
    
    summary.breakdown.byDepartment[dept].count++;
    summary.breakdown.byDepartment[dept].totalGross += parseFloat(record.grossPay) || 0;
    summary.breakdown.byDepartment[dept].totalNet += parseFloat(record.netPay) || 0;
    
    // Payment status breakdown
    const status = record.paymentStatus || "unpaid";
    if (summary.breakdown.byPaymentStatus[status] !== undefined) {
      summary.breakdown.byPaymentStatus[status]++;
    }
  });
  
  // Calculate averages
  if (payrollRecords.length > 0) {
    summary.averages.grossPay = summary.totals.grossPay / payrollRecords.length;
    summary.averages.netPay = summary.totals.netPay / payrollRecords.length;
    summary.averages.deductions = summary.totals.deductions / payrollRecords.length;
  }
  
  return {
    type: 'summary',
    generatedAt: new Date().toISOString(),
    data: summary
  };
}

function generateDetailedReport(period, payrollRecords) {
  const detailedRecords = payrollRecords.map(record => ({
    employeeId: record.employeeId,
    employeeNumber: record.employee?.employeeNumber,
    name: `${record.employee?.lastName || ''}, ${record.employee?.firstName || ''}`.trim(),
    department: record.employee?.department,
    position: record.employee?.position,
    
    attendance: {
      daysPresent: record.daysPresent,
      daysAbsent: record.daysAbsent,
      daysLate: record.daysLate,
      daysHalfDay: record.daysHalfDay
    },
    
    earnings: {
      basicPay: parseFloat(record.basicPay) || 0,
      overtimePay: parseFloat(record.overtimePay) || 0,
      holidayPay: parseFloat(record.holidayPay) || 0,
      allowance: parseFloat(record.allowance) || 0,
      bonus: parseFloat(record.bonus) || 0,
      grossPay: parseFloat(record.grossPay) || 0
    },
    
    deductions: {
      sss: parseFloat(record.sssDeduction) || 0,
      philhealth: parseFloat(record.philhealthDeduction) || 0,
      pagibig: parseFloat(record.pagibigDeduction) || 0,
      tax: parseFloat(record.taxDeduction) || 0,
      loan: parseFloat(record.loanDeduction) || 0,
      advance: parseFloat(record.advanceDeduction) || 0,
      other: parseFloat(record.otherDeductions) || 0,
      total: parseFloat(record.deductionsTotal) || 0
    },
    
    netPay: parseFloat(record.netPay) || 0,
    paymentStatus: record.paymentStatus,
    computedAt: record.computedAt,
    paidAt: record.paidAt,
    paymentMethod: record.paymentMethod,
    paymentReference: record.paymentReference
  }));
  
  return {
    type: 'detailed',
    generatedAt: new Date().toISOString(),
    periodInfo: {
      id: period.id,
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      payDate: period.payDate,
      status: period.status
    },
    records: detailedRecords,
    totalRecords: detailedRecords.length
  };
}

function generateExportReport(period, payrollRecords) {
  // CSV format for export
  const csvHeaders = [
    'Employee ID',
    'Employee Number',
    'Last Name',
    'First Name',
    'Department',
    'Position',
    'Days Present',
    'Days Absent',
    'Basic Pay',
    'Overtime Pay',
    'Allowance',
    'Bonus',
    'Gross Pay',
    'SSS',
    'PhilHealth',
    'Pag-IBIG',
    'Tax',
    'Loan',
    'Advance',
    'Other Deductions',
    'Total Deductions',
    'Net Pay',
    'Payment Status',
    'Payment Method'
  ];
  
  const csvRows = payrollRecords.map(record => [
    record.employeeId,
    record.employee?.employeeNumber || '',
    record.employee?.lastName || '',
    record.employee?.firstName || '',
    record.employee?.department || '',
    record.employee?.position || '',
    record.daysPresent,
    record.daysAbsent,
    parseFloat(record.basicPay) || 0,
    parseFloat(record.overtimePay) || 0,
    parseFloat(record.allowance) || 0,
    parseFloat(record.bonus) || 0,
    parseFloat(record.grossPay) || 0,
    parseFloat(record.sssDeduction) || 0,
    parseFloat(record.philhealthDeduction) || 0,
    parseFloat(record.pagibigDeduction) || 0,
    parseFloat(record.taxDeduction) || 0,
    parseFloat(record.loanDeduction) || 0,
    parseFloat(record.advanceDeduction) || 0,
    parseFloat(record.otherDeductions) || 0,
    parseFloat(record.deductionsTotal) || 0,
    parseFloat(record.netPay) || 0,
    record.paymentStatus,
    record.paymentMethod || ''
  ]);
  
  // Convert to CSV string
  const csvContent = [
    csvHeaders.join(','),
    ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return {
    type: 'export',
    format: 'csv',
    generatedAt: new Date().toISOString(),
    filename: `payroll-period-${period.id}-${new Date().toISOString().split('T')[0]}.csv`,
    data: csvContent,
    periodInfo: {
      id: period.id,
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate
    }
  };
}
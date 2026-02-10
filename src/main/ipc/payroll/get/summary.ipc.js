// src/ipc/handlers/payroll-period/get/summary.ipc.js
const { AppDataSource } = require("../../../db/datasource");
const { logger } = require("../../../../utils/logger");

/**
 * Get payroll period summary with aggregated data
 * @param {number} periodId - Payroll period ID
 * @returns {Promise<Object>} Response object
 */
module.exports = async function getPayrollPeriodSummary(periodId) {
  try {
    // Validate input
    if (!periodId || isNaN(Number(periodId))) {
      return {
        status: false,
        message: "Invalid period ID",
        data: null
      };
    }
    
    const id = parseInt(periodId);
    const periodRepository = AppDataSource.getRepository("PayrollPeriod");
    const payrollRecordRepository = AppDataSource.getRepository("PayrollRecord");
    
    // Get period with relations
    const period = await periodRepository.findOne({
      where: { id },
      relations: ["payrollRecords", "payrollRecords.employee"]
    });
    
    if (!period) {
      return {
        status: false,
        message: `Payroll period with ID ${id} not found`,
        data: null
      };
    }
    
    // Calculate summary statistics from payroll records
    const summary = {
      periodId: id,
      periodName: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      payDate: period.payDate,
      status: period.status,
      
      // Aggregated from period totals
      totalEmployees: period.totalEmployees || 0,
      totalGrossPay: parseFloat(period.totalGrossPay) || 0,
      totalDeductions: parseFloat(period.totalDeductions) || 0,
      totalNetPay: parseFloat(period.totalNetPay) || 0,
      
      // Detailed breakdown from payroll records
      breakdown: {
        byDepartment: {},
        byPaymentStatus: {
          unpaid: 0,
          paid: 0,
          "partially-paid": 0,
          cancelled: 0
        }
      }
    };
    
    // If there are payroll records, calculate detailed breakdown
    if (period.payrollRecords && period.payrollRecords.length > 0) {
      period.payrollRecords.forEach(record => {
        // Group by department
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
        
        // Count by payment status
        const status = record.paymentStatus || "unpaid";
        if (summary.breakdown.byPaymentStatus[status] !== undefined) {
          summary.breakdown.byPaymentStatus[status]++;
        }
      });
    }
    
    // Calculate averages
    summary.averageGrossPay = summary.totalEmployees > 0 
      ? summary.totalGrossPay / summary.totalEmployees 
      : 0;
    summary.averageNetPay = summary.totalEmployees > 0 
      ? summary.totalNetPay / summary.totalEmployees 
      : 0;
    
    logger?.info(`Generated summary for payroll period ${id}`);
    
    return {
      status: true,
      message: "Payroll period summary retrieved successfully",
      data: summary
    };
  } catch (error) {
    logger?.error(`Error in getPayrollPeriodSummary for period ${periodId}:`, error);
    return {
      status: false,
      message: `Failed to generate payroll period summary: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};
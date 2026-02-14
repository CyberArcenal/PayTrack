// src/main/ipc/payrollPeriod/get/stats.ipc.js

const payrollPeriodService = require("../../../../services/PayrollPeriod");

/**
 * Get summary statistics across all payroll periods
 * @param {Object} params - (unused)
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const stats = await payrollPeriodService.getSummary();

    return {
      status: true,
      message: "Payroll period statistics retrieved",
      data: stats,
    };
  } catch (error) {
    console.error("Error in getPayrollPeriodStats:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve payroll period statistics",
      data: null,
    };
  }
};
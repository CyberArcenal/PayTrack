// src/main/ipc/payrollPeriod/get/current.ipc.js

const payrollPeriodService = require("../../../../services/PayrollPeriod");

/**
 * Get current active payroll period (based on today's date and open/processing status)
 * @param {Object} params - (unused)
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const period = await payrollPeriodService.getCurrentPeriod();

    return {
      status: true,
      message: period ? "Current payroll period found" : "No current payroll period",
      data: period || null,
    };
  } catch (error) {
    console.error("Error in getCurrentPayrollPeriod:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve current payroll period",
      data: null,
    };
  }
};
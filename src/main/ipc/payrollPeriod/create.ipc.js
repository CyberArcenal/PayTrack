// src/main/ipc/payrollPeriod/create.ipc.js
const payrollPeriodService = require("../../../services/PayrollPeriod");

/**
 * Create a new payroll period
 * @param {Object} params
 * @param {Object} params.data - Payroll period data
 * @param {string} [params.user] - User performing the action (defaults to "system")
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const { data, user = "system" } = params || {};
    if (!data) {
      throw new Error("Missing required parameter: data");
    }

    const period = await payrollPeriodService.create(data, user);

    return {
      status: true,
      message: "Payroll period created successfully",
      data: period,
    };
  } catch (error) {
    console.error("Error in createPayrollPeriod:", error);
    return {
      status: false,
      message: error.message || "Failed to create payroll period",
      data: null,
    };
  }
};
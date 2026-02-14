// src/main/ipc/payrollPeriod/lock.ipc.js
const payrollPeriodService = require("../../../services/PayrollPeriod");

/**
 * Lock a payroll period (prevent further changes)
 * @param {Object} params
 * @param {number} params.id - Period ID
 * @param {string} [params.user] - User performing the action
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const { id, user = "system" } = params || {};
    if (!id) {
      throw new Error("Missing required parameter: id");
    }

    const period = await payrollPeriodService.lockPeriod(parseInt(id), user);

    return {
      status: true,
      message: "Payroll period locked successfully",
      data: period,
    };
  } catch (error) {
    console.error("Error in lockPayrollPeriod:", error);
    return {
      status: false,
      message: error.message || "Failed to lock payroll period",
      data: null,
    };
  }
};
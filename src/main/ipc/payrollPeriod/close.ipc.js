// src/main/ipc/payrollPeriod/close.ipc.js


const payrollPeriodService = require("../../../services/PayrollPeriod");

/**
 * Close a payroll period (finalize, cannot be changed)
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

    const period = await payrollPeriodService.closePeriod(parseInt(id), user);

    return {
      status: true,
      message: "Payroll period closed successfully",
      data: period,
    };
  } catch (error) {
    console.error("Error in closePayrollPeriod:", error);
    return {
      status: false,
      message: error.message || "Failed to close payroll period",
      data: null,
    };
  }
};
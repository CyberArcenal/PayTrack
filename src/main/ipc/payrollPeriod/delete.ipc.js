// src/main/ipc/payrollPeriod/delete.ipc.js
const payrollPeriodService = require("../../../services/PayrollPeriod");

/**
 * Delete a payroll period (only if no payroll records linked)
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

    const result = await payrollPeriodService.delete(parseInt(id), user);

    return {
      status: true,
      message: result.message || "Payroll period deleted successfully",
      data: result,
    };
  } catch (error) {
    console.error("Error in deletePayrollPeriod:", error);
    return {
      status: false,
      message: error.message || "Failed to delete payroll period",
      data: null,
    };
  }
};
// src/main/ipc/payrollPeriod/update.ipc.js
const payrollPeriodService = require("../../../services/PayrollPeriod");

/**
 * Update an existing payroll period
 * @param {Object} params
 * @param {number} params.id - Period ID
 * @param {Object} params.data - Updated data
 * @param {string} [params.user] - User performing the action
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const { id, data, user = "system" } = params || {};
    if (!id) {
      throw new Error("Missing required parameter: id");
    }
    if (!data) {
      throw new Error("Missing required parameter: data");
    }

    const period = await payrollPeriodService.update(parseInt(id), data, user);

    return {
      status: true,
      message: "Payroll period updated successfully",
      data: period,
    };
  } catch (error) {
    console.error("Error in updatePayrollPeriod:", error);
    return {
      status: false,
      message: error.message || "Failed to update payroll period",
      data: null,
    };
  }
};
// src/main/ipc/payrollPeriod/get/by_id.ipc.js

const payrollPeriodService = require("../../../../services/PayrollPeriod");

/**
 * Get payroll period by ID
 * @param {Object} params
 * @param {number} params.id - Period ID
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const { id } = params || {};
    if (!id) {
      throw new Error("Missing required parameter: id");
    }

    const period = await payrollPeriodService.findById(parseInt(id));

    return {
      status: true,
      message: "Payroll period retrieved successfully",
      data: period,
    };
  } catch (error) {
    console.error("Error in getPayrollPeriodById:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve payroll period",
      data: null,
    };
  }
};
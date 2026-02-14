// get/by_payroll.ipc - Get deductions for a specific payroll record
// @ts-check

const deductionService = require("../../../../services/Deduction");

/**
 * Get all deductions belonging to a payroll record
 * @param {Object} params
 * @param {number} params.payrollRecordId - Payroll record ID
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const { payrollRecordId } = params;
    if (!payrollRecordId || typeof payrollRecordId !== "number") {
      throw new Error("Valid payrollRecordId is required");
    }

    const deductions = await deductionService.findAll({ payrollRecordId });
    return {
      status: true,
      message: "Deductions for payroll retrieved successfully",
      data: deductions,
    };
  } catch (error) {
    console.error("Error in getDeductionsByPayroll:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to retrieve deductions by payroll",
      data: null,
    };
  }
};
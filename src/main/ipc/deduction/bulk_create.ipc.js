// bulk_create.ipc - Create multiple deductions at once
// @ts-check

const deductionService = require("../../../services/Deduction");

/**
 * Bulk create deductions for a payroll record
 * @param {Object} params
 * @param {number} params.payrollRecordId - Payroll record ID
 * @param {Array<Object>} params.deductions - Array of deduction objects
 * @param {string} [params.user] - User performing action (default: "system")
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const { payrollRecordId, deductions, user = "system" } = params;
    if (!payrollRecordId || typeof payrollRecordId !== "number") {
      throw new Error("Valid payrollRecordId is required");
    }
    if (!Array.isArray(deductions) || deductions.length === 0) {
      throw new Error("Deductions array must be non-empty");
    }

    const created = await deductionService.bulkCreate(deductions, payrollRecordId, user);

    return {
      status: true,
      message: `Successfully created ${created.length} deductions`,
      data: created,
    };
  } catch (error) {
    console.error("Error in bulkCreateDeductions:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Bulk creation failed",
      data: null,
    };
  }
};
// create.ipc - Create a single deduction
// @ts-check

const deductionService = require("../../../services/Deduction");

/**
 * Create a new deduction
 * @param {Object} params
 * @param {number} params.payrollRecordId - Payroll record ID
 * @param {string} params.type - Deduction type
 * @param {string} [params.code] - Deduction code
 * @param {string} [params.description] - Description
 * @param {number} params.amount - Deduction amount
 * @param {number} [params.percentage] - Percentage if applicable
 * @param {boolean} [params.isRecurring] - Recurring flag
 * @param {string} [params.appliedDate] - Applied date (YYYY-MM-DD)
 * @param {string} [params.note] - Additional notes
 * @param {string} [params.user] - User performing action (default: "system")
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const required = ["payrollRecordId", "type", "amount"];
    for (const field of required) {
      // @ts-ignore
      if (params[field] === undefined || params[field] === null) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    const user = params.user || "system";

    const deductionData = {
      payrollRecordId: params.payrollRecordId,
      type: params.type,
      code: params.code,
      description: params.description,
      amount: params.amount,
      percentage: params.percentage,
      isRecurring: params.isRecurring,
      appliedDate: params.appliedDate,
      note: params.note,
    };

    const created = await deductionService.create(deductionData, user);

    return {
      status: true,
      message: "Deduction created successfully",
      data: created,
    };
  } catch (error) {
    console.error("Error in createDeduction:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to create deduction",
      data: null,
    };
  }
};
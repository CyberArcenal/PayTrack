// get/all.ipc - Retrieve all deductions with optional filters
// @ts-check

const deductionService = require("../../../../services/Deduction");

/**
 * Get all deductions with optional filtering and pagination
 * @param {Object} params - Query parameters
 * @param {number} [params.payrollRecordId] - Filter by payroll record ID
 * @param {string} [params.type] - Filter by deduction type (tax, sss, etc.)
 * @param {boolean} [params.isRecurring] - Filter by recurring flag
 * @param {string} [params.startDate] - Start date (YYYY-MM-DD)
 * @param {string} [params.endDate] - End date (YYYY-MM-DD)
 * @param {number} [params.page] - Page number (1-based)
 * @param {number} [params.limit] - Items per page
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const options = {
      payrollRecordId: params.payrollRecordId,
      type: params.type,
      isRecurring: params.isRecurring,
      startDate: params.startDate,
      endDate: params.endDate,
      page: params.page,
      limit: params.limit,
    };

    const deductions = await deductionService.findAll(options);
    return {
      status: true,
      message: "Deductions retrieved successfully",
      data: deductions,
    };
  } catch (error) {
    console.error("Error in getAllDeductions:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to retrieve deductions",
      data: null,
    };
  }
};
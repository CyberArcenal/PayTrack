// get/by_type.ipc - Get deductions by type
// @ts-check

const deductionService = require("../../../../services/Deduction");

/**
 * Get all deductions of a specific type
 * @param {Object} params
 * @param {string} params.type - Deduction type (e.g., "tax", "sss")
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const { type } = params;
    if (!type || typeof type !== "string") {
      throw new Error("Valid deduction type string is required");
    }

    const deductions = await deductionService.findAll({ type });
    return {
      status: true,
      message: "Deductions by type retrieved successfully",
      data: deductions,
    };
  } catch (error) {
    console.error("Error in getDeductionsByType:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to retrieve deductions by type",
      data: null,
    };
  }
};
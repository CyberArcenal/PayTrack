// get/by_id.ipc - Get a single deduction by ID
// @ts-check

const deductionService = require("../../../../services/Deduction");

/**
 * Get a deduction by its ID
 * @param {Object} params
 * @param {number} params.id - Deduction ID
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const { id } = params;
    if (!id || typeof id !== "number") {
      throw new Error("Valid numeric ID is required");
    }

    const deduction = await deductionService.findById(id);
    return {
      status: true,
      message: "Deduction retrieved successfully",
      data: deduction,
    };
  } catch (error) {
    console.error("Error in getDeductionById:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to retrieve deduction",
      data: null,
    };
  }
};
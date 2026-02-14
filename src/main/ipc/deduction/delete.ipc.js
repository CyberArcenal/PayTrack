// delete.ipc - Delete a deduction by ID
// @ts-check

const deductionService = require("../../../services/Deduction");

/**
 * Delete a deduction
 * @param {Object} params
 * @param {number} params.id - Deduction ID
 * @param {string} [params.user] - User performing action (default: "system")
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const { id, user = "system" } = params;
    if (!id || typeof id !== "number") {
      throw new Error("Valid deduction ID is required");
    }

    const result = await deductionService.delete(id, user);

    return {
      status: true,
      message: result.message || "Deduction deleted successfully",
      data: null,
    };
  } catch (error) {
    console.error("Error in deleteDeduction:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to delete deduction",
      data: null,
    };
  }
};
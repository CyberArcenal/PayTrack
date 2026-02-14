// update.ipc - Update an existing deduction
// @ts-check

const deductionService = require("../../../services/Deduction");

/**
 * Update a deduction by ID
 * @param {Object} params
 * @param {number} params.id - Deduction ID
 * @param {Object} params.updates - Fields to update
 * @param {string} [params.updates.type]
 * @param {string} [params.updates.code]
 * @param {string} [params.updates.description]
 * @param {number} [params.updates.amount]
 * @param {number} [params.updates.percentage]
 * @param {boolean} [params.updates.isRecurring]
 * @param {string} [params.updates.appliedDate]
 * @param {string} [params.updates.note]
 * @param {string} [params.user] - User performing action (default: "system")
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const { id, updates, user = "system" } = params;
    if (!id || typeof id !== "number") {
      throw new Error("Valid deduction ID is required");
    }
    if (!updates || typeof updates !== "object") {
      throw new Error("Updates object is required");
    }

    const updated = await deductionService.update(id, updates, user);

    return {
      status: true,
      message: "Deduction updated successfully",
      data: updated,
    };
  } catch (error) {
    console.error("Error in updateDeduction:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to update deduction",
      data: null,
    };
  }
};
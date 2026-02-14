// bulk_update.ipc - Update multiple deductions at once
// @ts-check

const deductionService = require("../../../services/Deduction");

/**
 * Update multiple deductions (each update object must contain id and updates)
 * @param {Object} params
 * @param {Array<{id: number, updates: Object}>} params.updatesList - List of updates
 * @param {string} [params.user] - User performing action (default: "system")
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const { updatesList, user = "system" } = params;
    if (!Array.isArray(updatesList) || updatesList.length === 0) {
      throw new Error("updatesList must be a non-empty array");
    }

    const results = [];
    const errors = [];

    for (const item of updatesList) {
      try {
        const { id, updates } = item;
        if (!id || typeof id !== "number" || !updates || typeof updates !== "object") {
          throw new Error("Each item must have {id: number, updates: object}");
        }
        const updated = await deductionService.update(id, updates, user);
        results.push(updated);
      } catch (err) {
        // @ts-ignore
        errors.push({ item, error: err.message });
      }
    }

    return {
      status: errors.length === 0,
      message:
        errors.length === 0
          ? `Successfully updated ${results.length} deductions`
          : `Partially completed: ${results.length} updated, ${errors.length} failed`,
      data: { updated: results, errors },
    };
  } catch (error) {
    console.error("Error in bulkUpdateDeductions:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Bulk update failed",
      data: null,
    };
  }
};
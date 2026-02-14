// src/main/ipc/payrollRecord/bulk_update.ipc
const payrollRecordService = require("../../../../services/PayrollRecordService");
const { logger } = require("../../../utils/logger");

/**
 * Bulk update payroll records.
 * @param {Object} params - { updates, userId }
 * updates: array of { id, data }
 */
module.exports = async (params) => {
  try {
    const { updates, userId } = params;
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error("An array of updates is required");
    }

    const user = userId || "system";
    const results = await Promise.allSettled(
      updates.map(({ id, data }) => payrollRecordService.update(id, data, user))
    );

    const successful = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);
    const failed = results
      .filter((r) => r.status === "rejected")
      .map((r, idx) => ({ index: idx, reason: r.reason.message }));

    return {
      status: true,
      data: { successful, failed },
      message: `Bulk update completed. ${successful.length} succeeded, ${failed.length} failed.`,
    };
  } catch (error) {
    logger.error("Error in bulkUpdatePayrollRecords:", error);
    return { status: false, message: error.message, data: null };
  }
};
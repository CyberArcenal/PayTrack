// src/main/ipc/payrollRecord/bulk_create.ipc
const payrollRecordService = require("../../../../services/PayrollRecordService");
const { logger } = require("../../../utils/logger");

/**
 * Bulk create payroll records.
 * @param {Object} params - { records, userId }
 */
module.exports = async (params) => {
  try {
    const { records, userId } = params;
    if (!Array.isArray(records) || records.length === 0) {
      throw new Error("An array of payroll records is required");
    }

    const user = userId || "system";
    const results = await Promise.allSettled(
      records.map((data) => payrollRecordService.create(data, user))
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
      message: `Bulk create completed. ${successful.length} succeeded, ${failed.length} failed.`,
    };
  } catch (error) {
    logger.error("Error in bulkCreatePayrollRecords:", error);
    return { status: false, message: error.message, data: null };
  }
};
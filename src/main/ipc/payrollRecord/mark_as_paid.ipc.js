// src/main/ipc/payrollRecord/mark_as_paid.ipc
const payrollRecordService = require("../../../../services/PayrollRecordService");
const { logger } = require("../../../utils/logger");

/**
 * Mark a payroll record as paid.
 * @param {Object} params - { id, paymentData, userId }
 */
module.exports = async (params) => {
  try {
    const { id, paymentData, userId } = params;
    if (!id || isNaN(parseInt(id))) {
      throw new Error("Valid payroll record ID is required");
    }

    const user = userId || "system";
    const record = await payrollRecordService.markAsPaid(parseInt(id), paymentData || {}, user);
    return {
      status: true,
      data: record,
      message: "Payroll marked as paid successfully",
    };
  } catch (error) {
    logger.error("Error in markAsPaid:", error);
    return { status: false, message: error.message, data: null };
  }
};
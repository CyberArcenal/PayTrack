// src/main/ipc/payrollRecord/cancel.ipc
const payrollRecordService = require("../../../../services/PayrollRecordService");
const { logger } = require("../../../utils/logger");

/**
 * Cancel a payroll record (set payment status to 'cancelled').
 * @param {Object} params - { id, userId }
 */
module.exports = async (params) => {
  try {
    const { id, userId } = params;
    if (!id || isNaN(parseInt(id))) {
      throw new Error("Valid payroll record ID is required");
    }

    const user = userId || "system";
    // Use update to set paymentStatus to 'cancelled'
    const updated = await payrollRecordService.update(
      parseInt(id),
      { paymentStatus: "cancelled" },
      user
    );
    return {
      status: true,
      data: updated,
      message: "Payroll record cancelled successfully",
    };
  } catch (error) {
    logger.error("Error in cancelPayrollRecord:", error);
    return { status: false, message: error.message, data: null };
  }
};
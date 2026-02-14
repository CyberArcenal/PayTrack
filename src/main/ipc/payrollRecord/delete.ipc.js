// src/main/ipc/payrollRecord/delete.ipc
const payrollRecordService = require("../../../../services/PayrollRecordService");
const { logger } = require("../../../utils/logger");

/**
 * Delete a payroll record (only if unpaid).
 * @param {Object} params - { id, userId }
 */
module.exports = async (params) => {
  try {
    const { id, userId } = params;
    if (!id || isNaN(parseInt(id))) {
      throw new Error("Valid payroll record ID is required");
    }

    const user = userId || "system";
    const result = await payrollRecordService.delete(parseInt(id), user);
    return {
      status: true,
      data: result,
      message: "Payroll record deleted successfully",
    };
  } catch (error) {
    logger.error("Error in deletePayrollRecord:", error);
    return { status: false, message: error.message, data: null };
  }
};
// src/main/ipc/payrollRecord/get/by_id.ipc
const payrollRecordService = require("../../../../services/PayrollRecordService");
const { logger } = require("../../../utils/logger");

/**
 * Get a single payroll record by ID.
 * @param {Object} params - { id }
 */
module.exports = async (params) => {
  try {
    const { id } = params;
    if (!id || isNaN(parseInt(id))) {
      throw new Error("Valid payroll record ID is required");
    }

    const record = await payrollRecordService.findById(parseInt(id));
    return {
      status: true,
      data: record,
      message: "Payroll record retrieved successfully",
    };
  } catch (error) {
    logger.error("Error in getPayrollRecordById:", error);
    return { status: false, message: error.message, data: null };
  }
};
// src/main/ipc/payrollRecord/create.ipc
const payrollRecordService = require("../../../../services/PayrollRecordService");
const { logger } = require("../../../utils/logger");

/**
 * Create a new payroll record (manual entry).
 * @param {Object} params - { data, userId }
 */
module.exports = async (params) => {
  try {
    const { data, userId } = params;
    if (!data) {
      throw new Error("Payroll record data is required");
    }

    const user = userId || "system";
    const record = await payrollRecordService.create(data, user);
    return {
      status: true,
      data: record,
      message: "Payroll record created successfully",
    };
  } catch (error) {
    logger.error("Error in createPayrollRecord:", error);
    return { status: false, message: error.message, data: null };
  }
};
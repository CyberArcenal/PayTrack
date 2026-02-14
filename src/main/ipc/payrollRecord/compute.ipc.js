// src/main/ipc/payrollRecord/compute.ipc
const payrollRecordService = require("../../../../services/PayrollRecordService");
const { logger } = require("../../../utils/logger");

/**
 * Compute payroll for an employee in a period.
 * @param {Object} params - { employeeId, periodId, userId }
 */
module.exports = async (params) => {
  try {
    const { employeeId, periodId, userId } = params;
    if (!employeeId || isNaN(parseInt(employeeId))) {
      throw new Error("Valid employee ID is required");
    }
    if (!periodId || isNaN(parseInt(periodId))) {
      throw new Error("Valid period ID is required");
    }

    const user = userId || "system";
    const record = await payrollRecordService.compute(parseInt(employeeId), parseInt(periodId), user);
    return {
      status: true,
      data: record,
      message: "Payroll computed successfully",
    };
  } catch (error) {
    logger.error("Error in computePayroll:", error);
    return { status: false, message: error.message, data: null };
  }
};
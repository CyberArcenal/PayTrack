// src/main/ipc/payrollRecord/update.ipc
const payrollRecordService = require("../../../../services/PayrollRecordService");
const { logger } = require("../../../utils/logger");

/**
 * Update an existing payroll record.
 * @param {Object} params - { id, data, userId }
 */
module.exports = async (params) => {
  try {
    const { id, data, userId } = params;
    if (!id || isNaN(parseInt(id))) {
      throw new Error("Valid payroll record ID is required");
    }
    if (!data) {
      throw new Error("Update data is required");
    }

    const user = userId || "system";
    const updated = await payrollRecordService.update(parseInt(id), data, user);
    return {
      status: true,
      data: updated,
      message: "Payroll record updated successfully",
    };
  } catch (error) {
    logger.error("Error in updatePayrollRecord:", error);
    return { status: false, message: error.message, data: null };
  }
};
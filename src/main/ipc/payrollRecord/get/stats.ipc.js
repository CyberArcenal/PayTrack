// src/main/ipc/payrollRecord/get/stats.ipc
const payrollRecordService = require("../../../../services/PayrollRecordService");
const { logger } = require("../../../utils/logger");

/**
 * Get payroll summary statistics.
 * @param {Object} params - { periodId, startDate, endDate }
 */
module.exports = async (params) => {
  try {
    const { periodId, startDate, endDate } = params;
    const filters = {};
    if (periodId) filters.periodId = parseInt(periodId);
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const summary = await payrollRecordService.getSummary(filters);
    return {
      status: true,
      data: summary,
      message: "Payroll statistics retrieved successfully",
    };
  } catch (error) {
    logger.error("Error in getPayrollRecordStats:", error);
    return { status: false, message: error.message, data: null };
  }
};
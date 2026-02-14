// src/main/ipc/payrollPeriod/get/all.ipc.js


const payrollPeriodService = require("../../../../services/PayrollPeriod");

/**
 * Get all payroll periods with optional filters
 * @param {Object} params - Request parameters
 * @param {string} [params.status] - Filter by status
 * @param {string} [params.periodType] - Filter by period type
 * @param {string} [params.startDate] - Start date filter (ISO date string)
 * @param {string} [params.endDate] - End date filter
 * @param {string} [params.payDate] - Pay date filter
 * @param {number} [params.page] - Page number for pagination
 * @param {number} [params.limit] - Items per page
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const {
      status,
      periodType,
      startDate,
      endDate,
      payDate,
      page,
      limit,
    } = params || {};

    const options = {};
    if (status) options.status = status;
    if (periodType) options.periodType = periodType;
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;
    if (payDate) options.payDate = payDate;
    if (page && limit) {
      options.page = parseInt(page);
      options.limit = parseInt(limit);
    }

    const periods = await payrollPeriodService.findAll(options);

    return {
      status: true,
      message: "Payroll periods retrieved successfully",
      data: periods,
    };
  } catch (error) {
    console.error("Error in getAllPayrollPeriods:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve payroll periods",
      data: null,
    };
  }
};
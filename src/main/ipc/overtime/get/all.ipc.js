

const overtimeLogService = require("../../../../services/OvertimeLog");

/**
 * Get all overtime logs with optional filters and pagination.
 * @param {Object} params - Request parameters.
 * @param {number} [params.page] - Page number (1-based).
 * @param {number} [params.limit] - Items per page.
 * @param {number} [params.employeeId] - Filter by employee ID.
 * @param {string} [params.startDate] - Filter by start date (YYYY-MM-DD).
 * @param {string} [params.endDate] - Filter by end date (YYYY-MM-DD).
 * @param {string} [params.type] - Filter by overtime type.
 * @param {string} [params.approvalStatus] - Filter by approval status.
 * @param {number} [params.payrollRecordId] - Filter by payroll record ID.
 * @returns {Promise<{ success: boolean, message?: string, data?: any }>}
 */
module.exports = async (params) => {
  try {
    const {
      page,
      limit,
      employeeId,
      startDate,
      endDate,
      type,
      approvalStatus,
      payrollRecordId,
    } = params;

    // Build filters object, removing undefined values
    const filters = {};
    if (employeeId !== undefined) filters.employeeId = employeeId;
    if (startDate !== undefined) filters.startDate = startDate;
    if (endDate !== undefined) filters.endDate = endDate;
    if (type !== undefined) filters.type = type;
    if (approvalStatus !== undefined) filters.approvalStatus = approvalStatus;
    if (payrollRecordId !== undefined) filters.payrollRecordId = payrollRecordId;
    if (page !== undefined && limit !== undefined) {
      filters.page = page;
      filters.limit = limit;
    }

    const data = await overtimeLogService.findAll(filters);
    return { success: true, data };
  } catch (error) {
    console.error('[get/all.ipc] Error:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to retrieve overtime logs',
    };
  }
};
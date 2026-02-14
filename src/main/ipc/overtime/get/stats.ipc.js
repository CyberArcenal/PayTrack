const overtimeLogService = require("../../../../services/OvertimeLog");

/**
 * Get summary statistics for overtime logs.
 * @param {Object} params - Request parameters.
 * @param {number} [params.employeeId] - Filter by employee.
 * @param {string} [params.startDate] - Start date.
 * @param {string} [params.endDate] - End date.
 * @returns {Promise<{ success: boolean, message?: string, data?: any }>}
 */
module.exports = async (params) => {
  try {
    const { employeeId, startDate, endDate } = params;
    const filters = {};
    if (employeeId !== undefined) filters.employeeId = parseInt(employeeId);
    if (startDate !== undefined) filters.startDate = startDate;
    if (endDate !== undefined) filters.endDate = endDate;

    const data = await overtimeLogService.getSummary(filters);
    return { success: true, data };
  } catch (error) {
    console.error('[get/stats.ipc] Error:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to retrieve overtime statistics',
    };
  }
};
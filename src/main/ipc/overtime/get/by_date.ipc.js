const overtimeLogService = require("../../../../services/OvertimeLog");

/**
 * Get overtime logs within a date range.
 * @param {Object} params - Request parameters.
 * @param {string} params.startDate - Start date (YYYY-MM-DD).
 * @param {string} params.endDate - End date (YYYY-MM-DD).
 * @param {number} [params.employeeId] - Optional employee filter.
 * @returns {Promise<{ success: boolean, message?: string, data?: any }>}
 */
module.exports = async (params) => {
  try {
    const { startDate, endDate, employeeId } = params;
    if (!startDate || !endDate) {
      throw new Error('startDate and endDate are required');
    }
    const filters = { startDate, endDate };
    if (employeeId !== undefined) {
      filters.employeeId = parseInt(employeeId);
    }
    const data = await overtimeLogService.findAll(filters);
    return { success: true, data };
  } catch (error) {
    console.error('[get/by_date.ipc] Error:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to retrieve overtime logs by date',
    };
  }
};
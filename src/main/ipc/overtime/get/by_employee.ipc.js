const overtimeLogService = require("../../../../services/OvertimeLog");

/**
 * Get overtime logs for a specific employee.
 * @param {Object} params - Request parameters.
 * @param {number} params.employeeId - Employee ID.
 * @param {string} [params.startDate] - Start date filter.
 * @param {string} [params.endDate] - End date filter.
 * @returns {Promise<{ success: boolean, message?: string, data?: any }>}
 */
module.exports = async (params) => {
  try {
    const { employeeId, startDate, endDate } = params;
    if (typeof employeeId !== 'number' && isNaN(parseInt(employeeId))) {
      throw new Error('Invalid or missing employee ID');
    }
    const filters = { employeeId: parseInt(employeeId) };
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const data = await overtimeLogService.findAll(filters);
    return { success: true, data };
  } catch (error) {
    console.error('[get/by_employee.ipc] Error:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to retrieve overtime logs for employee',
    };
  }
};
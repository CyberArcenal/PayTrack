const overtimeLogService = require("../../../services/OvertimeLog");

/**
 * Create a new overtime log.
 * @param {Object} params - Request parameters.
 * @param {number} params.employeeId - Employee ID.
 * @param {string} params.date - Date (YYYY-MM-DD).
 * @param {string} params.startTime - Start time (HH:MM:SS).
 * @param {string} params.endTime - End time (HH:MM:SS).
 * @param {string} [params.type] - Overtime type.
 * @param {number} [params.rate] - Overtime multiplier.
 * @param {string} [params.approvedBy] - Approver name.
 * @param {string} [params.note] - Notes.
 * @param {string} [params.user] - User performing the action.
 * @returns {Promise<{ success: boolean, message?: string, data?: any }>}
 */
module.exports = async (params) => {
  try {
    const {
      employeeId,
      date,
      startTime,
      endTime,
      type,
      rate,
      approvedBy,
      note,
      user = 'system',
    } = params;

    // Basic validation
    if (!employeeId || !date || !startTime || !endTime) {
      throw new Error('Missing required fields: employeeId, date, startTime, endTime');
    }

    const data = {
      employeeId: parseInt(employeeId),
      date,
      startTime,
      endTime,
      type,
      rate: rate !== undefined ? parseFloat(rate) : undefined,
      approvedBy,
      note,
    };

    const result = await overtimeLogService.create(data, user);
    return { success: true, data: result, message: 'Overtime log created successfully' };
  } catch (error) {
    console.error('[create.ipc] Error:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to create overtime log',
    };
  }
};
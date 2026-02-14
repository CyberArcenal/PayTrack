const overtimeLogService = require("../../../services/OvertimeLog");

/**
 * Update an existing overtime log.
 * @param {Object} params - Request parameters.
 * @param {number} params.id - Overtime log ID.
 * @param {number} [params.employeeId] - New employee ID.
 * @param {string} [params.date] - New date.
 * @param {string} [params.startTime] - New start time.
 * @param {string} [params.endTime] - New end time.
 * @param {string} [params.type] - New type.
 * @param {number} [params.rate] - New rate multiplier.
 * @param {string} [params.approvedBy] - New approver.
 * @param {string} [params.approvalStatus] - New approval status.
 * @param {string} [params.note] - New note.
 * @param {string} [params.user] - User performing the action.
 * @returns {Promise<{ success: boolean, message?: string, data?: any }>}
 */
module.exports = async (params) => {
  try {
    const { id, user = 'system', ...updateData } = params;

    if (typeof id !== 'number' && isNaN(parseInt(id))) {
      throw new Error('Invalid or missing overtime log ID');
    }

    // Convert numeric fields
    if (updateData.employeeId !== undefined) {
      updateData.employeeId = parseInt(updateData.employeeId);
    }
    if (updateData.rate !== undefined) {
      updateData.rate = parseFloat(updateData.rate);
    }

    const result = await overtimeLogService.update(parseInt(id), updateData, user);
    return { success: true, data: result, message: 'Overtime log updated successfully' };
  } catch (error) {
    console.error('[update.ipc] Error:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to update overtime log',
    };
  }
};
const overtimeLogService = require("../../../services/OvertimeLog");

/**
 * Delete an overtime log by ID.
 * @param {Object} params - Request parameters.
 * @param {number} params.id - Overtime log ID.
 * @param {string} [params.user] - User performing the action.
 * @returns {Promise<{ success: boolean, message?: string, data?: any }>}
 */
module.exports = async (params) => {
  try {
    const { id, user = 'system' } = params;

    if (typeof id !== 'number' && isNaN(parseInt(id))) {
      throw new Error('Invalid or missing overtime log ID');
    }

    const result = await overtimeLogService.delete(parseInt(id), user);
    return { success: true, data: result, message: 'Overtime log deleted successfully' };
  } catch (error) {
    console.error('[delete.ipc] Error:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to delete overtime log',
    };
  }
};
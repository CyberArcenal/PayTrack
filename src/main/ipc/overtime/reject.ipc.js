const overtimeLogService = require("../../../services/OvertimeLog");

/**
 * Reject an overtime log with a reason.
 * @param {Object} params - Request parameters.
 * @param {number} params.id - Overtime log ID.
 * @param {string} params.reason - Rejection reason.
 * @param {string} [params.user] - User performing the action.
 * @returns {Promise<{ success: boolean, message?: string, data?: any }>}
 */
module.exports = async (params) => {
  try {
    const { id, reason, user = 'system' } = params;

    if (typeof id !== 'number' && isNaN(parseInt(id))) {
      throw new Error('Invalid or missing overtime log ID');
    }
    if (!reason || typeof reason !== 'string') {
      throw new Error('Rejection reason is required');
    }

    const result = await overtimeLogService.reject(parseInt(id), reason, user);
    return { success: true, data: result, message: 'Overtime log rejected successfully' };
  } catch (error) {
    console.error('[reject.ipc] Error:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to reject overtime log',
    };
  }
};
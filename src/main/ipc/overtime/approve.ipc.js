

const overtimeLogService = require("../../../services/OvertimeLog");

/**
 * Approve an overtime log.
 * @param {Object} params - Request parameters.
 * @param {number} params.id - Overtime log ID.
 * @param {string} params.approver - Approver name/ID.
 * @param {string} [params.user] - User performing the action.
 * @returns {Promise<{ success: boolean, message?: string, data?: any }>}
 */
module.exports = async (params) => {
  try {
    const { id, approver, user = 'system' } = params;

    if (typeof id !== 'number' && isNaN(parseInt(id))) {
      throw new Error('Invalid or missing overtime log ID');
    }
    if (!approver || typeof approver !== 'string') {
      throw new Error('Approver name is required');
    }

    const result = await overtimeLogService.approve(parseInt(id), approver, user);
    return { success: true, data: result, message: 'Overtime log approved successfully' };
  } catch (error) {
    console.error('[approve.ipc] Error:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to approve overtime log',
    };
  }
};
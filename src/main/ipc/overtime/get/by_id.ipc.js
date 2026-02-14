const overtimeLogService = require("../../../../services/OvertimeLog");

/**
 * Get a single overtime log by its ID.
 * @param {Object} params - Request parameters.
 * @param {number} params.id - Overtime log ID.
 * @returns {Promise<{ success: boolean, message?: string, data?: any }>}
 */
module.exports = async (params) => {
  try {
    const { id } = params;
    if (typeof id !== 'number' && isNaN(parseInt(id))) {
      throw new Error('Invalid or missing overtime log ID');
    }
    const data = await overtimeLogService.findById(parseInt(id));
    return { success: true, data };
  } catch (error) {
    console.error('[get/by_id.ipc] Error:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to retrieve overtime log',
    };
  }
};
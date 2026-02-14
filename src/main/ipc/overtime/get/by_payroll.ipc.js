const overtimeLogService = require("../../../../services/OvertimeLog");

/**
 * Get overtime logs linked to a specific payroll record.
 * @param {Object} params - Request parameters.
 * @param {number} params.payrollRecordId - Payroll record ID.
 * @returns {Promise<{ success: boolean, message?: string, data?: any }>}
 */
module.exports = async (params) => {
  try {
    const { payrollRecordId } = params;
    if (typeof payrollRecordId !== 'number' && isNaN(parseInt(payrollRecordId))) {
      throw new Error('Invalid or missing payroll record ID');
    }
    const data = await overtimeLogService.findAll({
      payrollRecordId: parseInt(payrollRecordId),
    });
    return { success: true, data };
  } catch (error) {
    console.error('[get/by_payroll.ipc] Error:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to retrieve overtime logs for payroll record',
    };
  }
};
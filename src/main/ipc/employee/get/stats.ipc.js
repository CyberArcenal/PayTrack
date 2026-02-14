// @ts-check

const employeeService = require("../../../../services/Employee");
const { logger } = require("../../../../utils/logger");

/**
 * Get employee statistics (summary)
 * @param {Object} params - (unused)
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  try {
    const stats = await employeeService.getSummary();
    return { status: true, data: stats };
  } catch (error) {
    // @ts-ignore
    logger.error("Error in getEmployeeStats:", error);
    // @ts-ignore
    return { status: false, message: error.message || "Failed to fetch employee statistics" };
  }
};
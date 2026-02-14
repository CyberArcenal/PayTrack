const employeeService = require("../../../services/Employee");
const { logger } = require("../../../utils/logger");

/**
 * Search employees by keyword
 * @param {Object} params - { search, page?, limit? }
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  try {
    const { search, page, limit } = params;
    if (!search) {
      return { status: false, message: "Search keyword is required" };
    }

    const employees = await employeeService.findAll({ search, page, limit });
    return { status: true, data: employees };
  } catch (error) {
    logger.error("Error in searchEmployees:", error);
    return { status: false, message: error.message || "Failed to search employees" };
  }
};
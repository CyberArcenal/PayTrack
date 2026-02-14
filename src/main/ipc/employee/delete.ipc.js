const employeeService = require("../../../services/Employee");
const { logger } = require("../../../utils/logger");

/**
 * Delete an employee
 * @param {Object} params - { id, user? }
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  try {
    const { id, user = "system" } = params;

    if (!id || isNaN(Number(id))) {
      return { status: false, message: "Valid employee ID is required" };
    }

    const result = await employeeService.delete(Number(id), user);
    return { status: true, data: result, message: "Employee deleted successfully" };
  } catch (error) {
    logger.error("Error in deleteEmployee:", error);
    return { status: false, message: error.message || "Failed to delete employee" };
  }
};
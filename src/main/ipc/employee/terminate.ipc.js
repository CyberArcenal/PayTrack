const employeeService = require("../../../services/Employee");
const { logger } = require("../../../utils/logger");

/**
 * Terminate an employee (special case of status update)
 * @param {Object} params - { id, reason?, user? }
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  try {
    const { id, reason = "", user = "system" } = params;

    if (!id || isNaN(Number(id))) {
      return { status: false, message: "Valid employee ID is required" };
    }

    // Optionally add termination note
    const updated = await employeeService.changeStatus(Number(id), "terminated", user);
    // You could also update a terminationDate field if you add it to the entity

    return { status: true, data: updated, message: "Employee terminated successfully" };
  } catch (error) {
    logger.error("Error in terminateEmployee:", error);
    return { status: false, message: error.message || "Failed to terminate employee" };
  }
};
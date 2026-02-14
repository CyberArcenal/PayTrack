const employeeService = require("../../../services/Employee");
const { logger } = require("../../../utils/logger");

/**
 * Update an existing employee
 * @param {Object} params - { id, user?, ...updates }
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  try {
    const { id, user = "system", ...updates } = params;

    if (!id || isNaN(Number(id))) {
      return { status: false, message: "Valid employee ID is required" };
    }

    const updated = await employeeService.update(Number(id), updates, user);
    return { status: true, data: updated, message: "Employee updated successfully" };
  } catch (error) {
    logger.error("Error in updateEmployee:", error);
    return { status: false, message: error.message || "Failed to update employee" };
  }
};
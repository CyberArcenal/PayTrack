const employeeService = require("../../../services/Employee");
const { logger } = require("../../../utils/logger");

/**
 * Create a new employee
 * @param {Object} params - Employee data
 * @param {string} [params.user] - User performing action (default "system")
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  try {
    const { user = "system", ...employeeData } = params;

    // Basic validation
    if (!employeeData.firstName || !employeeData.lastName) {
      return { status: false, message: "First name and last name are required" };
    }

    const newEmployee = await employeeService.create(employeeData, user);
    return { status: true, data: newEmployee, message: "Employee created successfully" };
  } catch (error) {
    logger.error("Error in createEmployee:", error);
    return { status: false, message: error.message || "Failed to create employee" };
  }
};
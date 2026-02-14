const employeeService = require("../../../../services/Employee");
const { logger } = require("../../../../utils/logger");

/**
 * Get employee by ID
 * @param {Object} params - { id }
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  try {
    if (!params.id || isNaN(Number(params.id))) {
      return { status: false, message: "Valid employee ID is required" };
    }

    const employee = await employeeService.findById(Number(params.id));
    return { status: true, data: employee };
  } catch (error) {
    logger.error("Error in getEmployeeById:", error);
    return { status: false, message: error.message || "Failed to get employee" };
  }
};
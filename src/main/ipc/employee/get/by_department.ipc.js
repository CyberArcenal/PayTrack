
const employeeService = require("../../../../services/Employee");
const { logger } = require("../../../../utils/logger");


/**
 * Get employees by department
 * @param {Object} params - { department }
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  try {
    if (!params.department) {
      return { status: false, message: "Department is required" };
    }

    const employees = await employeeService.findAll({ department: params.department });
    return { status: true, data: employees };
  } catch (error) {
    logger.error("Error in getEmployeesByDepartment:", error);
    return { status: false, message: error.message || "Failed to fetch employees by department" };
  }
};
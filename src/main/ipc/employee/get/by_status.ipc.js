// @ts-check

const employeeService = require("../../../../services/Employee");
const { logger } = require("../../../../utils/logger");


/**
 * Get employees by status
 * @param {Object} params - { status }
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  try {
    // @ts-ignore
    if (!params.status) {
      return { status: false, message: "Status is required" };
    }

    // @ts-ignore
    const employees = await employeeService.findAll({ status: params.status });
    return { status: true, data: employees };
  } catch (error) {
    // @ts-ignore
    logger.error("Error in getEmployeesByStatus:", error);
    // @ts-ignore
    return { status: false, message: error.message || "Failed to fetch employees by status" };
  }
};
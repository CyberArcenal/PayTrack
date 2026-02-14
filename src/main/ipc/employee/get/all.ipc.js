// @ts-check

const employeeService = require("../../../../services/Employee");

/**
 * Get all employees with optional filters
 * @param {Object} params - { status?, department?, employmentType?, search?, page?, limit? }
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  try {
    // @ts-ignore
    const { status, department, employmentType, search, page, limit } = params;
    const employees = await employeeService.findAll({
      status,
      department,
      employmentType,
      search,
      page,
      limit
    });
    return { status: true, data: employees };
  } catch (error) {
    // @ts-ignore
    logger.error("Error in getAllEmployees:", error);
    // @ts-ignore
    return { status: false, message: error.message || "Failed to fetch employees" };
  }
};
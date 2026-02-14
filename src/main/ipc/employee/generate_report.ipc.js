const employeeService = require("../../../services/Employee");
const { logger } = require("../../../utils/logger");

/**
 * Generate a comprehensive employee report (summary + optional lists)
 * @param {Object} params - { includeDetails?: boolean, department?: string }
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  try {
    const { includeDetails = false, department } = params;

    const summary = await employeeService.getSummary();

    const report = { summary };

    if (includeDetails) {
      const filters = department ? { department } : {};
      const employees = await employeeService.findAll(filters);
      report.employees = employees;
    }

    return { status: true, data: report, message: "Report generated" };
  } catch (error) {
    logger.error("Error in generateEmployeeReport:", error);
    return { status: false, message: error.message || "Failed to generate report" };
  }
};
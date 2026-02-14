const employeeService = require("../../../services/Employee");
const { logger } = require("../../../utils/logger");

/**
 * Update employee status
 * @param {Object} params - { id, status, user? }
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  try {
    const { id, status, user = "system" } = params;

    if (!id || isNaN(Number(id))) {
      return { status: false, message: "Valid employee ID is required" };
    }
    if (!status) {
      return { status: false, message: "New status is required" };
    }

    const validStatuses = ["active", "inactive", "terminated", "on-leave"];
    if (!validStatuses.includes(status)) {
      return { status: false, message: `Status must be one of: ${validStatuses.join(", ")}` };
    }

    const updated = await employeeService.changeStatus(Number(id), status, user);
    return { status: true, data: updated, message: `Employee status updated to ${status}` };
  } catch (error) {
    logger.error("Error in updateEmployeeStatus:", error);
    return { status: false, message: error.message || "Failed to update employee status" };
  }
};
// ===================== update_status.ipc.js =====================
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");
/**
 * Update employee status
 * @param {Object} statusData
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function updateEmployeeStatus(statusData, queryRunner) {
  const repo = queryRunner ? queryRunner.manager.getRepository("Employee") : AppDataSource.getRepository("Employee");

  try {
    const { id, status, userId, userType, reason } = statusData;

    if (!id || !status) {
      return {
        status: false,
        message: "Employee ID and status are required",
        data: null,
      };
    }

    const validStatuses = ["active", "inactive", "terminated", "on-leave"];
    if (!validStatuses.includes(status)) {
      return {
        status: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        data: null,
      };
    }

    const employee = await repo.findOne({ where: { id } });
    if (!employee) {
      return {
        status: false,
        message: `Employee with ID ${id} not found`,
        data: null,
      };
    }

    const oldStatus = employee.status;
    await repo.update(id, { status, updatedAt: new Date() });
    const updatedEmployee = await repo.findOne({ where: { id } });

    logger.info(`Employee status updated: ID ${id}, ${oldStatus} -> ${status}`);

    return {
      status: true,
      message: "Employee status updated successfully",
      data: updatedEmployee,
    };
  } catch (error) {
    logger.error("Error in updateEmployeeStatus:", error);
    return {
      status: false,
      message: error.message || "Failed to update employee status",
      data: null,
    };
  }
};
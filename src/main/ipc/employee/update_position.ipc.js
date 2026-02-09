// ===================== update_position.ipc.js =====================

const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");

/**
 * Update employee position
 * @param {Object} positionData
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function updateEmployeePosition(positionData, queryRunner) {
  const repo = queryRunner ? queryRunner.manager.getRepository("Employee") : AppDataSource.getRepository("Employee");

  try {
    const { id, position, userId, userType, reason } = positionData;

    if (!id || !position) {
      return {
        status: false,
        message: "Employee ID and position are required",
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

    const oldPosition = employee.position;
    await repo.update(id, { position, updatedAt: new Date() });
    const updatedEmployee = await repo.findOne({ where: { id } });

    logger.info(`Employee position updated: ID ${id}, ${oldPosition} -> ${position}`);

    return {
      status: true,
      message: "Employee position updated successfully",
      data: updatedEmployee,
    };
  } catch (error) {
    logger.error("Error in updateEmployeePosition:", error);
    return {
      status: false,
      message: error.message || "Failed to update employee position",
      data: null,
    };
  }
};
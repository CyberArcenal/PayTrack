// ===================== delete.ipc.js =====================
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Delete employee (soft delete by changing status)
 * @param {Object} deleteData
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function deleteEmployee(deleteData, queryRunner) {
  const repo = queryRunner ? queryRunner.manager.getRepository("Employee") : AppDataSource.getRepository("Employee");

  try {
    const { id, userId, userType, reason } = deleteData;

    if (!id) {
      return {
        status: false,
        message: "Employee ID is required",
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

    // Instead of hard delete, change status to terminated
    const updateData = {
      status: "terminated",
      updatedAt: new Date(),
    };

    await repo.update(id, updateData);

    logger.info(`Employee terminated: ID ${id}, Name: ${employee.firstName} ${employee.lastName}`);

    return {
      status: true,
      message: "Employee terminated successfully",
      data: { id, status: "terminated" },
    };
  } catch (error) {
    logger.error("Error in deleteEmployee:", error);
    return {
      status: false,
      message: error.message || "Failed to terminate employee",
      data: null,
    };
  }
};
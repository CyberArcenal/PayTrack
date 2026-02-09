// src/ipc/handlers/overtime/delete/delete.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Delete an overtime log
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function deleteOvertimeLog(params, queryRunner) {
  const repo = queryRunner
    ? queryRunner.manager.getRepository("OvertimeLog")
    : AppDataSource.getRepository("OvertimeLog");

  try {
    const { id } = params;

    if (!id || typeof id !== "number") {
      return {
        status: false,
        message: "Invalid overtime log ID",
        data: null,
      };
    }

    // Check if overtime log exists
    const existingLog = await repo.findOne({
      where: { id },
      relations: ["payrollRecord"],
    });

    if (!existingLog) {
      return {
        status: false,
        message: `Overtime log with ID ${id} not found`,
        data: null,
      };
    }

    // Check if already processed in payroll
    if (existingLog.payrollRecordId) {
      return {
        status: false,
        message: "Cannot delete overtime log that has already been processed in payroll",
        data: null,
      };
    }

    // Delete the log
    await repo.delete(id);

    logger.info(`Overtime log deleted: ID ${id}`);

    return {
      status: true,
      message: "Overtime log deleted successfully",
      data: { id },
    };
  } catch (error) {
    logger.error(`Error in deleteOvertimeLog for ID ${params.id}:`, error);

    return {
      status: false,
      message: error.message || "Failed to delete overtime log",
      data: null,
    };
  }
};
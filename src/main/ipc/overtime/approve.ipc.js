// src/ipc/handlers/overtime/approve.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Approve an overtime log
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function approveOvertime(params, queryRunner) {
  const repo = queryRunner
    ? queryRunner.manager.getRepository("OvertimeLog")
    : AppDataSource.getRepository("OvertimeLog");

  try {
    const { id, approvedBy, note } = params;

    if (!id || typeof id !== "number") {
      return {
        status: false,
        message: "Invalid overtime log ID",
        data: null,
      };
    }

    if (!approvedBy || typeof approvedBy !== "string" || approvedBy.trim().length === 0) {
      return {
        status: false,
        message: "Approver name is required",
        data: null,
      };
    }

    // Check if overtime log exists
    const existingLog = await repo.findOne({
      where: { id },
      relations: ["employee"],
    });

    if (!existingLog) {
      return {
        status: false,
        message: `Overtime log with ID ${id} not found`,
        data: null,
      };
    }

    // Check current status
    if (existingLog.approvalStatus === "approved") {
      return {
        status: false,
        message: "Overtime log is already approved",
        data: existingLog,
      };
    }

    if (existingLog.approvalStatus === "rejected") {
      return {
        status: false,
        message: "Cannot approve a rejected overtime log",
        data: null,
      };
    }

    // Update to approved
    await repo.update(id, {
      approvalStatus: "approved",
      approvedBy: approvedBy.trim(),
      note: note ? `${existingLog.note || ""}\n[Approved by ${approvedBy}]: ${note}`.trim() : existingLog.note,
      updatedAt: new Date(),
    });

    // Get updated record
    const updatedLog = await repo.findOne({
      where: { id },
      relations: ["employee"],
    });

    logger.info(`Overtime log approved: ID ${id} by ${approvedBy}`);

    return {
      status: true,
      message: "Overtime log approved successfully",
      data: updatedLog,
    };
  } catch (error) {
    logger.error(`Error in approveOvertime for ID ${params.id}:`, error);

    return {
      status: false,
      message: error.message || "Failed to approve overtime log",
      data: null,
    };
  }
};
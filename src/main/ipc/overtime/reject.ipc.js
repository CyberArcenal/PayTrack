// src/ipc/handlers/overtime/reject.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Reject an overtime log
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function rejectOvertime(params, queryRunner) {
  const repo = queryRunner
    ? queryRunner.manager.getRepository("OvertimeLog")
    : AppDataSource.getRepository("OvertimeLog");

  try {
    const { id, rejectedBy, reason } = params;

    if (!id || typeof id !== "number") {
      return {
        status: false,
        message: "Invalid overtime log ID",
        data: null,
      };
    }

    if (!rejectedBy || typeof rejectedBy !== "string" || rejectedBy.trim().length === 0) {
      return {
        status: false,
        message: "Rejecter name is required",
        data: null,
      };
    }

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return {
        status: false,
        message: "Rejection reason is required",
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
    if (existingLog.approvalStatus === "rejected") {
      return {
        status: false,
        message: "Overtime log is already rejected",
        data: existingLog,
      };
    }

    if (existingLog.approvalStatus === "approved") {
      return {
        status: false,
        message: "Cannot reject an approved overtime log",
        data: null,
      };
    }

    // Update to rejected
    const rejectionNote = `[REJECTED by ${rejectedBy}]: ${reason}`;
    await repo.update(id, {
      approvalStatus: "rejected",
      approvedBy: rejectedBy.trim(),
      note: existingLog.note 
        ? `${existingLog.note}\n${rejectionNote}`.trim()
        : rejectionNote,
      updatedAt: new Date(),
    });

    // Get updated record
    const updatedLog = await repo.findOne({
      where: { id },
      relations: ["employee"],
    });

    logger.info(`Overtime log rejected: ID ${id} by ${rejectedBy}`);

    return {
      status: true,
      message: "Overtime log rejected successfully",
      data: updatedLog,
    };
  } catch (error) {
    logger.error(`Error in rejectOvertime for ID ${params.id}:`, error);

    return {
      status: false,
      message: error.message || "Failed to reject overtime log",
      data: null,
    };
  }
};
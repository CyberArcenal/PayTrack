// src/ipc/handlers/overtime/update_hours.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");
const calculateOvertimeHours = require("../calculate/hours.ipc");

/**
 * Update overtime hours and recalculate amount
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function updateOvertimeHours(params, queryRunner) {
  const repo = queryRunner
    ? queryRunner.manager.getRepository("OvertimeLog")
    : AppDataSource.getRepository("OvertimeLog");

  try {
    const { id, hours, recalculateAmount = true } = params;

    if (!id || typeof id !== "number") {
      return {
        status: false,
        message: "Invalid overtime log ID",
        data: null,
      };
    }

    if (hours === undefined || hours === null || typeof hours !== "number" || hours <= 0) {
      return {
        status: false,
        message: "Invalid hours value. Must be a positive number",
        data: null,
      };
    }

    // Check if overtime log exists
    const existingLog = await repo.findOne({
      where: { id },
      relations: ["employee", "payrollRecord"],
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
        message: "Cannot modify overtime log that has already been processed in payroll",
        data: null,
      };
    }

    // Calculate new amount if needed
    let newAmount = existingLog.amount;
    if (recalculateAmount && existingLog.employee) {
      const hourlyRate = existingLog.employee.hourlyRate || 0;
      const rate = existingLog.rate || 1.25;
      newAmount = hourlyRate * hours * rate;
    }

    // Update hours and amount
    await repo.update(id, {
      hours,
      amount: newAmount,
      updatedAt: new Date(),
    });

    // Get updated record
    const updatedLog = await repo.findOne({
      where: { id },
      relations: ["employee"],
    });

    logger.info(`Overtime hours updated: ID ${id}, New hours: ${hours}`);

    return {
      status: true,
      message: "Overtime hours updated successfully",
      data: updatedLog,
    };
  } catch (error) {
    logger.error(`Error in updateOvertimeHours for ID ${params.id}:`, error);

    return {
      status: false,
      message: error.message || "Failed to update overtime hours",
      data: null,
    };
  }
};
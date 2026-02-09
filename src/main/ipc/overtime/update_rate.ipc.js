// src/ipc/handlers/overtime/update_rate.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Update overtime rate and recalculate amount
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function updateOvertimeRate(params, queryRunner) {
  const repo = queryRunner
    ? queryRunner.manager.getRepository("OvertimeLog")
    : AppDataSource.getRepository("OvertimeLog");

  try {
    const { id, rate, recalculateAmount = true } = params;

    if (!id || typeof id !== "number") {
      return {
        status: false,
        message: "Invalid overtime log ID",
        data: null,
      };
    }

    if (rate === undefined || rate === null || typeof rate !== "number" || rate <= 0) {
      return {
        status: false,
        message: "Invalid rate value. Must be a positive number",
        data: null,
      };
    }

    // Validate common rate multipliers
    const commonRates = [1.25, 1.5, 2.0, 2.5, 3.0];
    if (!commonRates.includes(rate) && rate > 3.0) {
      logger.warn(`Unusual overtime rate ${rate} used for ID ${id}`);
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
      const hours = existingLog.hours || 0;
      newAmount = hourlyRate * hours * rate;
    }

    // Update rate and amount
    await repo.update(id, {
      rate,
      amount: newAmount,
      updatedAt: new Date(),
    });

    // Get updated record
    const updatedLog = await repo.findOne({
      where: { id },
      relations: ["employee"],
    });

    logger.info(`Overtime rate updated: ID ${id}, New rate: ${rate}`);

    return {
      status: true,
      message: "Overtime rate updated successfully",
      data: updatedLog,
    };
  } catch (error) {
    logger.error(`Error in updateOvertimeRate for ID ${params.id}:`, error);

    return {
      status: false,
      message: error.message || "Failed to update overtime rate",
      data: null,
    };
  }
};
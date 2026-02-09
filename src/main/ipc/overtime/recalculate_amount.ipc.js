// src/ipc/handlers/overtime/recalculate_amount.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Recalculate overtime amount based on current employee hourly rate
 * @param {Object} params
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function recalculateOvertimeAmount(params, queryRunner) {
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
        message: "Cannot recalculate amount for overtime log that has already been processed in payroll",
        data: null,
      };
    }

    if (!existingLog.employee) {
      return {
        status: false,
        message: "Employee information not found",
        data: null,
      };
    }

    // Calculate new amount
    const hourlyRate = existingLog.employee.hourlyRate || 0;
    const hours = existingLog.hours || 0;
    const rate = existingLog.rate || 1.25;
    const newAmount = hourlyRate * hours * rate;

    // Update amount
    await repo.update(id, {
      amount: newAmount,
      updatedAt: new Date(),
    });

    // Get updated record
    const updatedLog = await repo.findOne({
      where: { id },
      relations: ["employee"],
    });

    const oldAmount = existingLog.amount;
    const difference = newAmount - oldAmount;

    logger.info(`Overtime amount recalculated: ID ${id}, Old: ${oldAmount}, New: ${newAmount}, Difference: ${difference}`);

    return {
      status: true,
      message: "Overtime amount recalculated successfully",
      data: {
        ...updatedLog,
        recalculation: {
          oldAmount,
          newAmount,
          difference,
          hourlyRate,
          hours,
          rate,
        },
      },
    };
  } catch (error) {
    logger.error(`Error in recalculateOvertimeAmount for ID ${params.id}:`, error);

    return {
      status: false,
      message: error.message || "Failed to recalculate overtime amount",
      data: null,
    };
  }
};
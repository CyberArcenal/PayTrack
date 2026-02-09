// src/ipc/handlers/overtime/update/update.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");
const validateOvertimeData = require("../../validation/validate_data.ipc");
const checkOvertimeOverlap = require("../../validation/check_overlap.ipc");

/**
 * Update an existing overtime log
 * @param {Object} updateData
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function updateOvertimeLog(updateData, queryRunner) {
  const repo = queryRunner
    ? queryRunner.manager.getRepository("OvertimeLog")
    : AppDataSource.getRepository("OvertimeLog");

  try {
    const { id, ...updateFields } = updateData;

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
        message: "Cannot modify overtime log that has already been processed in payroll",
        data: null,
      };
    }

    // Validate update data
    const validationData = { ...existingLog, ...updateFields };
    const validation = validateOvertimeData(validationData);
    if (!validation.isValid) {
      return {
        status: false,
        message: "Overtime data validation failed",
        data: { errors: validation.errors },
      };
    }

    // Check for time overlap (excluding current log)
    if (updateFields.startTime || updateFields.endTime || updateFields.date) {
      const overlapCheck = await checkOvertimeOverlap(
        updateFields.employeeId || existingLog.employeeId,
        updateFields.date || existingLog.date,
        updateFields.startTime || existingLog.startTime,
        updateFields.endTime || existingLog.endTime,
        id // Exclude current log
      );

      if (overlapCheck.hasOverlap) {
        return {
          status: false,
          message: overlapCheck.message,
          data: { overlappingLogs: overlapCheck.overlappingLogs },
        };
      }
    }

    // Recalculate amount if hours, rate, or employee changed
    if (updateFields.hours || updateFields.rate || updateFields.employeeId) {
      const employeeId = updateFields.employeeId || existingLog.employeeId;
      const employeeRepo = queryRunner
        ? queryRunner.manager.getRepository("Employee")
        : AppDataSource.getRepository("Employee");

      const employee = await employeeRepo.findOne({ where: { id: employeeId } });

      if (employee) {
        const hours = updateFields.hours || existingLog.hours;
        const rate = updateFields.rate || existingLog.rate;
        const hourlyRate = employee.hourlyRate || 0;
        updateFields.amount = hourlyRate * hours * rate;
      }
    }

    // Update the log
    await repo.update(id, {
      ...updateFields,
      updatedAt: new Date(),
    });

    // Get updated record
    const updatedLog = await repo.findOne({
      where: { id },
      relations: ["employee", "payrollRecord"],
    });

    logger.info(`Overtime log updated: ID ${id}`);

    return {
      status: true,
      message: "Overtime log updated successfully",
      data: updatedLog,
    };
  } catch (error) {
    logger.error(`Error in updateOvertimeLog for ID ${updateData.id}:`, error);

    return {
      status: false,
      message: error.message || "Failed to update overtime log",
      data: null,
    };
  }
};
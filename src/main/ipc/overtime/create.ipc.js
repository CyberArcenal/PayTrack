// src/ipc/handlers/overtime/create.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");
const validateOvertimeData = require("../validation/validate_data.ipc");
const checkDuplicateOvertime = require("../check_duplicate.ipc");
const checkOvertimeOverlap = require("../validation/check_overlap.ipc");

/**
 * Create a new overtime log
 * @param {Object} overtimeData
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function createOvertimeLog(overtimeData, queryRunner) {
  const repo = queryRunner 
    ? queryRunner.manager.getRepository("OvertimeLog") 
    : AppDataSource.getRepository("OvertimeLog");
  
  const employeeRepo = queryRunner
    ? queryRunner.manager.getRepository("Employee")
    : AppDataSource.getRepository("Employee");

  try {
    // Validate input data
    const validation = validateOvertimeData(overtimeData);
    if (!validation.isValid) {
      return {
        status: false,
        message: "Overtime data validation failed",
        data: { errors: validation.errors },
      };
    }

    // Check if employee exists
    const employee = await employeeRepo.findOne({ 
      where: { id: overtimeData.employeeId } 
    });

    if (!employee) {
      return {
        status: false,
        message: `Employee with ID ${overtimeData.employeeId} not found`,
        data: null,
      };
    }

    // Check for duplicate overtime
    const duplicateCheck = await checkDuplicateOvertime(overtimeData);
    if (duplicateCheck.isDuplicate) {
      return {
        status: false,
        message: duplicateCheck.message,
        data: null,
      };
    }

    // Check for time overlap
    const overlapCheck = await checkOvertimeOverlap(
      overtimeData.employeeId,
      overtimeData.date,
      overtimeData.startTime,
      overtimeData.endTime
    );

    if (overlapCheck.hasOverlap) {
      return {
        status: false,
        message: overlapCheck.message,
        data: { overlappingLogs: overlapCheck.overlappingLogs },
      };
    }

    // Calculate overtime amount
    const hourlyRate = employee.hourlyRate || 0;
    const overtimeRate = overtimeData.rate || 1.25;
    const hours = overtimeData.hours || 0;
    const amount = hourlyRate * hours * overtimeRate;

    // Prepare overtime log entity
    const overtimeLog = repo.create({
      employeeId: overtimeData.employeeId,
      date: overtimeData.date,
      startTime: overtimeData.startTime,
      endTime: overtimeData.endTime,
      hours: overtimeData.hours,
      rate: overtimeData.rate || 1.25,
      amount: overtimeData.amount || amount,
      type: overtimeData.type || "regular",
      approvedBy: overtimeData.approvedBy || null,
      approvalStatus: overtimeData.approvalStatus || "pending",
      note: overtimeData.note || null,
      payrollRecordId: null, // Will be set when processed
    });

    // Save overtime log
    const savedOvertimeLog = await repo.save(overtimeLog);

    logger.info(`Overtime log created: ID ${savedOvertimeLog.id}, Employee: ${employeeId}, Date: ${date}`);

    return {
      status: true,
      message: "Overtime log created successfully",
      data: savedOvertimeLog,
    };
  } catch (error) {
    logger.error("Error in createOvertimeLog:", error);

    let errorMessage = "Failed to create overtime log";
    if (error.code === "SQLITE_CONSTRAINT") {
      if (error.message.includes("FOREIGN KEY")) {
        errorMessage = "Invalid employee ID";
      } else if (error.message.includes("UNIQUE")) {
        errorMessage = "Duplicate overtime record";
      }
    }

    return {
      status: false,
      message: errorMessage,
      data: null,
    };
  }
};
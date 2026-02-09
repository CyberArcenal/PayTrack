// src/ipc/handlers/overtime/check_duplicate.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Check for duplicate overtime log
 * @param {Object} overtimeData
 * @returns {Promise<{isDuplicate: boolean, message: string, duplicateLog: any}>}
 */
module.exports = async function checkDuplicateOvertime(overtimeData) {
  try {
    if (!overtimeData.employeeId || !overtimeData.date) {
      return {
        isDuplicate: false,
        message: "Insufficient data to check for duplicates",
        duplicateLog: null,
      };
    }

    const overtimeLogRepo = AppDataSource.getRepository("OvertimeLog");
    
    // Check for exact duplicates (same employee, date, start and end times)
    const existingLog = await overtimeLogRepo.findOne({
      where: {
        employeeId: overtimeData.employeeId,
        date: overtimeData.date,
        startTime: overtimeData.startTime || undefined,
        endTime: overtimeData.endTime || undefined,
      },
    });

    if (existingLog) {
      return {
        isDuplicate: true,
        message: "Duplicate overtime log found with identical time entries",
        duplicateLog: existingLog,
        details: {
          existingId: existingLog.id,
          existingStatus: existingLog.approvalStatus,
          timeRange: `${existingLog.startTime} - ${existingLog.endTime}`,
        },
      };
    }

    // Check for same-day duplicates (different times)
    const sameDayLogs = await overtimeLogRepo.find({
      where: {
        employeeId: overtimeData.employeeId,
        date: overtimeData.date,
      },
    });

    if (sameDayLogs.length > 0) {
      return {
        isDuplicate: false,
        isSameDay: true,
        message: `Employee already has ${sameDayLogs.length} overtime log(s) on this date`,
        existingLogs: sameDayLogs,
        count: sameDayLogs.length,
      };
    }

    logger.debug(`No duplicate overtime found for employee ${overtimeData.employeeId} on ${overtimeData.date}`);

    return {
      isDuplicate: false,
      message: "No duplicate found",
      duplicateLog: null,
    };
  } catch (error) {
    logger.error("Error in checkDuplicateOvertime:", error);
    
    return {
      isDuplicate: false,
      message: "Error checking for duplicates: " + error.message,
      duplicateLog: null,
    };
  }
};
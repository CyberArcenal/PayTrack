// src/ipc/handlers/overtime/validation/check_overlap.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Check for overlapping overtime logs
 * @param {number} employeeId
 * @param {string} date - YYYY-MM-DD
 * @param {string} startTime - HH:mm
 * @param {string} endTime - HH:mm
 * @param {number} [excludeId] - Overtime log ID to exclude
 * @returns {Promise<{status: boolean, message: string, data: {hasOverlap: boolean, overlappingLogs: any[]}}>}
 */
module.exports = async function checkOvertimeOverlap(employeeId, date, startTime, endTime, excludeId) {
  try {
    // Validate inputs
    if (!employeeId || typeof employeeId !== "number") {
      return {
        status: false,
        message: "Invalid employee ID",
        data: { hasOverlap: false, overlappingLogs: [] },
      };
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return {
        status: false,
        message: "Invalid date format",
        data: { hasOverlap: false, overlappingLogs: [] },
      };
    }

    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return {
        status: false,
        message: "Invalid time format",
        data: { hasOverlap: false, overlappingLogs: [] },
      };
    }

    // Convert times to minutes
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    let endMinutes = endHour * 60 + endMinute;
    
    // Handle overnight
    if (endMinutes < startMinutes) {
      endMinutes += 24 * 60;
    }

    const overtimeLogRepo = AppDataSource.getRepository("OvertimeLog");
    
    // Get existing overtime logs for the employee on that date
    const query = overtimeLogRepo.createQueryBuilder("overtime")
      .where("overtime.employeeId = :employeeId", { employeeId })
      .andWhere("overtime.date = :date", { date });

    if (excludeId) {
      query.andWhere("overtime.id != :excludeId", { excludeId });
    }

    const existingLogs = await query.getMany();

    const overlappingLogs = [];

    // Check each existing log for overlap
    for (const log of existingLogs) {
      const [logStartHour, logStartMinute] = log.startTime.split(":").map(Number);
      const [logEndHour, logEndMinute] = log.endTime.split(":").map(Number);
      
      const logStartMinutes = logStartHour * 60 + logStartMinute;
      let logEndMinutes = logEndHour * 60 + logEndMinute;
      
      // Handle overnight for existing log
      if (logEndMinutes < logStartMinutes) {
        logEndMinutes += 24 * 60;
      }

      // Check for overlap
      const overlap = !(endMinutes <= logStartMinutes || startMinutes >= logEndMinutes);
      
      if (overlap) {
        overlappingLogs.push({
          ...log,
          overlapDetails: {
            newStart: startTime,
            newEnd: endTime,
            existingStart: log.startTime,
            existingEnd: log.endTime,
            overlapMinutes: Math.min(endMinutes, logEndMinutes) - Math.max(startMinutes, logStartMinutes),
          },
        });
      }
    }

    const hasOverlap = overlappingLogs.length > 0;

    if (hasOverlap) {
      logger.warn(`Overtime overlap detected for employee ${employeeId} on ${date}: ${overlappingLogs.length} overlapping logs`);
    }

    return {
      status: true,
      message: hasOverlap ? "Overlap detected" : "No overlap detected",
      data: {
        hasOverlap,
        overlappingLogs,
        count: overlappingLogs.length,
        employeeId,
        date,
        timeRange: `${startTime} - ${endTime}`,
      },
    };
  } catch (error) {
    logger.error(`Error in checkOvertimeOverlap for employee ${employeeId}:`, error);
    
    return {
      status: false,
      message: error.message || "Failed to check overtime overlap",
      data: { hasOverlap: false, overlappingLogs: [] },
    };
  }
};
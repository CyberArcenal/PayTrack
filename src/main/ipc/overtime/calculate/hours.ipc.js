// src/ipc/handlers/overtime/calculate/hours.ipc.js
const { logger } = require("../../../../utils/logger");

/**
 * Calculate overtime hours between start and end times
 * @param {string} startTime - HH:mm format
 * @param {string} endTime - HH:mm format
 * @param {number} [breakHours] - Break duration in hours
 * @returns {Promise<{status: boolean, message: string, data: {hours: number, minutes: number, formatted: string}}>}
 */
module.exports = async function calculateOvertimeHours(startTime, endTime, breakHours = 0) {
  try {
    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return {
        status: false,
        message: "Invalid time format. Use HH:mm (24-hour format)",
        data: null,
      };
    }

    // Parse times
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    // Convert to minutes
    const startTotalMinutes = startHour * 60 + startMinute;
    let endTotalMinutes = endHour * 60 + endMinute;

    // Handle overnight overtime (end time next day)
    if (endTotalMinutes < startTotalMinutes) {
      endTotalMinutes += 24 * 60; // Add 24 hours
    }

    // Calculate total minutes
    let totalMinutes = endTotalMinutes - startTotalMinutes;

    // Subtract break time if provided
    if (breakHours && breakHours > 0) {
      const breakMinutes = breakHours * 60;
      totalMinutes = Math.max(0, totalMinutes - breakMinutes);
    }

    // Convert to hours
    const hours = totalMinutes / 60;
    const minutes = totalMinutes % 60;

    // Format result
    const formatted = hours >= 1 
      ? `${hours.toFixed(2)} hours (${Math.floor(hours)}h ${minutes}m)`
      : `${minutes} minutes`;

    logger.debug(`Calculated overtime: ${startTime} to ${endTime} = ${hours.toFixed(2)} hours`);

    return {
      status: true,
      message: "Overtime hours calculated successfully",
      data: {
        hours: parseFloat(hours.toFixed(2)),
        minutes,
        totalMinutes,
        formatted,
        calculation: {
          startTime,
          endTime,
          breakHours,
          isOvernight: endHour < startHour,
        },
      },
    };
  } catch (error) {
    logger.error(`Error in calculateOvertimeHours: ${startTime} to ${endTime}`, error);
    
    return {
      status: false,
      message: error.message || "Failed to calculate overtime hours",
      data: null,
    };
  }
};
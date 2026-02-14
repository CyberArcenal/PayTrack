// src/main/ipc/attendance/get/all.ipc.js
// @ts-check

const attendanceLogService = require("../../../../services/AttendanceLog");

/**
 * Get all attendance logs with optional filters
 * @param {Object} params - { employeeId, startDate, endDate, status, source, page, limit }
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params = {}) => {
  try {
    // @ts-ignore
    const { employeeId, startDate, endDate, status, source, page, limit } = params;

    // Basic validation (page/limit must be positive if provided)
    if (page !== undefined && (isNaN(page) || page < 1)) {
      return { status: false, message: "Invalid page number", data: null };
    }
    if (limit !== undefined && (isNaN(limit) || limit < 1)) {
      return { status: false, message: "Invalid limit value", data: null };
    }

    const data = await attendanceLogService.findAll({
      employeeId,
      startDate,
      endDate,
      status,
      source,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return {
      status: true,
      message: "Attendance logs retrieved successfully",
      data,
    };
  } catch (error) {
    // @ts-ignore
    console.error("[getAllAttendance] Error:", error.message);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to retrieve attendance logs",
      data: null,
    };
  }
};
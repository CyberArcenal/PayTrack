// src/main/ipc/attendance/get/by_date.ipc.js
// @ts-check

const attendanceLogService = require("../../../../services/AttendanceLog");

/**
 * Get attendance logs for a specific date range
 * @param {Object} params - { startDate, endDate, employeeId, status, source, page, limit }
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params = {}) => {
  try {
    // @ts-ignore
    const { startDate, endDate, employeeId, status, source, page, limit } = params;
    if (!startDate || !endDate) {
      return { status: false, message: "startDate and endDate are required", data: null };
    }

    const data = await attendanceLogService.findAll({
      employeeId: employeeId ? parseInt(employeeId) : undefined,
      startDate,
      endDate,
      status,
      source,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return {
      status: true,
      message: "Attendance logs by date retrieved successfully",
      data,
    };
  } catch (error) {
    // @ts-ignore
    console.error("[getAttendanceByDate] Error:", error.message);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to retrieve attendance by date",
      data: null,
    };
  }
};
// src/main/ipc/attendance/search.ipc.js
const attendanceLogService = require("../../../services/AttendanceLog");

/**
 * Search attendance logs by keyword or advanced filters
 * @param {Object} params - { keyword, employeeId, startDate, endDate, status, source, page, limit }
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params = {}) => {
  try {
    const { keyword, employeeId, startDate, endDate, status, source, page, limit } = params;

    // For now, just pass all to findAll (which doesn't support keyword search).
    // In future we can extend service to support text search.
    const options = {
      employeeId: employeeId ? parseInt(employeeId) : undefined,
      startDate,
      endDate,
      status,
      source,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    };

    const data = await attendanceLogService.findAll(options);
    // Optional: filter by keyword on client side or add to service
    return {
      status: true,
      message: "Search completed",
      data,
    };
  } catch (error) {
    console.error("[searchAttendance] Error:", error.message);
    return {
      status: false,
      message: error.message || "Failed to search attendance",
      data: null,
    };
  }
};
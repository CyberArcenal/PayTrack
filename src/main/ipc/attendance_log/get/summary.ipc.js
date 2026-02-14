// src/main/ipc/attendance/get/summary.ipc.js
const attendanceLogService = require("../../../../services/AttendanceLog");

/**
 * Get attendance summary for an employee over a date range
 * @param {Object} params - { employeeId, startDate, endDate }
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params = {}) => {
  try {
    const { employeeId, startDate, endDate } = params;
    if (!employeeId || isNaN(employeeId)) {
      return { status: false, message: "Valid employee ID is required", data: null };
    }
    if (!startDate || !endDate) {
      return { status: false, message: "startDate and endDate are required", data: null };
    }

    const data = await attendanceLogService.getSummary(
      parseInt(employeeId),
      startDate,
      endDate
    );

    return {
      status: true,
      message: "Attendance summary retrieved successfully",
      data,
    };
  } catch (error) {
    console.error("[getAttendanceSummary] Error:", error.message);
    return {
      status: false,
      message: error.message || "Failed to retrieve attendance summary",
      data: null,
    };
  }
};
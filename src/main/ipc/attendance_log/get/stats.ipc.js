// src/main/ipc/attendance/get/stats.ipc.js
// @ts-check

const attendanceLogService = require("../../../../services/AttendanceLog");

/**
 * Get attendance statistics (e.g., total present, absent, late) for a period.
 * This could be a wrapper around getSummary or a dedicated method.
 * For now we reuse getSummary for a specific employee or return overall stats.
 * @param {Object} params - { employeeId, startDate, endDate }
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params = {}) => {
  try {
    // @ts-ignore
    const { employeeId, startDate, endDate } = params;
    if (!startDate || !endDate) {
      return { status: false, message: "startDate and endDate are required", data: null };
    }

    // If employeeId provided, get summary for that employee; otherwise, we could aggregate all employees.
    // Here we implement a simple version: if employeeId given, return summary; else return a placeholder.
    if (employeeId) {
      const data = await attendanceLogService.getSummary(
        parseInt(employeeId),
        startDate,
        endDate
      );
      return {
        status: true,
        message: "Attendance statistics retrieved",
        data,
      };
    } else {
      // For overall stats, we would need a new service method. Return a placeholder.
      return {
        status: true,
        message: "Overall attendance stats not yet implemented",
        data: { note: "Please provide employeeId for per-employee stats" },
      };
    }
  } catch (error) {
    // @ts-ignore
    console.error("[getAttendanceStats] Error:", error.message);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to retrieve attendance stats",
      data: null,
    };
  }
};
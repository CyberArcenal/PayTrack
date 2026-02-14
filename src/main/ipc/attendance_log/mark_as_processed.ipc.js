// src/main/ipc/attendance/mark_as_processed.ipc.js
const attendanceLogService = require("../../../services/AttendanceLog");

/**
 * Mark multiple attendance logs as processed for a payroll record
 * @param {Object} params - { attendanceIds, payrollRecordId }
 * @param {string} [user="system"]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params = {}, user = "system") => {
  try {
    const { attendanceIds, payrollRecordId } = params;
    if (!attendanceIds || !Array.isArray(attendanceIds) || attendanceIds.length === 0) {
      return { status: false, message: "attendanceIds array is required", data: null };
    }
    if (!payrollRecordId || isNaN(payrollRecordId)) {
      return { status: false, message: "Valid payrollRecordId is required", data: null };
    }

    const numericIds = attendanceIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    if (numericIds.length === 0) {
      return { status: false, message: "No valid attendance IDs provided", data: null };
    }

    const data = await attendanceLogService.markAsProcessed(
      numericIds,
      parseInt(payrollRecordId),
      user
    );

    return {
      status: true,
      message: "Attendance logs marked as processed",
      data,
    };
  } catch (error) {
    console.error("[markAttendanceAsProcessed] Error:", error.message);
    return {
      status: false,
      message: error.message || "Failed to mark attendance as processed",
      data: null,
    };
  }
};
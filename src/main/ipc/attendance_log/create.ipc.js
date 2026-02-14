// src/main/ipc/attendance/create.ipc.js
const attendanceLogService = require("../../../services/AttendanceLog");

/**
 * Create a new attendance log
 * @param {Object} params - { employeeId, timestamp, source, status, hoursWorked, overtimeHours, lateMinutes, note }
 * @param {string} [user="system"] - User performing the action (could be passed from frontend)
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params = {}, user = "system") => {
  try {
    const required = ["employeeId", "timestamp", "status"];
    for (const field of required) {
      if (!params[field]) {
        return { status: false, message: `Missing required field: ${field}`, data: null };
      }
    }

    // Validate employeeId is number
    if (isNaN(params.employeeId)) {
      return { status: false, message: "employeeId must be a number", data: null };
    }

    const data = await attendanceLogService.create(
      {
        employeeId: parseInt(params.employeeId),
        timestamp: new Date(params.timestamp),
        source: params.source || "manual",
        status: params.status,
        hoursWorked: params.hoursWorked ? parseFloat(params.hoursWorked) : undefined,
        overtimeHours: params.overtimeHours ? parseFloat(params.overtimeHours) : undefined,
        lateMinutes: params.lateMinutes ? parseInt(params.lateMinutes) : undefined,
        note: params.note,
      },
      user
    );

    return {
      status: true,
      message: "Attendance log created successfully",
      data,
    };
  } catch (error) {
    console.error("[createAttendance] Error:", error.message);
    return {
      status: false,
      message: error.message || "Failed to create attendance log",
      data: null,
    };
  }
};
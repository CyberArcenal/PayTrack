// src/main/ipc/attendance/update.ipc.js
const attendanceLogService = require("../../../services/AttendanceLog");

/**
 * Update an existing attendance log
 * @param {Object} params - { id, employeeId, timestamp, source, status, hoursWorked, overtimeHours, lateMinutes, note }
 * @param {string} [user="system"]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params = {}, user = "system") => {
  try {
    const { id } = params;
    if (!id || isNaN(id)) {
      return { status: false, message: "Valid attendance ID is required", data: null };
    }

    const data = await attendanceLogService.update(
      parseInt(id),
      {
        employeeId: params.employeeId ? parseInt(params.employeeId) : undefined,
        timestamp: params.timestamp ? new Date(params.timestamp) : undefined,
        source: params.source,
        status: params.status,
        hoursWorked: params.hoursWorked !== undefined ? parseFloat(params.hoursWorked) : undefined,
        overtimeHours: params.overtimeHours !== undefined ? parseFloat(params.overtimeHours) : undefined,
        lateMinutes: params.lateMinutes !== undefined ? parseInt(params.lateMinutes) : undefined,
        note: params.note,
      },
      user
    );

    return {
      status: true,
      message: "Attendance log updated successfully",
      data,
    };
  } catch (error) {
    console.error("[updateAttendance] Error:", error.message);
    return {
      status: false,
      message: error.message || "Failed to update attendance log",
      data: null,
    };
  }
};
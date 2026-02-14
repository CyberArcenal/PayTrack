// src/main/ipc/attendance/delete.ipc.js
const attendanceLogService = require("../../../services/AttendanceLog");

/**
 * Delete an attendance log
 * @param {Object} params - { id }
 * @param {string} [user="system"]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params = {}, user = "system") => {
  try {
    const { id } = params;
    if (!id || isNaN(id)) {
      return { status: false, message: "Valid attendance ID is required", data: null };
    }

    const result = await attendanceLogService.delete(parseInt(id), user);
    return {
      status: true,
      message: "Attendance log deleted successfully",
      data: result,
    };
  } catch (error) {
    console.error("[deleteAttendance] Error:", error.message);
    return {
      status: false,
      message: error.message || "Failed to delete attendance log",
      data: null,
    };
  }
};
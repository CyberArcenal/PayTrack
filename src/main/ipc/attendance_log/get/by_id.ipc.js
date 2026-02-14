// src/main/ipc/attendance/get/by_id.ipc.js
// @ts-check

const attendanceLogService = require("../../../../services/AttendanceLog");

/**
 * Get a single attendance log by ID
 * @param {Object} params - { id }
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params = {}) => {
  try {
    // @ts-ignore
    const { id } = params;
    if (!id || isNaN(id)) {
      return { status: false, message: "Valid attendance ID is required", data: null };
    }

    const data = await attendanceLogService.findById(parseInt(id));
    return {
      status: true,
      message: "Attendance log retrieved successfully",
      data,
    };
  } catch (error) {
    // @ts-ignore
    console.error("[getAttendanceById] Error:", error.message);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to retrieve attendance log",
      data: null,
    };
  }
};
// src/main/ipc/attendance/get/by_employee.ipc.js
// @ts-check

const attendanceLogService = require("../../../../services/AttendanceLog");

/**
 * Get attendance logs for a specific employee
 * @param {Object} params - { employeeId, startDate, endDate, status, source, page, limit }
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params = {}) => {
  try {
    // @ts-ignore
    const { employeeId, startDate, endDate, status, source, page, limit } = params;
    if (!employeeId || isNaN(employeeId)) {
      return { status: false, message: "Valid employee ID is required", data: null };
    }

    const data = await attendanceLogService.findAll({
      employeeId: parseInt(employeeId),
      startDate,
      endDate,
      status,
      source,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return {
      status: true,
      message: "Employee attendance logs retrieved successfully",
      data,
    };
  } catch (error) {
    // @ts-ignore
    console.error("[getAttendanceByEmployee] Error:", error.message);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to retrieve employee attendance",
      data: null,
    };
  }
};
// src/main/ipc/attendance/get/for_payroll.ipc.js
// @ts-check

const attendanceLogService = require("../../../../services/AttendanceLog");

/**
 * Get attendance logs that are eligible for a payroll period (usually not yet processed)
 * @param {Object} params - { employeeId, startDate, endDate, processed (optional) }
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params = {}) => {
  try {
    // @ts-ignore
    const { employeeId, startDate, endDate, processed } = params;
    if (!employeeId || isNaN(employeeId)) {
      return { status: false, message: "Valid employee ID is required", data: null };
    }
    if (!startDate || !endDate) {
      return { status: false, message: "startDate and endDate are required", data: null };
    }

    // Use findAll with payrollRecordId filter if needed.
    // processed = false => find where payrollRecordId IS NULL
    const options = {
      employeeId: parseInt(employeeId),
      startDate,
      endDate,
    };
    if (processed === false) {
      // @ts-ignore
      options.payrollRecordId = null; // Note: service must support this filter
    }

    const data = await attendanceLogService.findAll(options);
    return {
      status: true,
      message: "Attendance logs for payroll retrieved",
      data,
    };
  } catch (error) {
    // @ts-ignore
    console.error("[getAttendanceForPayroll] Error:", error.message);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to retrieve attendance for payroll",
      data: null,
    };
  }
};
// src/main/ipc/attendance/export_csv.ipc.js
const attendanceLogService = require("../../../services/AttendanceLog");

/**
 * Export attendance logs to CSV
 * @param {Object} params - { employeeId, startDate, endDate, status, source }
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params = {}) => {
  try {
    // Fetch data first
    const { employeeId, startDate, endDate, status, source } = params;
    const options = {
      employeeId: employeeId ? parseInt(employeeId) : undefined,
      startDate,
      endDate,
      status,
      source,
    };
    const logs = await attendanceLogService.findAll(options);

    // Convert to CSV string (simple implementation)
    if (!logs || logs.length === 0) {
      return { status: true, message: "No data to export", data: null };
    }

    const headers = ["ID", "Employee ID", "Timestamp", "Source", "Status", "Hours Worked", "Overtime", "Late Minutes", "Note"];
    const rows = logs.map(log => [
      log.id,
      log.employeeId,
      log.timestamp,
      log.source,
      log.status,
      log.hoursWorked,
      log.overtimeHours,
      log.lateMinutes,
      log.note || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    return {
      status: true,
      message: "CSV generated",
      data: { csv: csvContent, filename: `attendance_${Date.now()}.csv` },
    };
  } catch (error) {
    console.error("[exportAttendanceToCSV] Error:", error.message);
    return {
      status: false,
      message: error.message || "Failed to export CSV",
      data: null,
    };
  }
};
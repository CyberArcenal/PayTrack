// src/main/ipc/attendance/bulk_create.ipc.js
const attendanceLogService = require("../../../services/AttendanceLog");

/**
 * Create multiple attendance logs in bulk
 * @param {Object} params - { records: Array<{ employeeId, timestamp, source, status, ... }> }
 * @param {string} [user="system"]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params = {}, user = "system") => {
  try {
    const { records } = params;
    if (!records || !Array.isArray(records) || records.length === 0) {
      return { status: false, message: "records array is required", data: null };
    }

    // Since the service doesn't have a bulkCreate, we loop and call create.
    // For robustness, we could wrap in transaction, but for simplicity we do sequential.
    const results = [];
    const errors = [];

    for (const record of records) {
      try {
        // Basic validation per record (optional, could rely on service validation)
        if (!record.employeeId || !record.timestamp || !record.status) {
          errors.push({ record, error: "Missing required fields" });
          continue;
        }
        const created = await attendanceLogService.create(
          {
            employeeId: parseInt(record.employeeId),
            timestamp: new Date(record.timestamp),
            source: record.source || "manual",
            status: record.status,
            hoursWorked: record.hoursWorked ? parseFloat(record.hoursWorked) : undefined,
            overtimeHours: record.overtimeHours ? parseFloat(record.overtimeHours) : undefined,
            lateMinutes: record.lateMinutes ? parseInt(record.lateMinutes) : undefined,
            note: record.note,
          },
          user
        );
        results.push(created);
      } catch (err) {
        errors.push({ record, error: err.message });
      }
    }

    return {
      status: true,
      message: `Bulk create completed: ${results.length} succeeded, ${errors.length} failed`,
      data: { created: results, errors },
    };
  } catch (error) {
    console.error("[bulkCreateAttendance] Error:", error.message);
    return {
      status: false,
      message: error.message || "Failed to bulk create attendance",
      data: null,
    };
  }
};
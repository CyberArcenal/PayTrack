// src/utils/attendanceUtils.js
/**
 * Validate attendance data before create/update
 * @param {Object} data
 * @returns {Promise<{valid: boolean, errors: string[]}>}
 */
async function validateAttendanceData(data) {
  const errors = [];
  if (!data.employeeId) errors.push("employeeId is required");
  if (!data.timestamp) errors.push("timestamp is required");
  if (data.timestamp && isNaN(new Date(data.timestamp).getTime())) {
    errors.push("timestamp must be a valid date");
  }
  if (data.status && !["present", "absent", "late", "half-day", "holiday", "leave"].includes(data.status)) {
    errors.push("status must be one of: present, absent, late, half-day, holiday, leave");
  }
  if (data.hoursWorked !== undefined && (isNaN(data.hoursWorked) || data.hoursWorked < 0)) {
    errors.push("hoursWorked must be a non-negative number");
  }
  if (data.overtimeHours !== undefined && (isNaN(data.overtimeHours) || data.overtimeHours < 0)) {
    errors.push("overtimeHours must be a non-negative number");
  }
  if (data.lateMinutes !== undefined && (!Number.isInteger(data.lateMinutes) || data.lateMinutes < 0)) {
    errors.push("lateMinutes must be a non-negative integer");
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Calculate hours worked based on clock in/out times (if available)
 * @param {Date} clockIn
 * @param {Date} clockOut
 * @param {number} regularHoursPerDay
 * @returns {number}
 */
function calculateHoursWorked(clockIn, clockOut, regularHoursPerDay = 8) {
  if (!clockIn || !clockOut) return 0;
  const diffMs = clockOut - clockIn;
  const diffHours = diffMs / (1000 * 60 * 60);
  return Math.max(0, Math.min(diffHours, 24));
}

/**
 * Calculate overtime hours (exceeding regular hours)
 * @param {number} totalHours
 * @param {number} regularHours
 * @returns {number}
 */
function calculateOvertime(totalHours, regularHours = 8) {
  return Math.max(0, totalHours - regularHours);
}

module.exports = {
  validateAttendanceData,
  calculateHoursWorked,
  calculateOvertime,
};
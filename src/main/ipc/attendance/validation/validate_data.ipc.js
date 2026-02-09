// src/main/ipc/attendance/validation/validate_data.ipc.js
module.exports = async function validateAttendanceData(params) {
  try {
    const { employeeId, timestamp, status, hoursWorked, overtimeHours } = params;
    const errors = [];

    if (!employeeId || isNaN(employeeId)) {
      errors.push("Valid employeeId is required");
    }

    if (!timestamp || isNaN(new Date(timestamp).getTime())) {
      errors.push("Valid timestamp is required");
    }

    if (status && !["present", "absent", "late", "half-day", "leave", "holiday"].includes(status)) {
      errors.push("Invalid status value");
    }

    if (hoursWorked && (isNaN(hoursWorked) || hoursWorked < 0 || hoursWorked > 24)) {
      errors.push("hoursWorked must be between 0 and 24");
    }

    if (overtimeHours && (isNaN(overtimeHours) || overtimeHours < 0)) {
      errors.push("overtimeHours must be a non-negative number");
    }

    return {
      status: errors.length === 0,
      message: errors.length === 0 ? "Data is valid" : "Validation failed",
      data: { errors, isValid: errors.length === 0 },
    };
  } catch (error) {
    console.error("Error validating attendance data:", error);
    return {
      status: false,
      message: error.message || "Validation error",
      data: null,
    };
  }
};
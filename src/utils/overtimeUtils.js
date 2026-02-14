// src/utils/overtimeUtils.js
/**
 * Validate overtime data before create/update
 * @param {Object} data - Overtime data
 * @param {import('typeorm').Repository} employeeRepo - Employee repository for existence check
 * @returns {Promise<{valid: boolean, errors: string[]}>}
 */
async function validateOvertimeData(data, employeeRepo) {
  const errors = [];

  // Required fields
  if (!data.employeeId) errors.push("employeeId is required");
  if (!data.date) errors.push("date is required");
  if (!data.startTime) errors.push("startTime is required");
  if (!data.endTime) errors.push("endTime is required");

  // Date validation
  if (data.date && isNaN(new Date(data.date).getTime())) {
    errors.push("date must be a valid date");
  }

  // Time validation (format HH:MM:SS or HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  if (data.startTime && !timeRegex.test(data.startTime)) {
    errors.push("startTime must be in HH:MM or HH:MM:SS format");
  }
  if (data.endTime && !timeRegex.test(data.endTime)) {
    errors.push("endTime must be in HH:MM or HH:MM:SS format");
  }

  // Type validation
  const allowedTypes = ["regular", "holiday", "special-holiday", "rest-day"];
  if (data.type && !allowedTypes.includes(data.type)) {
    errors.push(`type must be one of: ${allowedTypes.join(", ")}`);
  }

  // Rate validation
  if (data.rate !== undefined && (isNaN(data.rate) || data.rate < 1)) {
    errors.push("rate must be a number >= 1");
  }

  // Approval status validation (if provided)
  const allowedStatuses = ["pending", "approved", "rejected"];
  if (data.approvalStatus && !allowedStatuses.includes(data.approvalStatus)) {
    errors.push(`approvalStatus must be one of: ${allowedStatuses.join(", ")}`);
  }

  // Check if employee exists
  if (data.employeeId) {
    const employee = await employeeRepo.findOne({ where: { id: data.employeeId } });
    if (!employee) {
      errors.push(`Employee with ID ${data.employeeId} not found`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Calculate overtime amount based on employee's hourly rate
 * @param {Object} employee - Employee entity (must have hourlyRate)
 * @param {number} hours - Overtime hours
 * @param {number} rateMultiplier - Overtime rate multiplier (e.g., 1.25)
 * @returns {Promise<number>}
 */
async function calculateOvertimeAmount(employee, hours, rateMultiplier) {
  const hourlyRate = parseFloat(employee.hourlyRate) || 0;
  return parseFloat((hourlyRate * hours * rateMultiplier).toFixed(2));
}

module.exports = {
  validateOvertimeData,
  calculateOvertimeAmount,
};
// ===================== validate_data.ipc.js =====================

/**
 * Validate employee data
 * @param {Object} employeeData
 * @returns {{isValid: boolean, errors: string[]}}
 */
module.exports = function validateEmployeeData(employeeData) {
  const errors = [];

  // Required fields
  if (!employeeData.firstName?.trim()) {
    errors.push("First name is required");
  }
  if (!employeeData.lastName?.trim()) {
    errors.push("Last name is required");
  }
  if (!employeeData.employeeNumber?.trim()) {
    errors.push("Employee number is required");
  }
  if (!employeeData.hireDate) {
    errors.push("Hire date is required");
  }

  // Email validation
  if (employeeData.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(employeeData.email)) {
      errors.push("Invalid email format");
    }
  }

  // Date validation
  if (employeeData.birthDate) {
    const birthDate = new Date(employeeData.birthDate);
    if (birthDate > new Date()) {
      errors.push("Birth date cannot be in the future");
    }
  }

  if (employeeData.hireDate) {
    const hireDate = new Date(employeeData.hireDate);
    if (hireDate > new Date()) {
      errors.push("Hire date cannot be in the future");
    }
  }

  // Salary validation
  if (employeeData.basePay !== undefined) {
    const basePay = parseFloat(employeeData.basePay);
    if (isNaN(basePay) || basePay < 0) {
      errors.push("Base pay must be a positive number");
    }
  }

  // Status validation
  const validStatuses = ["active", "inactive", "terminated", "on-leave"];
  if (employeeData.status && !validStatuses.includes(employeeData.status)) {
    errors.push(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }

  // Employment type validation
  const validEmploymentTypes = ["regular", "contractual", "part-time", "probationary"];
  if (employeeData.employmentType && !validEmploymentTypes.includes(employeeData.employmentType)) {
    errors.push(`Invalid employment type. Must be one of: ${validEmploymentTypes.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
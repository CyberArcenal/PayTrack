// src/utils/employeeUtils.js
/**
 * Validate employee data before create/update
 * @param {Object} data - Employee data
 * @param {import('typeorm').Repository} employeeRepo - Employee repository for uniqueness checks
 * @param {number} excludeId - ID to exclude when checking uniqueness (for updates)
 * @returns {Promise<{valid: boolean, errors: string[]}>}
 */
async function validateEmployeeData(data, employeeRepo, excludeId = null) {
  const errors = [];

  // Required fields
  if (!data.firstName) errors.push("firstName is required");
  if (!data.lastName) errors.push("lastName is required");
  if (!data.hireDate) errors.push("hireDate is required");

  // Employee number uniqueness
  if (data.employeeNumber) {
    const query = employeeRepo.createQueryBuilder("employee")
      .where("employee.employeeNumber = :employeeNumber", { employeeNumber: data.employeeNumber });
    if (excludeId) {
      query.andWhere("employee.id != :id", { id: excludeId });
    }
    const existing = await query.getOne();
    if (existing) {
      errors.push(`Employee number ${data.employeeNumber} is already in use`);
    }
  }

  // Email uniqueness if provided
  if (data.email) {
    const query = employeeRepo.createQueryBuilder("employee")
      .where("employee.email = :email", { email: data.email });
    if (excludeId) {
      query.andWhere("employee.id != :id", { id: excludeId });
    }
    const existing = await query.getOne();
    if (existing) {
      errors.push(`Email ${data.email} is already in use`);
    }
  }

  // Validate dates
  if (data.birthDate && isNaN(new Date(data.birthDate).getTime())) {
    errors.push("birthDate must be a valid date");
  }
  if (data.hireDate && isNaN(new Date(data.hireDate).getTime())) {
    errors.push("hireDate must be a valid date");
  }

  // Validate numbers
  if (data.basePay !== undefined && (isNaN(data.basePay) || data.basePay < 0)) {
    errors.push("basePay must be a non-negative number");
  }
  if (data.dailyRate !== undefined && (isNaN(data.dailyRate) || data.dailyRate < 0)) {
    errors.push("dailyRate must be a non-negative number");
  }
  if (data.hourlyRate !== undefined && (isNaN(data.hourlyRate) || data.hourlyRate < 0)) {
    errors.push("hourlyRate must be a non-negative number");
  }
  if (data.overtimeRate !== undefined && (isNaN(data.overtimeRate) || data.overtimeRate < 1)) {
    errors.push("overtimeRate must be a number >= 1");
  }

  // Validate status and employmentType against allowed values
  const allowedStatuses = ["active", "inactive", "terminated", "on-leave"];
  if (data.status && !allowedStatuses.includes(data.status)) {
    errors.push(`status must be one of: ${allowedStatuses.join(", ")}`);
  }

  const allowedEmploymentTypes = ["regular", "contractual", "part-time", "probationary"];
  if (data.employmentType && !allowedEmploymentTypes.includes(data.employmentType)) {
    errors.push(`employmentType must be one of: ${allowedEmploymentTypes.join(", ")}`);
  }

  const allowedPaymentMethods = ["bank", "cash", "check"];
  if (data.paymentMethod && !allowedPaymentMethods.includes(data.paymentMethod)) {
    errors.push(`paymentMethod must be one of: ${allowedPaymentMethods.join(", ")}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Generate a unique employee number
 * @param {import('typeorm').Repository} employeeRepo
 * @returns {Promise<string>}
 */
async function generateEmployeeNumber(employeeRepo) {
  const prefix = "EMP";
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, "0");

  // Get count of employees created this month to generate sequential number
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23, 59, 59, 999);

  const count = await employeeRepo
    .createQueryBuilder("employee")
    .where("employee.createdAt BETWEEN :start AND :end", { start: startOfMonth, end: endOfMonth })
    .getCount();

  const sequential = (count + 1).toString().padStart(4, "0");
  return `${prefix}${year}${month}${sequential}`;
}

module.exports = {
  validateEmployeeData,
  generateEmployeeNumber,
};
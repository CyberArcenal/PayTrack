// src/ipc/handlers/payroll-record/validation/validate_data.ipc.js
// @ts-check
const { logger } = require("../../../../utils/logger");

/**
 * Validate payroll record data
 * @param {Object} data - Payroll record data to validate
 */
async function validatePayrollRecordData(data) {
  try {
    const errors = [];
    const validatedData = { ...data };

    // Required field validation
    if (!validatedData.employeeId || isNaN(validatedData.employeeId)) {
      errors.push("Valid Employee ID is required");
    }

    if (!validatedData.periodId || isNaN(validatedData.periodId)) {
      errors.push("Valid Period ID is required");
    }

    // Numeric field validation
    const numericFields = [
      "daysPresent",
      "daysAbsent",
      "daysLate",
      "daysHalfDay",
      "basicPay",
      "overtimeHours",
      "overtimePay",
      "holidayPay",
      "nightDiffPay",
      "allowance",
      "bonus",
      "grossPay",
      "sssDeduction",
      "philhealthDeduction",
      "pagibigDeduction",
      "taxDeduction",
      "loanDeduction",
      "advanceDeduction",
      "otherDeductions",
      "deductionsTotal",
      "netPay",
    ];

    numericFields.forEach((field) => {
      if (validatedData[field] !== undefined && validatedData[field] !== null) {
        const numValue = parseFloat(validatedData[field]);
        if (isNaN(numValue) || numValue < 0) {
          errors.push(`${field} must be a positive number`);
        } else {
          validatedData[field] = numValue;
        }
      }
    });

    // Payment status validation
    const validStatuses = ["unpaid", "paid", "partially-paid", "cancelled"];
    if (
      validatedData.paymentStatus &&
      !validStatuses.includes(validatedData.paymentStatus)
    ) {
      errors.push(`paymentStatus must be one of: ${validStatuses.join(", ")}`);
    }

    // Date validation
    if (validatedData.computedAt) {
      const date = new Date(validatedData.computedAt);
      if (isNaN(date.getTime())) {
        errors.push("computedAt must be a valid date");
      } else {
        validatedData.computedAt = date;
      }
    }

    if (validatedData.paidAt) {
      const date = new Date(validatedData.paidAt);
      if (isNaN(date.getTime())) {
        errors.push("paidAt must be a valid date");
      } else {
        validatedData.paidAt = date;
      }
    }

    // Business logic validation
    if (
      validatedData.grossPay !== undefined &&
      validatedData.deductionsTotal !== undefined &&
      validatedData.netPay !== undefined
    ) {
      const expectedNet =
        validatedData.grossPay - validatedData.deductionsTotal;
      const diff = Math.abs(expectedNet - validatedData.netPay);

      if (diff > 0.01) {
        // Allow small floating point differences
        errors.push(
          `Net pay calculation mismatch. Expected: ${expectedNet}, Actual: ${validatedData.netPay}`,
        );
      }
    }

    // Payment reference validation
    if (
      validatedData.paymentReference &&
      validatedData.paymentReference.length > 100
    ) {
      errors.push("paymentReference cannot exceed 100 characters");
    }

    // Remarks validation
    if (validatedData.remarks && validatedData.remarks.length > 1000) {
      errors.push("remarks cannot exceed 1000 characters");
    }

    if (errors.length > 0) {
      return {
        status: false,
        message: "Validation failed",
        errors,
        data: null,
      };
    }

    return {
      status: true,
      message: "Data validation passed",
      errors: [],
      data: validatedData,
    };
  } catch (error) {
    logger.error("Failed to validate payroll record data:", error);
    return {
      status: false,
      message: `Validation error: ${error.message}`,
      errors: [error.message],
      data: null,
    };
  }
}

module.exports = validatePayrollRecordData;

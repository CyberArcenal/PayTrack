// src/ipc/handlers/payroll-period/validation/validate_dates.ipc.js
const { logger } = require("../../../../utils/logger");

/**
 * Validate period dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @param {Date|string} payDate - Pay date
 * @returns {Promise<Object>} Validation result
 */
module.exports = async function validatePeriodDates(startDate, endDate, payDate) {
  try {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      dates: {}
    };
    
    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const pay = new Date(payDate);
    
    // Check if dates are valid
    if (isNaN(start.getTime())) {
      validation.isValid = false;
      validation.errors.push("Invalid start date");
    } else {
      validation.dates.startDate = start;
    }
    
    if (isNaN(end.getTime())) {
      validation.isValid = false;
      validation.errors.push("Invalid end date");
    } else {
      validation.dates.endDate = end;
    }
    
    if (isNaN(pay.getTime())) {
      validation.isValid = false;
      validation.errors.push("Invalid pay date");
    } else {
      validation.dates.payDate = pay;
    }
    
    // If any dates are invalid, return early
    if (!validation.isValid) {
      return {
        status: true,
        message: "Date validation failed",
        data: validation
      };
    }
    
    // Check date order
    if (start > end) {
      validation.isValid = false;
      validation.errors.push("Start date cannot be after end date");
    }
    
    if (pay < end) {
      validation.isValid = false;
      validation.errors.push("Pay date should be on or after end date");
    }
    
    // Calculate duration
    const durationInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    
    validation.duration = {
      days: durationInDays,
      weeks: Math.ceil(durationInDays / 7),
      months: Math.ceil(durationInDays / 30)
    };
    
    // Check for reasonable duration based on period type
    if (durationInDays < 1) {
      validation.warnings.push("Duration is less than 1 day");
    }
    
    if (durationInDays > 31) {
      validation.warnings.push("Duration exceeds 31 days - consider splitting into multiple periods");
    }
    
    // Check if pay date is reasonable (not too far in the future)
    const today = new Date();
    const daysUntilPay = Math.ceil((pay - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilPay < 0) {
      validation.warnings.push("Pay date is in the past");
    } else if (daysUntilPay > 30) {
      validation.warnings.push("Pay date is more than 30 days in the future");
    }
    
    // Check if period is in the future
    if (start > today) {
      validation.warnings.push("Period starts in the future");
    }
    
    if (end < today) {
      validation.warnings.push("Period has already ended");
    }
    
    // Add formatted dates for display
    validation.formattedDates = {
      startDate: start.toLocaleDateString(),
      endDate: end.toLocaleDateString(),
      payDate: pay.toLocaleDateString(),
      startISO: start.toISOString().split('T')[0],
      endISO: end.toISOString().split('T')[0],
      payISO: pay.toISOString().split('T')[0]
    };
    
    logger?.info(`Validated dates: ${validation.isValid ? 'VALID' : 'INVALID'}`);
    
    return {
      status: true,
      message: validation.isValid ? "Date validation passed" : "Date validation failed",
      data: validation
    };
  } catch (error) {
    logger?.error("Error in validatePeriodDates:", error);
    return {
      status: false,
      message: `Failed to validate dates: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};
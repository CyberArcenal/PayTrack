// src/ipc/handlers/payroll-period/validation/validate_data.ipc.js
const { logger } = require("../../../../utils/logger");

/**
 * Validate payroll period data
 * @param {Object} periodData - Payroll period data to validate
 * @returns {Promise<Object>} Validation result
 */
module.exports = async function validatePayrollPeriodData(periodData) {
  try {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      validatedData: {}
    };
    
    // Validate required fields
    const requiredFields = ['startDate', 'endDate', 'payDate', 'periodType'];
    const missingFields = requiredFields.filter(field => !periodData[field]);
    
    if (missingFields.length > 0) {
      validation.isValid = false;
      validation.errors.push(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate dates
    if (periodData.startDate) {
      const startDate = new Date(periodData.startDate);
      if (isNaN(startDate.getTime())) {
        validation.isValid = false;
        validation.errors.push("Invalid start date format");
      } else {
        validation.validatedData.startDate = startDate;
      }
    }
    
    if (periodData.endDate) {
      const endDate = new Date(periodData.endDate);
      if (isNaN(endDate.getTime())) {
        validation.isValid = false;
        validation.errors.push("Invalid end date format");
      } else {
        validation.validatedData.endDate = endDate;
      }
    }
    
    if (periodData.payDate) {
      const payDate = new Date(periodData.payDate);
      if (isNaN(payDate.getTime())) {
        validation.isValid = false;
        validation.errors.push("Invalid pay date format");
      } else {
        validation.validatedData.payDate = payDate;
      }
    }
    
    // Validate date consistency if all dates are valid
    if (validation.validatedData.startDate && validation.validatedData.endDate) {
      if (validation.validatedData.startDate > validation.validatedData.endDate) {
        validation.isValid = false;
        validation.errors.push("Start date cannot be after end date");
      }
    }
    
    if (validation.validatedData.payDate && validation.validatedData.endDate) {
      if (validation.validatedData.payDate < validation.validatedData.endDate) {
        validation.isValid = false;
        validation.errors.push("Pay date should be on or after end date");
      }
    }
    
    // Validate period type
    if (periodData.periodType) {
      const validPeriodTypes = ['weekly', 'bi-weekly', 'semi-monthly', 'monthly'];
      if (!validPeriodTypes.includes(periodData.periodType)) {
        validation.isValid = false;
        validation.errors.push(`Invalid period type. Valid values: ${validPeriodTypes.join(', ')}`);
      } else {
        validation.validatedData.periodType = periodData.periodType;
      }
    }
    
    // Validate status
    if (periodData.status) {
      const validStatuses = ['open', 'processing', 'locked', 'closed'];
      if (!validStatuses.includes(periodData.status)) {
        validation.isValid = false;
        validation.errors.push(`Invalid status. Valid values: ${validStatuses.join(', ')}`);
      } else {
        validation.validatedData.status = periodData.status;
      }
    }
    
    // Validate working days
    if (periodData.workingDays !== undefined) {
      const workingDays = parseInt(periodData.workingDays);
      if (isNaN(workingDays) || workingDays < 0) {
        validation.warnings.push("Working days should be a positive number");
      } else {
        validation.validatedData.workingDays = workingDays;
      }
    }
    
    // Validate numeric fields
    const numericFields = ['totalEmployees', 'totalGrossPay', 'totalDeductions', 'totalNetPay'];
    numericFields.forEach(field => {
      if (periodData[field] !== undefined) {
        const value = parseFloat(periodData[field]);
        if (isNaN(value) || value < 0) {
          validation.warnings.push(`${field} should be a non-negative number`);
        } else {
          validation.validatedData[field] = value;
        }
      }
    });
    
    // Validate name length
    if (periodData.name && periodData.name.length > 100) {
      validation.warnings.push("Period name should be 100 characters or less");
    }
    
    logger?.info(`Validated payroll period data: ${validation.isValid ? 'VALID' : 'INVALID'}`);
    
    return {
      status: true,
      message: validation.isValid ? "Data validation passed" : "Data validation failed",
      data: validation
    };
  } catch (error) {
    logger?.error("Error in validatePayrollPeriodData:", error);
    return {
      status: false,
      message: `Failed to validate data: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};
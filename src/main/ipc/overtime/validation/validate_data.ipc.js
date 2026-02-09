// src/ipc/handlers/overtime/validation/validate_data.ipc.js
const { logger } = require("../../../../utils/logger");

/**
 * Validate overtime data
 * @param {Object} overtimeData
 * @returns {{isValid: boolean, errors: string[]}}
 */
module.exports = function validateOvertimeData(overtimeData) {
  const errors = [];

  try {
    // Required fields
    const requiredFields = ['employeeId', 'date', 'startTime', 'endTime', 'hours'];
    requiredFields.forEach(field => {
      if (!overtimeData[field] && overtimeData[field] !== 0) {
        errors.push(`${field} is required`);
      }
    });

    // Validate employeeId
    if (overtimeData.employeeId && (typeof overtimeData.employeeId !== 'number' || overtimeData.employeeId <= 0)) {
      errors.push('employeeId must be a positive number');
    }

    // Validate date format
    if (overtimeData.date && !/^\d{4}-\d{2}-\d{2}$/.test(overtimeData.date)) {
      errors.push('date must be in YYYY-MM-DD format');
    } else if (overtimeData.date) {
      const dateObj = new Date(overtimeData.date);
      if (isNaN(dateObj.getTime())) {
        errors.push('date is invalid');
      }
    }

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (overtimeData.startTime && !timeRegex.test(overtimeData.startTime)) {
      errors.push('startTime must be in HH:mm format (24-hour)');
    }
    if (overtimeData.endTime && !timeRegex.test(overtimeData.endTime)) {
      errors.push('endTime must be in HH:mm format (24-hour)');
    }

    // Validate times make sense
    if (overtimeData.startTime && overtimeData.endTime) {
      const [startHour] = overtimeData.startTime.split(':').map(Number);
      const [endHour] = overtimeData.endTime.split(':').map(Number);
      
      // Allow overnight (end time next day)
      if (endHour < startHour) {
        // Overnight is valid, but log it
        logger.debug('Overnight overtime detected');
      }
    }

    // Validate hours
    if (overtimeData.hours !== undefined && overtimeData.hours !== null) {
      const hours = parseFloat(overtimeData.hours);
      if (isNaN(hours) || hours < 0) {
        errors.push('hours must be a non-negative number');
      } else if (hours > 24) {
        errors.push('hours cannot exceed 24');
      }
    }

    // Validate rate
    if (overtimeData.rate !== undefined && overtimeData.rate !== null) {
      const rate = parseFloat(overtimeData.rate);
      if (isNaN(rate) || rate < 1) {
        errors.push('rate must be at least 1.0');
      } else if (rate > 5) {
        errors.push('rate cannot exceed 5.0');
      }
    }

    // Validate amount
    if (overtimeData.amount !== undefined && overtimeData.amount !== null) {
      const amount = parseFloat(overtimeData.amount);
      if (isNaN(amount) || amount < 0) {
        errors.push('amount must be a non-negative number');
      }
    }

    // Validate type
    const validTypes = ['regular', 'holiday', 'special-holiday', 'rest-day'];
    if (overtimeData.type && !validTypes.includes(overtimeData.type)) {
      errors.push(`type must be one of: ${validTypes.join(', ')}`);
    }

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (overtimeData.approvalStatus && !validStatuses.includes(overtimeData.approvalStatus)) {
      errors.push(`approvalStatus must be one of: ${validStatuses.join(', ')}`);
    }

    // Validate note length
    if (overtimeData.note && overtimeData.note.length > 1000) {
      errors.push('note cannot exceed 1000 characters');
    }

    // Validate approvedBy length
    if (overtimeData.approvedBy && overtimeData.approvedBy.length > 100) {
      errors.push('approvedBy cannot exceed 100 characters');
    }

    // Check date is not in future (with some tolerance for timezone)
    if (overtimeData.date) {
      const today = new Date();
      const inputDate = new Date(overtimeData.date);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (inputDate > tomorrow) {
        errors.push('date cannot be in the future');
      }
    }

    logger.debug(`Overtime data validation: ${errors.length} errors`);

    return {
      isValid: errors.length === 0,
      errors,
    };
  } catch (error) {
    logger.error('Error in validateOvertimeData:', error);
    return {
      isValid: false,
      errors: ['Validation error: ' + error.message],
    };
  }
};
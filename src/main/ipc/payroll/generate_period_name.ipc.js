// src/ipc/handlers/payroll-period/generate_period_name.ipc.js
const { logger } = require("../../../utils/logger");

/**
 * Generate a period name based on type and dates
 * @param {string} periodType - Period type
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Promise<Object>} Response object
 */
module.exports = async function generatePeriodName(periodType, startDate, endDate) {
  try {
    // Validate inputs
    const validPeriodTypes = ['weekly', 'bi-weekly', 'semi-monthly', 'monthly'];
    
    if (!validPeriodTypes.includes(periodType)) {
      return {
        status: false,
        message: `Invalid period type. Valid values: ${validPeriodTypes.join(', ')}`,
        data: null
      };
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        status: false,
        message: "Invalid dates provided",
        data: null
      };
    }
    
    if (start > end) {
      return {
        status: false,
        message: "Start date cannot be after end date",
        data: null
      };
    }
    
    let periodName = "";
    
    // Format dates
    const startMonth = start.toLocaleString('default', { month: 'long' });
    const startYear = start.getFullYear();
    const startDay = start.getDate();
    
    const endMonth = end.toLocaleString('default', { month: 'long' });
    const endYear = end.getFullYear();
    const endDay = end.getDate();
    
    // Generate name based on period type
    switch (periodType) {
      case 'weekly':
        periodName = `Week of ${startMonth} ${startDay}, ${startYear}`;
        break;
        
      case 'bi-weekly':
        periodName = `Bi-weekly ${startMonth} ${startDay}-${endDay}, ${startYear}`;
        break;
        
      case 'semi-monthly':
        // Determine if it's first or second half of month
        const isFirstHalf = startDay <= 15;
        periodName = `${startMonth} ${startYear} ${isFirstHalf ? '1st' : '2nd'} Half`;
        break;
        
      case 'monthly':
        periodName = `${startMonth} ${startYear}`;
        break;
        
      default:
        // Fallback: date range
        periodName = `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
    }
    
    // Alternative formats
    const alternativeNames = [
      `Payroll ${startMonth} ${startDay}-${endDay}, ${startYear}`,
      `${periodType.charAt(0).toUpperCase() + periodType.slice(1)} ${startMonth} ${startYear}`,
      `${startYear}-${(start.getMonth() + 1).toString().padStart(2, '0')} ${periodType}`
    ];
    
    logger?.info(`Generated period name: ${periodName}`);
    
    return {
      status: true,
      message: "Period name generated successfully",
      data: {
        periodName,
        alternativeNames,
        periodType,
        startDate: start,
        endDate: end,
        suggestedNames: [periodName, ...alternativeNames]
      }
    };
  } catch (error) {
    logger?.error("Error in generatePeriodName:", error);
    return {
      status: false,
      message: `Failed to generate period name: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};
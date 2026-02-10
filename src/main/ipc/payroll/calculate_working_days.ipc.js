// src/ipc/handlers/payroll-period/calculate_working_days.ipc.js
const { AppDataSource } = require("../../db/datasource");
const { logger } = require("../../../utils/logger");

/**
 * Calculate working days between two dates
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @param {boolean} [excludeHolidays] - Whether to exclude holidays
 * @returns {Promise<Object>} Response object
 */
module.exports = async function calculateWorkingDays(startDate, endDate, excludeHolidays = false) {
  try {
    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        status: false,
        message: "Invalid date range provided",
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
    
    let workingDays = 0;
    const current = new Date(start);
    const holidays = excludeHolidays ? await getHolidays(start, end) : [];
    
    // Iterate through each day
    while (current <= end) {
      const dayOfWeek = current.getDay();
      
      // Check if it's a weekday (Monday=1 to Friday=5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Check if it's a holiday
        const isHoliday = holidays.some(holiday => 
          holiday.getDate() === current.getDate() &&
          holiday.getMonth() === current.getMonth() &&
          holiday.getFullYear() === current.getFullYear()
        );
        
        if (!isHoliday) {
          workingDays++;
        }
      }
      
      current.setDate(current.getDate() + 1);
    }
    
    logger?.info(`Calculated ${workingDays} working days between ${start.toISOString().split('T')[0]} and ${end.toISOString().split('T')[0]}`);
    
    return {
      status: true,
      message: "Working days calculated successfully",
      data: {
        workingDays,
        startDate: start,
        endDate: end,
        excludeHolidays,
        holidayCount: holidays.length
      }
    };
  } catch (error) {
    logger?.error("Error in calculateWorkingDays:", error);
    return {
      status: false,
      message: `Failed to calculate working days: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};

// Helper function to get holidays (placeholder - implement based on your holiday system)
async function getHolidays(startDate, endDate) {
  // This is a placeholder. Implement based on your holiday management system.
  // You might have a Holiday entity or configuration file.
  
  const holidays = [];
  
  // Example: Add some fixed holidays (Philippine holidays for 2024)
  const fixedHolidays = [
    new Date(2024, 0, 1),   // New Year's Day
    new Date(2024, 3, 9),   // Day of Valor
    new Date(2024, 4, 1),   // Labor Day
    new Date(2024, 5, 12),  // Independence Day
    new Date(2024, 7, 26),  // National Heroes Day
    new Date(2024, 8, 1),   // Bonifacio Day (observed)
    new Date(2024, 11, 25), // Christmas Day
    new Date(2024, 11, 30)  // Rizal Day
  ];
  
  // Filter holidays within the date range
  fixedHolidays.forEach(holiday => {
    if (holiday >= startDate && holiday <= endDate) {
      holidays.push(holiday);
    }
  });
  
  return holidays;
}
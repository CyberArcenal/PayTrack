/**
 * @file Calculate hours worked
 * @type {import('../../../types/ipc').AttendanceCalculateHoursHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Calculate hours worked
 * @param {import('../../../types/ipc').CalculateHoursParams} params - Calculation parameters
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (params) => {
  try {
    // Validate required parameters
    if (!params.clockIn && !params.clockOut && !params.duration) {
      return {
        status: false,
        message: 'Either clockIn/clockOut pair or duration is required',
        data: null
      };
    }

    const results = {
      calculations: {},
      breakdown: {},
      compliance: {},
      warnings: []
    };

    // Calculate based on provided parameters
    if (params.clockIn && params.clockOut) {
      const clockIn = new Date(params.clockIn);
      const clockOut = new Date(params.clockOut);
      
      if (isNaN(clockIn.getTime()) || isNaN(clockOut.getTime())) {
        return {
          status: false,
          message: 'Invalid clockIn or clockOut timestamp',
          data: null
        };
      }

      if (clockOut <= clockIn) {
        return {
          status: false,
          message: 'clockOut must be after clockIn',
          data: null
        };
      }

      // Calculate total duration in hours
      const totalMs = clockOut - clockIn;
      const totalHours = totalMs / (1000 * 60 * 60);
      
      results.calculations.totalHours = parseFloat(totalHours.toFixed(2));
      results.calculations.clockIn = clockIn.toISOString();
      results.calculations.clockOut = clockOut.toISOString();

      // Calculate regular and overtime hours
      const standardHoursPerDay = params.standardHoursPerDay || 8;
      let regularHours = Math.min(totalHours, standardHoursPerDay);
      let overtimeHours = Math.max(0, totalHours - standardHoursPerDay);
      
      // Apply overtime rules if provided
      if (params.overtimeRules) {
        const rules = params.overtimeRules;
        
        // Check for rest day/holiday overtime
        if (params.isRestDay || params.isHoliday) {
          if (params.isHoliday) {
            // Holiday overtime typically pays 200%
            overtimeHours = totalHours;
            regularHours = 0;
            results.breakdown.overtimeType = 'holiday';
            results.breakdown.overtimeRate = rules.holidayRate || 2.0;
          } else if (params.isRestDay) {
            // Rest day overtime typically pays 130%
            overtimeHours = totalHours;
            regularHours = 0;
            results.breakdown.overtimeType = 'rest-day';
            results.breakdown.overtimeRate = rules.restDayRate || 1.3;
          }
        } else {
          // Regular overtime calculation
          if (rules.dailyOvertimeThreshold && totalHours > rules.dailyOvertimeThreshold) {
            regularHours = Math.min(totalHours, rules.dailyOvertimeThreshold);
            overtimeHours = Math.max(0, totalHours - rules.dailyOvertimeThreshold);
          }
          
          // Check for night differential
          if (rules.nightDiffStart && rules.nightDiffEnd) {
            const nightHours = calculateNightHours(
              clockIn, 
              clockOut, 
              rules.nightDiffStart, 
              rules.nightDiffEnd
            );
            if (nightHours > 0) {
              results.breakdown.nightHours = parseFloat(nightHours.toFixed(2));
              results.breakdown.nightRate = rules.nightDiffRate || 1.1;
            }
          }
        }
      }

      results.breakdown.regularHours = parseFloat(regularHours.toFixed(2));
      results.breakdown.overtimeHours = parseFloat(overtimeHours.toFixed(2));
      
      // Calculate late minutes if start time is provided
      if (params.standardStartTime) {
        const standardStart = new Date(clockIn);
        const [hours, minutes] = params.standardStartTime.split(':').map(Number);
        standardStart.setHours(hours, minutes, 0, 0);
        
        if (clockIn > standardStart) {
          const lateMs = clockIn - standardStart;
          results.breakdown.lateMinutes = Math.floor(lateMs / (1000 * 60));
          results.breakdown.lateHours = parseFloat((lateMs / (1000 * 60 * 60)).toFixed(2));
        }
      }

      // Calculate break deductions
      if (params.breaks && Array.isArray(params.breaks)) {
        let totalBreakMinutes = 0;
        params.breaks.forEach(breakPeriod => {
          if (breakPeriod.start && breakPeriod.end) {
            const breakStart = new Date(breakPeriod.start);
            const breakEnd = new Date(breakPeriod.end);
            const breakMs = breakEnd - breakStart;
            totalBreakMinutes += breakMs / (1000 * 60);
          } else if (breakPeriod.duration) {
            totalBreakMinutes += breakPeriod.duration;
          }
        });
        
        if (totalBreakMinutes > 0) {
          const breakHours = totalBreakMinutes / 60;
          results.breakdown.breakHours = parseFloat(breakHours.toFixed(2));
          results.breakdown.totalBreakMinutes = totalBreakMinutes;
          
          // Adjust regular hours by subtracting breaks
          regularHours = Math.max(0, regularHours - breakHours);
          results.breakdown.regularHoursAfterBreak = parseFloat(regularHours.toFixed(2));
        }
      }

      // Check labor law compliance
      if (params.complianceRules) {
        const compliance = checkCompliance(
          totalHours, 
          overtimeHours, 
          clockIn, 
          clockOut, 
          params.complianceRules
        );
        results.compliance = compliance;
        
        if (!compliance.isCompliant) {
          results.warnings.push(...compliance.violations);
        }
      }

    } else if (params.duration) {
      // Calculate from duration
      const duration = parseFloat(params.duration);
      if (isNaN(duration) || duration < 0) {
        return {
          status: false,
          message: 'Invalid duration value',
          data: null
        };
      }

      results.calculations.totalHours = duration;
      
      const standardHoursPerDay = params.standardHoursPerDay || 8;
      let regularHours = Math.min(duration, standardHoursPerDay);
      let overtimeHours = Math.max(0, duration - standardHoursPerDay);
      
      results.breakdown.regularHours = parseFloat(regularHours.toFixed(2));
      results.breakdown.overtimeHours = parseFloat(overtimeHours.toFixed(2));
    }

    // Calculate payroll amounts if rates provided
    if (params.hourlyRate) {
      const hourlyRate = parseFloat(params.hourlyRate);
      if (!isNaN(hourlyRate)) {
        const regularPay = results.breakdown.regularHours * hourlyRate;
        results.payroll = {
          regularPay: parseFloat(regularPay.toFixed(2)),
          hourlyRate: hourlyRate
        };

        // Calculate overtime pay
        if (results.breakdown.overtimeHours > 0) {
          const overtimeRate = params.overtimeRate || 1.25;
          const overtimePay = results.breakdown.overtimeHours * hourlyRate * overtimeRate;
          results.payroll.overtimePay = parseFloat(overtimePay.toFixed(2));
          results.payroll.overtimeRate = overtimeRate;
          results.payroll.totalPay = parseFloat((regularPay + overtimePay).toFixed(2));
        } else {
          results.payroll.totalPay = parseFloat(regularPay.toFixed(2));
        }

        // Calculate night differential pay
        if (results.breakdown.nightHours && results.breakdown.nightRate) {
          const nightPay = results.breakdown.nightHours * hourlyRate * (results.breakdown.nightRate - 1);
          results.payroll.nightDiffPay = parseFloat(nightPay.toFixed(2));
          results.payroll.totalPay = parseFloat((results.payroll.totalPay + nightPay).toFixed(2));
        }
      }
    }

    // Generate summary
    results.summary = {
      calculationMethod: params.clockIn && params.clockOut ? 'clock-in-out' : 'duration',
      totalHours: results.calculations.totalHours,
      effectiveHours: results.breakdown.regularHoursAfterBreak || results.breakdown.regularHours,
      overtimePercentage: results.calculations.totalHours > 0 
        ? parseFloat((results.breakdown.overtimeHours / results.calculations.totalHours * 100).toFixed(2))
        : 0
    };

    return {
      status: true,
      message: 'Hours calculation completed successfully',
      data: results
    };
  } catch (error) {
    logger.error('Failed to calculate hours:', error);
    
    return {
      status: false,
      message: `Failed to calculate hours: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};

// Helper function to calculate night hours
function calculateNightHours(clockIn, clockOut, nightStart, nightEnd) {
  let nightHours = 0;
  
  // Parse night time range
  const [startHour, startMinute] = nightStart.split(':').map(Number);
  const [endHour, endMinute] = nightEnd.split(':').map(Number);
  
  // Convert clock times to minutes from midnight
  const clockInMinutes = clockIn.getHours() * 60 + clockIn.getMinutes();
  const clockOutMinutes = clockOut.getHours() * 60 + clockOut.getMinutes();
  const nightStartMinutes = startHour * 60 + startMinute;
  const nightEndMinutes = endHour * 60 + endMinute;
  
  // Handle overnight shifts
  if (nightEndMinutes < nightStartMinutes) {
    // Night shift spans midnight
    if (clockInMinutes >= nightStartMinutes || clockInMinutes < nightEndMinutes) {
      const endOfNight = nightEndMinutes + (nightEndMinutes < nightStartMinutes ? 24 * 60 : 0);
      const clockOutAdj = clockOutMinutes + (clockOutMinutes < clockInMinutes ? 24 * 60 : 0);
      nightHours = Math.min(clockOutAdj, endOfNight) - Math.max(clockInMinutes, nightStartMinutes);
    }
  } else {
    // Regular night shift
    if (clockInMinutes < nightEndMinutes && clockOutMinutes > nightStartMinutes) {
      nightHours = Math.min(clockOutMinutes, nightEndMinutes) - Math.max(clockInMinutes, nightStartMinutes);
    }
  }
  
  return nightHours > 0 ? nightHours / 60 : 0;
}

// Helper function to check labor law compliance
function checkCompliance(totalHours, overtimeHours, clockIn, clockOut, rules) {
  const violations = [];
  let isCompliant = true;
  
  // Check maximum daily hours
  if (rules.maxDailyHours && totalHours > rules.maxDailyHours) {
    violations.push({
      rule: 'maxDailyHours',
      limit: rules.maxDailyHours,
      actual: totalHours,
      severity: 'high'
    });
    isCompliant = false;
  }
  
  // Check maximum overtime hours
  if (rules.maxOvertimeHours && overtimeHours > rules.maxOvertimeHours) {
    violations.push({
      rule: 'maxOvertimeHours',
      limit: rules.maxOvertimeHours,
      actual: overtimeHours,
      severity: 'high'
    });
    isCompliant = false;
  }
  
  // Check rest period between shifts
  if (rules.minRestBetweenShifts) {
    // This would require comparing with previous shift
    // For now, we'll just note the requirement
    violations.push({
      rule: 'minRestBetweenShifts',
      requirement: `${rules.minRestBetweenShifts} hours between shifts`,
      severity: 'info'
    });
  }
  
  // Check night shift restrictions
  if (rules.nightShiftRestrictions) {
    const hour = clockIn.getHours();
    if (hour >= 22 || hour < 6) { // Typical night shift hours
      violations.push({
        rule: 'nightShift',
        message: 'Night shift detected. Special rules may apply.',
        severity: 'warning'
      });
    }
  }
  
  return {
    isCompliant,
    violations,
    checkedRules: Object.keys(rules).length
  };
}
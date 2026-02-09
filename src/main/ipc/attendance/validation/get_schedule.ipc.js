/**
 * @file Get employee schedule
 * @type {import('../../../types/ipc').AttendanceGetScheduleHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Get employee schedule
 * @param {import('../../../types/ipc').GetScheduleParams} params - Schedule parameters
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (params) => {
  try {
    // Validate required parameters
    if (!params.employeeId || isNaN(Number(params.employeeId))) {
      return {
        status: false,
        message: 'Valid employee ID is required',
        data: null
      };
    }

    const employeeId = Number(params.employeeId);
    const employeeRepo = AppDataSource.getRepository('Employee');
    
    // Get employee details
    const employee = await employeeRepo.findOne({
      where: { id: employeeId },
      select: [
        'id', 'employeeNumber', 'firstName', 'lastName',
        'department', 'position', 'employmentType', 'status'
      ]
    });

    if (!employee) {
      return {
        status: false,
        message: `Employee with ID ${employeeId} not found`,
        data: null
      };
    }

    // Get schedule data (in a real app, this would come from a schedules table)
    // For now, we'll use default schedules based on employment type
    const defaultSchedule = getDefaultSchedule(employee.employmentType);
    
    // Get attendance for the period to compare with schedule
    const attendanceRepo = AppDataSource.getRepository('AttendanceLog');
    
    let query = attendanceRepo
      .createQueryBuilder('attendance')
      .where('attendance.employeeId = :employeeId', { employeeId })
      .orderBy('attendance.timestamp', 'DESC');

    // Apply date range
    if (params.startDate && params.endDate) {
      query.andWhere(
        'DATE(attendance.timestamp) BETWEEN :startDate AND :endDate',
        { startDate: params.startDate, endDate: params.endDate }
      );
    } else if (params.days) {
      // Get last N days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - params.days);
      
      query.andWhere(
        'DATE(attendance.timestamp) BETWEEN :startDate AND :endDate',
        { startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0] }
      );
    } else {
      // Default to last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      query.andWhere(
        'DATE(attendance.timestamp) BETWEEN :startDate AND :endDate',
        { startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0] }
      );
    }

    const attendanceLogs = await query.getMany();

    // Group attendance by date
    const attendanceByDate = attendanceLogs.reduce((acc, log) => {
      const date = log.timestamp.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(log);
      return acc;
    }, {});

    // Generate schedule compliance analysis
    const complianceAnalysis = analyzeScheduleCompliance(
      attendanceByDate, 
      defaultSchedule,
      params.startDate,
      params.endDate
    );

    // Get upcoming schedule (next 7 days)
    const upcomingSchedule = generateUpcomingSchedule(defaultSchedule, 7);

    // Get holidays if available
    const holidays = await getHolidays(params.startDate, params.endDate);

    // Calculate schedule statistics
    const statistics = calculateScheduleStatistics(
      complianceAnalysis, 
      attendanceLogs.length
    );

    return {
      status: true,
      message: `Schedule retrieved for ${employee.firstName} ${employee.lastName}`,
      data: {
        employee,
        schedule: defaultSchedule,
        compliance: complianceAnalysis,
        upcoming: upcomingSchedule,
        holidays,
        statistics,
        recommendations: generateScheduleRecommendations(complianceAnalysis, statistics)
      }
    };
  } catch (error) {
    logger.error('Failed to get employee schedule:', error);
    
    return {
      status: false,
      message: `Failed to get schedule: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};

// Helper functions

function getDefaultSchedule(employmentType) {
  const schedules = {
    'regular': {
      type: 'regular',
      description: 'Standard 8-hour shift, Monday to Friday',
      workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      startTime: '08:00',
      endTime: '17:00',
      breakDuration: 60, // minutes
      overtimeEligible: true,
      flexible: false
    },
    'part-time': {
      type: 'part-time',
      description: 'Part-time schedule',
      workDays: ['monday', 'wednesday', 'friday'],
      startTime: '09:00',
      endTime: '14:00',
      breakDuration: 30,
      overtimeEligible: false,
      flexible: true
    },
    'contractual': {
      type: 'contractual',
      description: 'Project-based schedule',
      workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      startTime: '08:30',
      endTime: '17:30',
      breakDuration: 60,
      overtimeEligible: true,
      flexible: false
    },
    'probationary': {
      type: 'probationary',
      description: 'Training schedule',
      workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      startTime: '08:00',
      endTime: '17:00',
      breakDuration: 60,
      overtimeEligible: false,
      flexible: false
    }
  };

  return schedules[employmentType] || schedules['regular'];
}

function analyzeScheduleCompliance(attendanceByDate, schedule, startDate, endDate) {
  const analysis = {
    compliantDays: 0,
    nonCompliantDays: 0,
    details: [],
    violations: []
  };

  // Generate date range
  const start = startDate ? new Date(startDate) : new Date();
  start.setDate(start.getDate() - 30); // Default to last 30 days
  
  const end = endDate ? new Date(endDate) : new Date();
  
  const currentDate = new Date(start);
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const isWorkDay = schedule.workDays.includes(dayOfWeek);
    const attendance = attendanceByDate[dateStr] || [];
    
    const dayAnalysis = {
      date: dateStr,
      dayOfWeek,
      isWorkDay,
      expectedStart: isWorkDay ? schedule.startTime : null,
      expectedEnd: isWorkDay ? schedule.endTime : null,
      attendanceCount: attendance.length,
      status: 'no-attendance'
    };

    if (attendance.length > 0) {
      // Sort attendance by time
      attendance.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      
      const firstRecord = attendance[0];
      const lastRecord = attendance[attendance.length - 1];
      
      dayAnalysis.firstRecordTime = firstRecord.timestamp.toISOString().split('T')[1].substring(0, 5);
      dayAnalysis.lastRecordTime = lastRecord.timestamp.toISOString().split('T')[1].substring(0, 5);
      dayAnalysis.totalHours = attendance.reduce((sum, log) => 
        sum + parseFloat(log.hoursWorked), 0
      );
      dayAnalysis.status = firstRecord.status;

      // Check compliance
      if (isWorkDay) {
        const expectedStart = schedule.startTime;
        const actualStart = dayAnalysis.firstRecordTime;
        
        if (actualStart > expectedStart) {
          // Calculate late minutes
          const [expHour, expMin] = expectedStart.split(':').map(Number);
          const [actHour, actMin] = actualStart.split(':').map(Number);
          
          const lateMinutes = (actHour * 60 + actMin) - (expHour * 60 + expMin);
          dayAnalysis.lateMinutes = lateMinutes;
          dayAnalysis.isLate = lateMinutes > 0;
          
          if (lateMinutes > 15) {
            analysis.violations.push({
              date: dateStr,
              type: 'late',
              minutes: lateMinutes,
              severity: lateMinutes > 30 ? 'high' : 'medium'
            });
          }
        }

        // Check minimum hours
        const expectedHours = calculateExpectedHours(schedule.startTime, schedule.endTime, schedule.breakDuration);
        if (dayAnalysis.totalHours < expectedHours * 0.8) { // Less than 80% of expected
          analysis.violations.push({
            date: dateStr,
            type: 'insufficient-hours',
            expected: expectedHours,
            actual: dayAnalysis.totalHours,
            severity: 'medium'
          });
        }

        dayAnalysis.isCompliant = !dayAnalysis.isLate && dayAnalysis.totalHours >= expectedHours * 0.8;
      } else {
        // Non-work day with attendance
        if (dayAnalysis.totalHours > 0) {
          analysis.violations.push({
            date: dateStr,
            type: 'non-work-day-attendance',
            hours: dayAnalysis.totalHours,
            severity: 'low'
          });
        }
        dayAnalysis.isCompliant = true; // Non-work days are always compliant
      }
    } else if (isWorkDay) {
      // Work day without attendance
      analysis.violations.push({
        date: dateStr,
        type: 'absent-on-work-day',
        severity: 'high'
      });
      dayAnalysis.isCompliant = false;
    } else {
      // Non-work day without attendance
      dayAnalysis.isCompliant = true;
    }

    if (dayAnalysis.isCompliant) {
      analysis.compliantDays++;
    } else {
      analysis.nonCompliantDays++;
    }

    analysis.details.push(dayAnalysis);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  analysis.complianceRate = analysis.details.length > 0 
    ? (analysis.compliantDays / analysis.details.length * 100).toFixed(2)
    : 0;

  return analysis;
}

function calculateExpectedHours(startTime, endTime, breakMinutes) {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startTotal = startHour * 60 + startMin;
  const endTotal = endHour * 60 + endMin;
  
  const totalMinutes = endTotal - startTotal - breakMinutes;
  return totalMinutes / 60;
}

function generateUpcomingSchedule(schedule, days) {
  const upcoming = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const isWorkDay = schedule.workDays.includes(dayOfWeek);
    
    upcoming.push({
      date: dateStr,
      dayOfWeek,
      isWorkDay,
      startTime: isWorkDay ? schedule.startTime : null,
      endTime: isWorkDay ? schedule.endTime : null,
      breakDuration: isWorkDay ? schedule.breakDuration : null
    });
  }
  
  return upcoming;
}

async function getHolidays(startDate, endDate) {
  try {
    // In a real app, this would query a holidays table
    // For now, return empty array
    return [];
  } catch (error) {
    logger.warn('Failed to fetch holidays:', error);
    return [];
  }
}

function calculateScheduleStatistics(complianceAnalysis, totalAttendance) {
  return {
    totalDaysAnalyzed: complianceAnalysis.details.length,
    workDays: complianceAnalysis.details.filter(d => d.isWorkDay).length,
    nonWorkDays: complianceAnalysis.details.filter(d => !d.isWorkDay).length,
    daysWithAttendance: complianceAnalysis.details.filter(d => d.attendanceCount > 0).length,
    complianceRate: complianceAnalysis.complianceRate,
    lateDays: complianceAnalysis.details.filter(d => d.isLate).length,
    averageHoursPerDay: complianceAnalysis.details
      .filter(d => d.totalHours > 0)
      .reduce((sum, d) => sum + d.totalHours, 0) / 
      (complianceAnalysis.details.filter(d => d.totalHours > 0).length || 1),
    violationCount: complianceAnalysis.violations.length,
    violationTypes: complianceAnalysis.violations.reduce((acc, violation) => {
      acc[violation.type] = (acc[violation.type] || 0) + 1;
      return acc;
    }, {})
  };
}

function generateScheduleRecommendations(complianceAnalysis, statistics) {
  const recommendations = [];
  
  if (parseFloat(complianceAnalysis.complianceRate) < 80) {
    recommendations.push({
      type: 'compliance',
      priority: 'high',
      message: `Schedule compliance rate is ${complianceAnalysis.complianceRate}%. Needs improvement.`,
      action: 'Review attendance patterns and address frequent violations'
    });
  }
  
  if (statistics.lateDays > statistics.workDays * 0.2) { // More than 20% late
    recommendations.push({
      type: 'punctuality',
      priority: 'medium',
      message: `Employee is late on ${statistics.lateDays} out of ${statistics.workDays} work days`,
      action: 'Discuss punctuality or adjust schedule if needed'
    });
  }
  
  if (statistics.violationCount > 0) {
    const highSeverity = complianceAnalysis.violations.filter(v => v.severity === 'high').length;
    if (highSeverity > 0) {
      recommendations.push({
        type: 'violations',
        priority: 'high',
        message: `${highSeverity} high-severity schedule violations detected`,
        action: 'Address immediately to avoid compliance issues'
      });
    }
  }
  
  if (statistics.averageHoursPerDay > 9) {
    recommendations.push({
      type: 'overtime',
      priority: 'medium',
      message: `Average ${statistics.averageHoursPerDay.toFixed(1)} hours per day. Consider overtime management.`,
      action: 'Monitor overtime and ensure proper compensation'
    });
  }
  
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'good-performance',
      priority: 'low',
      message: 'Schedule compliance is good',
      action: 'Continue current practices'
    });
  }
  
  return recommendations;
}
/**
 * @file Get employee attendance summary
 * @type {import('../../../types/ipc').AttendanceGetEmployeeSummaryHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Get employee attendance summary
 * @param {number} employeeId - Employee ID
 * @param {import('../../../types/ipc').DateRange} [dateRange] - Optional date range
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (employeeId, dateRange) => {
  try {
    if (!employeeId || isNaN(Number(employeeId))) {
      return {
        status: false,
        message: 'Valid employee ID is required',
        data: null
      };
    }

    const employeeIdNum = Number(employeeId);
    const attendanceRepo = AppDataSource.getRepository('AttendanceLog');
    const employeeRepo = AppDataSource.getRepository('Employee');
    const overtimeRepo = AppDataSource.getRepository('OvertimeLog');
    
    // Get employee details
    const employee = await employeeRepo.findOne({
      where: { id: employeeIdNum },
      select: [
        'id', 'employeeNumber', 'firstName', 'lastName', 'middleName',
        'department', 'position', 'hireDate', 'status',
        'dailyRate', 'hourlyRate', 'overtimeRate'
      ]
    });

    if (!employee) {
      return {
        status: false,
        message: `Employee with ID ${employeeId} not found`,
        data: null
      };
    }

    // Build query for attendance logs
    let attendanceQuery = attendanceRepo
      .createQueryBuilder('attendance')
      .where('attendance.employeeId = :employeeId', { employeeId: employeeIdNum })
      .orderBy('attendance.timestamp', 'DESC');

    // Apply date range if provided
    if (dateRange?.startDate && dateRange?.endDate) {
      attendanceQuery.andWhere(
        'DATE(attendance.timestamp) BETWEEN :startDate AND :endDate',
        { startDate: dateRange.startDate, endDate: dateRange.endDate }
      );
    }

    const attendanceLogs = await attendanceQuery.getMany();

    // Get overtime logs
    let overtimeQuery = overtimeRepo
      .createQueryBuilder('overtime')
      .where('overtime.employeeId = :employeeId', { employeeId: employeeIdNum })
      .orderBy('overtime.date', 'DESC');

    if (dateRange?.startDate && dateRange?.endDate) {
      overtimeQuery.andWhere(
        'overtime.date BETWEEN :startDate AND :endDate',
        { startDate: dateRange.startDate, endDate: dateRange.endDate }
      );
    }

    const overtimeLogs = await overtimeQuery.getMany();

    // Calculate summary statistics
    const summary = attendanceLogs.reduce((acc, log) => {
      const date = log.timestamp.toISOString().split('T')[0];
      
      // Track unique dates
      acc.dates.add(date);
      
      // Count by status
      acc.byStatus[log.status] = (acc.byStatus[log.status] || 0) + 1;
      
      // Calculate totals
      acc.totalHours += parseFloat(log.hoursWorked);
      acc.totalOvertime += parseFloat(log.overtimeHours);
      
      if (log.status === 'late') {
        acc.lateCount++;
        acc.totalLateMinutes += log.lateMinutes || 0;
      }
      
      // Track source distribution
      acc.bySource[log.source] = (acc.bySource[log.source] || 0) + 1;
      
      return acc;
    }, {
      totalRecords: attendanceLogs.length,
      totalHours: 0,
      totalOvertime: 0,
      lateCount: 0,
      totalLateMinutes: 0,
      byStatus: {},
      bySource: {},
      dates: new Set()
    });

    // Calculate overtime summary
    const overtimeSummary = overtimeLogs.reduce((acc, log) => {
      acc.totalRecords++;
      acc.totalHours += parseFloat(log.hours);
      acc.totalAmount += parseFloat(log.amount);
      acc.byStatus[log.approvalStatus] = (acc.byStatus[log.approvalStatus] || 0) + 1;
      acc.byType[log.type] = (acc.byType[log.type] || 0) + 1;
      return acc;
    }, {
      totalRecords: 0,
      totalHours: 0,
      totalAmount: 0,
      byStatus: {},
      byType: {}
    });

    // Calculate monthly trends (last 6 months)
    const monthlyTrends = {};
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentLogs = attendanceLogs.filter(log => 
      new Date(log.timestamp) >= sixMonthsAgo
    );

    recentLogs.forEach(log => {
      const date = new Date(log.timestamp);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyTrends[monthKey]) {
        monthlyTrends[monthKey] = {
          month: monthKey,
          present: 0,
          late: 0,
          absent: 0,
          totalHours: 0,
          overtimeHours: 0
        };
      }
      
      const monthData = monthlyTrends[monthKey];
      monthData[log.status] = (monthData[log.status] || 0) + 1;
      monthData.totalHours += parseFloat(log.hoursWorked);
      monthData.overtimeHours += parseFloat(log.overtimeHours);
    });

    // Calculate attendance rate
    const workingDays = summary.dates.size;
    const presentDays = (summary.byStatus.present || 0) + 
                       (summary.byStatus.late || 0) + 
                       (summary.byStatus['half-day'] || 0);
    const attendanceRate = workingDays > 0
      ? (presentDays / workingDays * 100).toFixed(2)
      : 0;

    // Calculate average values
    const averageHoursPerDay = workingDays > 0
      ? parseFloat((summary.totalHours / workingDays).toFixed(2))
      : 0;
    
    const averageLateMinutes = summary.lateCount > 0
      ? parseFloat((summary.totalLateMinutes / summary.lateCount).toFixed(2))
      : 0;

    // Get recent attendance (last 10 records)
    const recentAttendance = attendanceLogs.slice(0, 10).map(log => ({
      id: log.id,
      date: log.timestamp.toISOString().split('T')[0],
      time: log.timestamp.toISOString().split('T')[1].substring(0, 5),
      status: log.status,
      hoursWorked: parseFloat(log.hoursWorked),
      overtimeHours: parseFloat(log.overtimeHours),
      lateMinutes: log.lateMinutes || 0,
      source: log.source,
      note: log.note
    }));

    // Get recent overtime (last 5 records)
    const recentOvertime = overtimeLogs.slice(0, 5).map(log => ({
      id: log.id,
      date: log.date,
      hours: parseFloat(log.hours),
      amount: parseFloat(log.amount),
      type: log.type,
      approvalStatus: log.approvalStatus,
      approvedBy: log.approvedBy
    }));

    return {
      status: true,
      message: `Employee attendance summary for ${employee.firstName} ${employee.lastName} retrieved successfully`,
      data: {
        employee: {
          id: employee.id,
          employeeNumber: employee.employeeNumber,
          fullName: `${employee.firstName} ${employee.lastName}`,
          department: employee.department,
          position: employee.position,
          hireDate: employee.hireDate,
          status: employee.status,
          rates: {
            daily: parseFloat(employee.dailyRate || 0),
            hourly: parseFloat(employee.hourlyRate || 0),
            overtime: parseFloat(employee.overtimeRate || 1.25)
          }
        },
        dateRange: dateRange || {
          startDate: attendanceLogs.length > 0
            ? attendanceLogs[attendanceLogs.length - 1].timestamp.toISOString().split('T')[0]
            : null,
          endDate: attendanceLogs.length > 0
            ? attendanceLogs[0].timestamp.toISOString().split('T')[0]
            : null
        },
        summary: {
          totalRecords: summary.totalRecords,
          workingDays: workingDays,
          presentDays,
          absentDays: summary.byStatus.absent || 0,
          attendanceRate: parseFloat(attendanceRate),
          statusDistribution: summary.byStatus,
          sourceDistribution: summary.bySource,
          hours: {
            total: parseFloat(summary.totalHours.toFixed(2)),
            averageDaily: averageHoursPerDay,
            overtime: parseFloat(summary.totalOvertime.toFixed(2))
          },
          late: {
            count: summary.lateCount,
            totalMinutes: summary.totalLateMinutes,
            averageMinutes: averageLateMinutes
          }
        },
        overtimeSummary: {
          totalRecords: overtimeSummary.totalRecords,
          totalHours: parseFloat(overtimeSummary.totalHours.toFixed(2)),
          totalAmount: parseFloat(overtimeSummary.totalAmount.toFixed(2)),
          statusDistribution: overtimeSummary.byStatus,
          typeDistribution: overtimeSummary.byType,
          approvalRate: overtimeSummary.totalRecords > 0
            ? parseFloat(((overtimeSummary.byStatus.approved || 0) / 
                overtimeSummary.totalRecords * 100).toFixed(2))
            : 0
        },
        monthlyTrends: Object.values(monthlyTrends)
          .sort((a, b) => a.month.localeCompare(b.month)),
        recentAttendance,
        recentOvertime,
        metrics: {
          reliabilityScore: calculateReliabilityScore(summary, workingDays),
          punctualityScore: calculatePunctualityScore(summary),
          productivityScore: calculateProductivityScore(summary, averageHoursPerDay)
        },
        insights: generateInsights(summary, overtimeSummary, attendanceRate)
      }
    };
  } catch (error) {
    logger.error('Failed to get employee attendance summary:', error);
    
    return {
      status: false,
      message: `Failed to get employee attendance summary: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};

// Helper functions for scoring
function calculateReliabilityScore(summary, workingDays) {
  if (workingDays === 0) return 100;
  
  const presentDays = (summary.byStatus.present || 0) + 
                     (summary.byStatus.late || 0) + 
                     (summary.byStatus['half-day'] || 0);
  const reliability = (presentDays / workingDays) * 100;
  
  // Deduct for excessive absences
  const absentDays = summary.byStatus.absent || 0;
  const absencePenalty = Math.min(absentDays * 5, 30); // Max 30% penalty
  
  return Math.max(0, Math.min(100, reliability - absencePenalty));
}

function calculatePunctualityScore(summary) {
  const totalDays = summary.totalRecords;
  if (totalDays === 0) return 100;
  
  const lateCount = summary.lateCount || 0;
  const punctuality = ((totalDays - lateCount) / totalDays) * 100;
  
  // Deduct for excessive lateness
  const averageLateMinutes = summary.lateCount > 0
    ? summary.totalLateMinutes / summary.lateCount
    : 0;
  const latenessPenalty = Math.min(averageLateMinutes / 10, 20); // Max 20% penalty
  
  return Math.max(0, Math.min(100, punctuality - latenessPenalty));
}

function calculateProductivityScore(summary, averageHoursPerDay) {
  const standardHours = 8; // Standard work hours per day
  const productivity = (averageHoursPerDay / standardHours) * 100;
  
  // Bonus for overtime
  const overtimeBonus = Math.min(summary.totalOvertime / 10, 10); // Max 10% bonus
  
  return Math.min(100, Math.max(0, productivity + overtimeBonus));
}

function generateInsights(summary, overtimeSummary, attendanceRate) {
  const insights = [];
  
  // Attendance insights
  if (attendanceRate >= 95) {
    insights.push('Excellent attendance record - consistently present');
  } else if (attendanceRate >= 90) {
    insights.push('Good attendance - minimal absences');
  } else if (attendanceRate >= 80) {
    insights.push('Average attendance - room for improvement');
  } else {
    insights.push('Attendance needs improvement - frequent absences detected');
  }
  
  // Punctuality insights
  const lateRate = summary.lateCount > 0 
    ? (summary.lateCount / summary.totalRecords * 100).toFixed(2)
    : 0;
  
  if (parseFloat(lateRate) > 20) {
    insights.push('High frequency of late arrivals - consider addressing punctuality');
  } else if (parseFloat(lateRate) > 10) {
    insights.push('Moderate lateness - monitor punctuality');
  } else if (summary.lateCount > 0) {
    insights.push('Minimal late arrivals - good punctuality');
  }
  
  // Overtime insights
  const overtimeHours = summary.totalOvertime;
  if (overtimeHours > 40) {
    insights.push('Significant overtime recorded - consider workload review');
  } else if (overtimeHours > 20) {
    insights.push('Moderate overtime - within acceptable limits');
  }
  
  // Overtime approval insights
  const pendingOvertime = overtimeSummary.byStatus.pending || 0;
  if (pendingOvertime > 5) {
    insights.push(`Multiple overtime requests (${pendingOvertime}) pending approval`);
  }
  
  // Source distribution insights
  const sources = Object.keys(summary.bySource);
  if (sources.length === 1 && sources[0] === 'manual') {
    insights.push('All attendance recorded manually - consider implementing automated systems');
  }
  
  return insights;
}
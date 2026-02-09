/**
 * @file Get attendance report
 * @type {import('../../../types/ipc').AttendanceGetReportHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Get comprehensive attendance report
 * @param {import('../../../types/ipc').DateRange} dateRange - Date range for report
 * @param {import('../../../types/ipc').AttendanceReportFilters} [filters] - Optional filters
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (dateRange, filters = {}) => {
  try {
    // Validate date range
    if (!dateRange?.startDate || !dateRange?.endDate) {
      return {
        status: false,
        message: 'Start date and end date are required',
        data: null
      };
    }

    if (new Date(dateRange.startDate) > new Date(dateRange.endDate)) {
      return {
        status: false,
        message: 'Start date must be before or equal to end date',
        data: null
      };
    }

    const attendanceRepo = AppDataSource.getRepository('AttendanceLog');
    const employeeRepo = AppDataSource.getRepository('Employee');
    
    // Get all active employees
    let employeeQuery = employeeRepo
      .createQueryBuilder('employee')
      .where('employee.status = :status', { status: 'active' });

    if (filters.department) {
      employeeQuery.andWhere('employee.department = :department', {
        department: filters.department
      });
    }

    const activeEmployees = await employeeQuery.getMany();

    // Get attendance logs for the date range
    let attendanceQuery = attendanceRepo
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee')
      .where('DATE(attendance.timestamp) BETWEEN :startDate AND :endDate', {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });

    if (filters.department) {
      attendanceQuery.andWhere('employee.department = :department', {
        department: filters.department
      });
    }

    if (filters.employeeId) {
      attendanceQuery.andWhere('attendance.employeeId = :employeeId', {
        employeeId: filters.employeeId
      });
    }

    const attendanceLogs = await attendanceQuery.getMany();

    // Group attendance by employee and date
    const employeeAttendance = {};
    const dateSet = new Set();

    attendanceLogs.forEach(log => {
      const empId = log.employeeId;
      const date = log.timestamp.toISOString().split('T')[0];
      
      dateSet.add(date);
      
      if (!employeeAttendance[empId]) {
        employeeAttendance[empId] = {
          employeeId: empId,
          employee: log.employee,
          attendanceByDate: {},
          summary: {
            present: 0,
            absent: 0,
            late: 0,
            halfDay: 0,
            onLeave: 0,
            totalHours: 0,
            overtimeHours: 0
          }
        };
      }
      
      // Store attendance by date
      employeeAttendance[empId].attendanceByDate[date] = {
        status: log.status,
        hoursWorked: parseFloat(log.hoursWorked),
        overtimeHours: parseFloat(log.overtimeHours),
        lateMinutes: log.lateMinutes || 0,
        timestamp: log.timestamp,
        source: log.source
      };
      
      // Update summary
      const summary = employeeAttendance[empId].summary;
      summary[log.status] = (summary[log.status] || 0) + 1;
      summary.totalHours += parseFloat(log.hoursWorked);
      summary.overtimeHours += parseFloat(log.overtimeHours);
    });

    // Generate report for each employee
    const allDates = Array.from(dateSet).sort();
    const employeeReports = activeEmployees.map(employee => {
      const empReport = employeeAttendance[employee.id] || {
        employeeId: employee.id,
        employee,
        attendanceByDate: {},
        summary: {
          present: 0,
          absent: 0,
          late: 0,
          halfDay: 0,
          onLeave: 0,
          totalHours: 0,
          overtimeHours: 0
        }
      };

      // Calculate attendance rate
      const totalDays = allDates.length;
      const attendedDays = Object.keys(empReport.attendanceByDate).length;
      const attendanceRate = totalDays > 0 
        ? (attendedDays / totalDays * 100).toFixed(2)
        : 0;

      return {
        ...empReport,
        report: {
          totalDays,
          attendedDays,
          attendanceRate: parseFloat(attendanceRate),
          averageDailyHours: attendedDays > 0
            ? parseFloat((empReport.summary.totalHours / attendedDays).toFixed(2))
            : 0,
          totalOvertimeHours: empReport.summary.overtimeHours
        }
      };
    });

    // Calculate overall statistics
    const overallStats = employeeReports.reduce((acc, report) => {
      acc.totalEmployees++;
      acc.totalAttendanceDays += report.report.attendedDays;
      acc.totalHours += report.summary.totalHours;
      acc.totalOvertime += report.summary.overtimeHours;
      
      // Attendance rate distribution
      const rate = report.report.attendanceRate;
      if (rate >= 90) acc.excellentAttendance++;
      else if (rate >= 80) acc.goodAttendance++;
      else if (rate >= 70) acc.fairAttendance++;
      else acc.poorAttendance++;
      
      return acc;
    }, {
      totalEmployees: 0,
      totalAttendanceDays: 0,
      totalHours: 0,
      totalOvertime: 0,
      excellentAttendance: 0,
      goodAttendance: 0,
      fairAttendance: 0,
      poorAttendance: 0
    });

    // Calculate department-wise statistics if multiple departments
    const departmentStats = employeeReports.reduce((acc, report) => {
      const dept = report.employee.department || 'Unassigned';
      if (!acc[dept]) {
        acc[dept] = {
          totalEmployees: 0,
          totalAttendanceDays: 0,
          averageAttendanceRate: 0,
          totalHours: 0
        };
      }
      
      acc[dept].totalEmployees++;
      acc[dept].totalAttendanceDays += report.report.attendedDays;
      acc[dept].totalHours += report.summary.totalHours;
      acc[dept].averageAttendanceRate = 
        (acc[dept].averageAttendanceRate * (acc[dept].totalEmployees - 1) + 
         report.report.attendanceRate) / acc[dept].totalEmployees;
      
      return acc;
    }, {});

    return {
      status: true,
      message: `Attendance report for ${dateRange.startDate} to ${dateRange.endDate} generated successfully`,
      data: {
        reportDate: new Date().toISOString(),
        dateRange,
        filters,
        summary: {
          reportPeriod: `${dateRange.startDate} to ${dateRange.endDate}`,
          totalDays: allDates.length,
          totalActiveEmployees: activeEmployees.length,
          overallAttendanceRate: overallStats.totalEmployees > 0
            ? parseFloat((overallStats.totalAttendanceDays / (overallStats.totalEmployees * allDates.length) * 100).toFixed(2))
            : 0,
          totalHoursWorked: parseFloat(overallStats.totalHours.toFixed(2)),
          totalOvertimeHours: parseFloat(overallStats.totalOvertime.toFixed(2)),
          attendanceDistribution: {
            excellent: overallStats.excellentAttendance,
            good: overallStats.goodAttendance,
            fair: overallStats.fairAttendance,
            poor: overallStats.poorAttendance
          }
        },
        departmentStatistics: departmentStats,
        employeeReports: employeeReports.sort((a, b) => 
          b.report.attendanceRate - a.report.attendanceRate
        ),
        dailyAttendance: allDates.map(date => ({
          date,
          presentCount: employeeReports.filter(emp => 
            emp.attendanceByDate[date] && 
            ['present', 'late', 'half-day'].includes(emp.attendanceByDate[date].status)
          ).length,
          absentCount: employeeReports.length - employeeReports.filter(emp => 
            emp.attendanceByDate[date] && 
            ['present', 'late', 'half-day'].includes(emp.attendanceByDate[date].status)
          ).length
        })),
        topPerformers: employeeReports
          .filter(emp => emp.report.attendanceRate >= 95)
          .slice(0, 10),
        attendanceConcerns: employeeReports
          .filter(emp => emp.report.attendanceRate < 70)
          .slice(0, 10)
      }
    };
  } catch (error) {
    logger.error('Failed to generate attendance report:', error);
    
    return {
      status: false,
      message: `Failed to generate attendance report: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
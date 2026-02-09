/**
 * @file Get daily attendance report
 * @type {import('../../../types/ipc').AttendanceGetDailyReportHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Get daily attendance report
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {import('../../../types/ipc').AttendanceReportFilters} [filters] - Optional filters
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (date, filters = {}) => {
  try {
    // Validate date format
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return {
        status: false,
        message: 'Valid date in YYYY-MM-DD format is required',
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

    // Get attendance for the specific date
    let attendanceQuery = attendanceRepo
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee')
      .where('DATE(attendance.timestamp) = :date', { date });

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

    // Group by employee
    const attendanceByEmployee = {};
    attendanceLogs.forEach(log => {
      if (!attendanceByEmployee[log.employeeId]) {
        attendanceByEmployee[log.employeeId] = [];
      }
      attendanceByEmployee[log.employeeId].push(log);
    });

    // Generate daily report
    const dailyReport = activeEmployees.map(employee => {
      const employeeAttendance = attendanceByEmployee[employee.id] || [];
      
      // Determine attendance status for the day
      let dailyStatus = 'absent';
      let primaryLog = null;
      let totalHours = 0;
      let overtimeHours = 0;
      let lateMinutes = 0;

      if (employeeAttendance.length > 0) {
        // Sort by timestamp to get the most relevant log
        employeeAttendance.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        
        primaryLog = employeeAttendance[0];
        dailyStatus = primaryLog.status;
        
        // Calculate totals
        employeeAttendance.forEach(log => {
          totalHours += parseFloat(log.hoursWorked);
          overtimeHours += parseFloat(log.overtimeHours);
          lateMinutes += log.lateMinutes || 0;
        });
      }

      return {
        employee: {
          id: employee.id,
          employeeNumber: employee.employeeNumber,
          firstName: employee.firstName,
          lastName: employee.lastName,
          department: employee.department,
          position: employee.position,
          dailyRate: employee.dailyRate,
          hourlyRate: employee.hourlyRate
        },
        attendance: {
          status: dailyStatus,
          totalHours: parseFloat(totalHours.toFixed(2)),
          overtimeHours: parseFloat(overtimeHours.toFixed(2)),
          lateMinutes,
          logs: employeeAttendance,
          clockIn: employeeAttendance.length > 0 
            ? employeeAttendance.sort((a, b) => 
                new Date(a.timestamp) - new Date(b.timestamp)
              )[0].timestamp
            : null,
          clockOut: employeeAttendance.length > 1
            ? employeeAttendance.sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
              )[0].timestamp
            : null
        }
      };
    });

    // Calculate summary statistics
    const summary = dailyReport.reduce((acc, record) => {
      acc.totalEmployees++;
      acc.byStatus[record.attendance.status] = 
        (acc.byStatus[record.attendance.status] || 0) + 1;
      
      if (['present', 'late', 'half-day'].includes(record.attendance.status)) {
        acc.presentEmployees++;
        acc.totalHours += record.attendance.totalHours;
        acc.totalOvertime += record.attendance.overtimeHours;
        acc.totalLateMinutes += record.attendance.lateMinutes;
      }
      
      return acc;
    }, {
      totalEmployees: 0,
      presentEmployees: 0,
      totalHours: 0,
      totalOvertime: 0,
      totalLateMinutes: 0,
      byStatus: {}
    });

    // Calculate department-wise breakdown
    const departmentBreakdown = dailyReport.reduce((acc, record) => {
      const dept = record.employee.department || 'Unassigned';
      if (!acc[dept]) {
        acc[dept] = {
          total: 0,
          byStatus: {},
          presentCount: 0
        };
      }
      
      acc[dept].total++;
      acc[dept].byStatus[record.attendance.status] = 
        (acc[dept].byStatus[record.attendance.status] || 0) + 1;
      
      if (['present', 'late', 'half-day'].includes(record.attendance.status)) {
        acc[dept].presentCount++;
      }
      
      return acc;
    }, {});

    // Calculate attendance rate by department
    Object.keys(departmentBreakdown).forEach(dept => {
      departmentBreakdown[dept].attendanceRate = 
        (departmentBreakdown[dept].presentCount / departmentBreakdown[dept].total * 100).toFixed(2);
    });

    return {
      status: true,
      message: `Daily attendance report for ${date} generated successfully`,
      data: {
        reportDate: date,
        generatedAt: new Date().toISOString(),
        filters,
        summary: {
          totalEmployees: summary.totalEmployees,
          presentEmployees: summary.presentEmployees,
          attendanceRate: (summary.presentEmployees / summary.totalEmployees * 100).toFixed(2) + '%',
          totalHoursWorked: parseFloat(summary.totalHours.toFixed(2)),
          totalOvertimeHours: parseFloat(summary.totalOvertime.toFixed(2)),
          averageLateMinutes: summary.presentEmployees > 0
            ? parseFloat((summary.totalLateMinutes / summary.presentEmployees).toFixed(2))
            : 0,
          statusDistribution: summary.byStatus
        },
        departmentBreakdown,
        detailedReport: dailyReport,
        lateArrivals: dailyReport
          .filter(record => record.attendance.status === 'late')
          .sort((a, b) => b.attendance.lateMinutes - a.attendance.lateMinutes),
        absentEmployees: dailyReport
          .filter(record => record.attendance.status === 'absent')
          .map(record => ({
            id: record.employee.id,
            employeeNumber: record.employee.employeeNumber,
            name: `${record.employee.firstName} ${record.employee.lastName}`,
            department: record.employee.department
          }))
      }
    };
  } catch (error) {
    logger.error('Failed to generate daily attendance report:', error);
    
    return {
      status: false,
      message: `Failed to generate daily attendance report: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
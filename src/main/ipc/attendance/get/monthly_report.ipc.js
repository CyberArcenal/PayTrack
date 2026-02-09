/**
 * @file Get monthly attendance report
 * @type {import('../../../types/ipc').AttendanceGetMonthlyReportHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Get monthly attendance report
 * @param {number} year - Year (e.g., 2024)
 * @param {number} month - Month (1-12)
 * @param {import('../../../types/ipc').AttendanceReportFilters} [filters] - Optional filters
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (year, month, filters = {}) => {
  try {
    // Validate year and month
    if (!year || isNaN(year) || year < 2000 || year > 2100) {
      return {
        status: false,
        message: 'Valid year between 2000 and 2100 is required',
        data: null
      };
    }
    
    if (!month || isNaN(month) || month < 1 || month > 12) {
      return {
        status: false,
        message: 'Valid month between 1 and 12 is required',
        data: null
      };
    }

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of the month
    const monthName = startDate.toLocaleString('default', { month: 'long' });
    
    const dateRange = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };

    const attendanceRepo = AppDataSource.getRepository('AttendanceLog');
    const employeeRepo = AppDataSource.getRepository('Employee');
    
    // Get all active employees for the month (considering status changes)
    let employeeQuery = employeeRepo
      .createQueryBuilder('employee')
      .where('employee.status = :status', { status: 'active' })
      .andWhere('employee.hireDate <= :endDate', { endDate: dateRange.endDate });

    if (filters.department) {
      employeeQuery.andWhere('employee.department = :department', {
        department: filters.department
      });
    }

    const activeEmployees = await employeeQuery.getMany();

    // Get attendance for the month
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
    const employeeMonthlyData = {};
    const allDates = [];
    
    // Generate all dates in the month
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      allDates.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    attendanceLogs.forEach(log => {
      const empId = log.employeeId;
      const date = log.timestamp.toISOString().split('T')[0];
      
      if (!employeeMonthlyData[empId]) {
        employeeMonthlyData[empId] = {
          employeeId: empId,
          employee: log.employee,
          attendanceByDate: {},
          summary: {
            present: 0,
            absent: 0,
            late: 0,
            halfDay: 0,
            onLeave: 0,
            holiday: 0,
            totalHours: 0,
            overtimeHours: 0,
            lateMinutes: 0
          }
        };
      }
      
      // Store attendance by date
      employeeMonthlyData[empId].attendanceByDate[date] = {
        status: log.status,
        hoursWorked: parseFloat(log.hoursWorked),
        overtimeHours: parseFloat(log.overtimeHours),
        lateMinutes: log.lateMinutes || 0,
        timestamp: log.timestamp,
        source: log.source
      };
      
      // Update summary
      const summary = employeeMonthlyData[empId].summary;
      summary[log.status] = (summary[log.status] || 0) + 1;
      summary.totalHours += parseFloat(log.hoursWorked);
      summary.overtimeHours += parseFloat(log.overtimeHours);
      if (log.status === 'late') {
        summary.lateMinutes += log.lateMinutes || 0;
      }
    });

    // Generate monthly report for each employee
    const monthlyReport = activeEmployees.map(employee => {
      const empData = employeeMonthlyData[employee.id] || {
        employeeId: employee.id,
        employee,
        attendanceByDate: {},
        summary: {
          present: 0,
          absent: 0,
          late: 0,
          halfDay: 0,
          onLeave: 0,
          holiday: 0,
          totalHours: 0,
          overtimeHours: 0,
          lateMinutes: 0
        }
      };

      // Calculate working days (exclude weekends and holidays)
      const workingDays = allDates.filter(date => {
        const dayOfWeek = new Date(date).getDay();
        // Monday to Friday are working days (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      }).length;

      // Calculate attendance metrics
      const presentDays = empData.summary.present + empData.summary.late + empData.summary.halfDay;
      const absentDays = workingDays - presentDays - empData.summary.onLeave - empData.summary.holiday;
      empData.summary.absent = Math.max(0, absentDays);

      const attendanceRate = workingDays > 0
        ? (presentDays / workingDays * 100).toFixed(2)
        : 0;

      const averageDailyHours = presentDays > 0
        ? parseFloat((empData.summary.totalHours / presentDays).toFixed(2))
        : 0;

      // Calculate payroll impact
      const dailyRate = parseFloat(employee.dailyRate) || 0;
      const hourlyRate = parseFloat(employee.hourlyRate) || 0;
      
      const basicPay = presentDays * dailyRate;
      const overtimePay = empData.summary.overtimeHours * hourlyRate * (employee.overtimeRate || 1.25);
      const lateDeduction = empData.summary.lateMinutes > 0
        ? (empData.summary.lateMinutes / 60) * hourlyRate
        : 0;

      return {
        ...empData,
        metrics: {
          month: `${monthName} ${year}`,
          workingDays,
          presentDays,
          absentDays: empData.summary.absent,
          onLeaveDays: empData.summary.onLeave,
          holidayDays: empData.summary.holiday,
          attendanceRate: parseFloat(attendanceRate),
          averageDailyHours,
          totalHoursWorked: parseFloat(empData.summary.totalHours.toFixed(2)),
          totalOvertimeHours: parseFloat(empData.summary.overtimeHours.toFixed(2)),
          averageLateMinutes: empData.summary.late > 0
            ? parseFloat((empData.summary.lateMinutes / empData.summary.late).toFixed(2))
            : 0,
          payrollImpact: {
            basicPay: parseFloat(basicPay.toFixed(2)),
            overtimePay: parseFloat(overtimePay.toFixed(2)),
            lateDeduction: parseFloat(lateDeduction.toFixed(2)),
            netEarnings: parseFloat((basicPay + overtimePay - lateDeduction).toFixed(2))
          }
        }
      };
    });

    // Calculate overall monthly statistics
    const overallStats = monthlyReport.reduce((acc, report) => {
      acc.totalEmployees++;
      acc.totalWorkingDays += report.metrics.workingDays;
      acc.totalPresentDays += report.metrics.presentDays;
      acc.totalHours += report.metrics.totalHoursWorked;
      acc.totalOvertime += report.metrics.totalOvertimeHours;
      acc.totalLateMinutes += report.summary.lateMinutes;
      
      // Attendance rate distribution
      const rate = report.metrics.attendanceRate;
      if (rate >= 95) acc.excellent++;
      else if (rate >= 90) acc.veryGood++;
      else if (rate >= 85) acc.good++;
      else if (rate >= 80) acc.fair++;
      else if (rate >= 70) acc.needsImprovement++;
      else acc.poor++;
      
      return acc;
    }, {
      totalEmployees: 0,
      totalWorkingDays: 0,
      totalPresentDays: 0,
      totalHours: 0,
      totalOvertime: 0,
      totalLateMinutes: 0,
      excellent: 0,
      veryGood: 0,
      good: 0,
      fair: 0,
      needsImprovement: 0,
      poor: 0
    });

    // Calculate department-wise statistics
    const departmentStats = monthlyReport.reduce((acc, report) => {
      const dept = report.employee.department || 'Unassigned';
      if (!acc[dept]) {
        acc[dept] = {
          totalEmployees: 0,
          totalWorkingDays: 0,
          totalPresentDays: 0,
          totalHours: 0,
          attendanceRate: 0
        };
      }
      
      acc[dept].totalEmployees++;
      acc[dept].totalWorkingDays += report.metrics.workingDays;
      acc[dept].totalPresentDays += report.metrics.presentDays;
      acc[dept].totalHours += report.metrics.totalHoursWorked;
      acc[dept].attendanceRate = 
        (acc[dept].attendanceRate * (acc[dept].totalEmployees - 1) + 
         report.metrics.attendanceRate) / acc[dept].totalEmployees;
      
      return acc;
    }, {});

    // Calculate trend (compare with previous month)
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStartDate = new Date(prevYear, prevMonth - 1, 1);
    const prevEndDate = new Date(prevYear, prevMonth, 0);
    
    const prevMonthAttendance = await attendanceRepo
      .createQueryBuilder('attendance')
      .where('DATE(attendance.timestamp) BETWEEN :startDate AND :endDate', {
        startDate: prevStartDate.toISOString().split('T')[0],
        endDate: prevEndDate.toISOString().split('T')[0]
      })
      .getCount();

    const currentMonthAttendance = attendanceLogs.length;
    const attendanceTrend = prevMonthAttendance > 0
      ? ((currentMonthAttendance - prevMonthAttendance) / prevMonthAttendance * 100).toFixed(2)
      : 100;

    return {
      status: true,
      message: `Monthly attendance report for ${monthName} ${year} generated successfully`,
      data: {
        reportPeriod: {
          year,
          month,
          monthName,
          dateRange
        },
        generatedAt: new Date().toISOString(),
        filters,
        summary: {
          totalEmployees: overallStats.totalEmployees,
          totalWorkingDays: overallStats.totalWorkingDays,
          totalPresentDays: overallStats.totalPresentDays,
          overallAttendanceRate: parseFloat(
            (overallStats.totalPresentDays / overallStats.totalWorkingDays * 100).toFixed(2)
          ),
          totalHoursWorked: parseFloat(overallStats.totalHours.toFixed(2)),
          totalOvertimeHours: parseFloat(overallStats.totalOvertime.toFixed(2)),
          averageLateMinutes: overallStats.totalPresentDays > 0
            ? parseFloat((overallStats.totalLateMinutes / overallStats.totalPresentDays).toFixed(2))
            : 0,
          attendanceDistribution: {
            excellent: overallStats.excellent,
            veryGood: overallStats.veryGood,
            good: overallStats.good,
            fair: overallStats.fair,
            needsImprovement: overallStats.needsImprovement,
            poor: overallStats.poor
          },
          trend: {
            previousMonth: prevMonthAttendance,
            currentMonth: currentMonthAttendance,
            percentageChange: parseFloat(attendanceTrend)
          }
        },
        departmentStatistics: departmentStats,
        employeeReports: monthlyReport.sort((a, b) => 
          b.metrics.attendanceRate - a.metrics.attendanceRate
        ),
        dailyAttendanceTrend: allDates.map(date => {
          const dayAttendance = monthlyReport.filter(emp => 
            emp.attendanceByDate[date] && 
            ['present', 'late', 'half-day'].includes(emp.attendanceByDate[date].status)
          ).length;
          
          return {
            date,
            dayOfWeek: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
            presentCount: dayAttendance,
            absentCount: monthlyReport.length - dayAttendance,
            attendanceRate: parseFloat((dayAttendance / monthlyReport.length * 100).toFixed(2))
          };
        }),
        topPerformers: monthlyReport
          .filter(emp => emp.metrics.attendanceRate >= 95)
          .slice(0, 10),
        attendanceConcerns: monthlyReport
          .filter(emp => emp.metrics.attendanceRate < 80)
          .slice(0, 10),
        overtimeAnalysis: monthlyReport
          .filter(emp => emp.metrics.totalOvertimeHours > 20)
          .sort((a, b) => b.metrics.totalOvertimeHours - a.metrics.totalOvertimeHours)
          .slice(0, 10)
      }
    };
  } catch (error) {
    logger.error('Failed to generate monthly attendance report:', error);
    
    return {
      status: false,
      message: `Failed to generate monthly attendance report: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
/**
 * @file Get absent employees for a specific date
 * @type {import('../../../types/ipc').AttendanceGetAbsentHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Get absent employees
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {import('../../../types/ipc').AttendanceFilters} [filters] - Optional filters
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
    const activeEmployeesQuery = employeeRepo
      .createQueryBuilder('employee')
      .where('employee.status = :status', { status: 'active' });

    // Apply department filter if provided
    if (filters.department) {
      activeEmployeesQuery.andWhere('employee.department = :department', {
        department: filters.department
      });
    }

    const activeEmployees = await activeEmployeesQuery.getMany();

    // Get employees who have attendance records for the date
    const presentEmployees = await attendanceRepo
      .createQueryBuilder('attendance')
      .select('attendance.employeeId')
      .where('DATE(attendance.timestamp) = :date', { date })
      .andWhere('attendance.status IN (:...statuses)', {
        statuses: ['present', 'late', 'half-day']
      })
      .getRawMany();

    const presentEmployeeIds = new Set(
      presentEmployees.map(emp => emp.attendance_employeeId)
    );

    // Filter out employees who are on leave (have 'on-leave' status)
    const onLeaveEmployees = await attendanceRepo
      .createQueryBuilder('attendance')
      .select('attendance.employeeId')
      .where('DATE(attendance.timestamp) = :date', { date })
      .andWhere('attendance.status = :status', { status: 'on-leave' })
      .getRawMany();

    const onLeaveEmployeeIds = new Set(
      onLeaveEmployees.map(emp => emp.attendance_employeeId)
    );

    // Identify absent employees (active but not present and not on leave)
    const absentEmployees = activeEmployees.filter(employee => 
      !presentEmployeeIds.has(employee.id) && 
      !onLeaveEmployeeIds.has(employee.id)
    );

    // Get attendance patterns for the past 7 days for context
    const sevenDaysAgo = new Date(date);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const startDate = sevenDaysAgo.toISOString().split('T')[0];

    const recentAttendance = await attendanceRepo
      .createQueryBuilder('attendance')
      .select(['attendance.employeeId', 'attendance.status', 'attendance.timestamp'])
      .where('DATE(attendance.timestamp) BETWEEN :startDate AND :date', {
        startDate,
        date
      })
      .andWhere('attendance.employeeId IN (:...employeeIds)', {
        employeeIds: absentEmployees.map(emp => emp.id)
      })
      .getMany();

    // Group recent attendance by employee
    const recentAttendanceByEmployee = recentAttendance.reduce((acc, record) => {
      const empId = record.employeeId;
      if (!acc[empId]) {
        acc[empId] = [];
      }
      acc[empId].push({
        date: record.timestamp.toISOString().split('T')[0],
        status: record.status
      });
      return acc;
    }, {});

    // Enhance absent employees with recent attendance patterns
    const enhancedAbsentees = absentEmployees.map(employee => {
      const recentPattern = recentAttendanceByEmployee[employee.id] || [];
      const absentDays = recentPattern.filter(r => 
        !['present', 'late', 'half-day'].includes(r.status)
      ).length;
      
      return {
        ...employee,
        recentAttendancePattern: recentPattern,
        consecutiveAbsentDays: absentDays,
        lastPresentDate: recentPattern
          .filter(r => ['present', 'late', 'half-day'].includes(r.status))
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.date || null
      };
    });

    return {
      status: true,
      message: `Absent employees for ${date} retrieved successfully`,
      data: {
        absentEmployees: enhancedAbsentees,
        date,
        count: absentEmployees.length,
        summary: {
          totalActiveEmployees: activeEmployees.length,
          presentCount: presentEmployeeIds.size,
          onLeaveCount: onLeaveEmployeeIds.size,
          absentCount: absentEmployees.length,
          absenceRate: (absentEmployees.length / activeEmployees.length * 100).toFixed(2) + '%'
        },
        statistics: {
          byDepartment: absentEmployees.reduce((acc, emp) => {
            acc[emp.department] = (acc[emp.department] || 0) + 1;
            return acc;
          }, {}),
          frequentAbsentees: enhancedAbsentees
            .filter(emp => emp.consecutiveAbsentDays >= 3)
            .sort((a, b) => b.consecutiveAbsentDays - a.consecutiveAbsentDays)
            .slice(0, 10)
        }
      }
    };
  } catch (error) {
    logger.error('Failed to get absent employees:', error);
    
    return {
      status: false,
      message: `Failed to get absent employees: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
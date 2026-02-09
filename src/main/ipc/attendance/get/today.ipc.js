/**
 * @file Get today's attendance
 * @type {import('../../../types/ipc').AttendanceGetTodayHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Get today's attendance logs
 * @param {import('../../../types/ipc').AttendanceFilters} [filters] - Optional filters
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (filters = {}) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const attendanceRepo = AppDataSource.getRepository('AttendanceLog');
    
    const queryBuilder = attendanceRepo
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee')
      .where('DATE(attendance.timestamp) = :today', { today })
      .orderBy('attendance.timestamp', 'DESC');

    // Apply filters
    if (filters.employeeId) {
      queryBuilder.andWhere('attendance.employeeId = :employeeId', {
        employeeId: filters.employeeId
      });
    }
    
    if (filters.status) {
      queryBuilder.andWhere('attendance.status = :status', {
        status: filters.status
      });
    }
    
    if (filters.department) {
      queryBuilder.andWhere('employee.department = :department', {
        department: filters.department
      });
    }

    const attendanceLogs = await queryBuilder.getMany();

    // Get all active employees for comparison
    const employeeRepo = AppDataSource.getRepository('Employee');
    const activeEmployees = await employeeRepo.find({
      where: { status: 'active' }
    });

    // Identify absent employees
    const presentEmployeeIds = new Set(
      attendanceLogs.filter(log => 
        ['present', 'late', 'half-day'].includes(log.status)
      ).map(log => log.employeeId)
    );

    const absentEmployees = activeEmployees.filter(
      employee => !presentEmployeeIds.has(employee.id)
    );

    // Calculate summary statistics
    const statusCounts = attendanceLogs.reduce((acc, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1;
      return acc;
    }, {});

    return {
      status: true,
      message: `Today's attendance (${today}) retrieved successfully`,
      data: {
        logs: attendanceLogs,
        date: today,
        summary: {
          totalRecords: attendanceLogs.length,
          totalActiveEmployees: activeEmployees.length,
          presentCount: presentEmployeeIds.size,
          absentCount: absentEmployees.length,
          statusDistribution: statusCounts,
          attendanceRate: activeEmployees.length > 0 
            ? (presentEmployeeIds.size / activeEmployees.length * 100).toFixed(2)
            : 0
        },
        absentEmployees: absentEmployees.map(emp => ({
          id: emp.id,
          employeeNumber: emp.employeeNumber,
          firstName: emp.firstName,
          lastName: emp.lastName,
          department: emp.department
        }))
      }
    };
  } catch (error) {
    logger.error('Failed to get today\'s attendance:', error);
    
    return {
      status: false,
      message: `Failed to get today's attendance: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
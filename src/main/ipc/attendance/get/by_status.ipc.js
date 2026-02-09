/**
 * @file Get attendance logs by status
 * @type {import('../../../types/ipc').AttendanceGetByStatusHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Get attendance logs by status
 * @param {string} status - Attendance status (present, absent, late, half-day, etc.)
 * @param {import('../../../types/ipc').AttendanceFilters} [filters] - Optional filters
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (status, filters = {}) => {
  try {
    if (!status) {
      return {
        status: false,
        message: 'Status is required',
        data: null
      };
    }

    // Validate status against known values
    const validStatuses = ['present', 'absent', 'late', 'half-day', 'on-leave', 'holiday'];
    if (!validStatuses.includes(status.toLowerCase())) {
      return {
        status: false,
        message: `Invalid status. Valid values: ${validStatuses.join(', ')}`,
        data: null
      };
    }

    const attendanceRepo = AppDataSource.getRepository('AttendanceLog');
    
    const queryBuilder = attendanceRepo
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee')
      .where('attendance.status = :status', { status: status.toLowerCase() })
      .orderBy('attendance.timestamp', 'DESC');

    // Apply date filters
    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere(
        'DATE(attendance.timestamp) BETWEEN :startDate AND :endDate',
        { startDate: filters.startDate, endDate: filters.endDate }
      );
    }
    
    if (filters.date) {
      queryBuilder.andWhere(
        'DATE(attendance.timestamp) = :date',
        { date: filters.date }
      );
    }
    
    if (filters.employeeId) {
      queryBuilder.andWhere('attendance.employeeId = :employeeId', {
        employeeId: filters.employeeId
      });
    }
    
    if (filters.department) {
      queryBuilder.andWhere('employee.department = :department', {
        department: filters.department
      });
    }

    const attendanceLogs = await queryBuilder.getMany();

    return {
      status: true,
      message: `Attendance logs with status '${status}' retrieved successfully`,
      data: {
        logs: attendanceLogs,
        status,
        count: attendanceLogs.length,
        summary: {
          totalRecords: attendanceLogs.length,
          uniqueEmployees: new Set(attendanceLogs.map(log => log.employeeId)).size,
          averageHoursWorked: attendanceLogs.length > 0 
            ? attendanceLogs.reduce((sum, log) => sum + parseFloat(log.hoursWorked), 0) / attendanceLogs.length
            : 0
        }
      }
    };
  } catch (error) {
    logger.error('Failed to get attendance logs by status:', error);
    
    return {
      status: false,
      message: `Failed to get attendance logs by status: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
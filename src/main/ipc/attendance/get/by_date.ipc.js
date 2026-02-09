/**
 * @file Get attendance logs by date
 * @type {import('../../../types/ipc').AttendanceGetByDateHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Get attendance logs by specific date
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
    
    const queryBuilder = attendanceRepo
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee')
      .where('DATE(attendance.timestamp) = :date', { date })
      .orderBy('attendance.timestamp', 'ASC');

    // Apply additional filters
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

    // Group by status for summary
    const statusSummary = attendanceLogs.reduce((acc, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1;
      return acc;
    }, {});

    return {
      status: true,
      message: `Attendance logs for ${date} retrieved successfully`,
      data: {
        logs: attendanceLogs,
        date,
        count: attendanceLogs.length,
        summary: statusSummary,
        totalEmployees: new Set(attendanceLogs.map(log => log.employeeId)).size
      }
    };
  } catch (error) {
    logger.error('Failed to get attendance logs by date:', error);
    
    return {
      status: false,
      message: `Failed to get attendance logs by date: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
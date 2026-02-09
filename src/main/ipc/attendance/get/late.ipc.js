/**
 * @file Get late employees for a specific date
 * @type {import('../../../types/ipc').AttendanceGetLateHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Get late employees
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
      .andWhere('attendance.status = :status', { status: 'late' })
      .orderBy('attendance.lateMinutes', 'DESC');

    // Apply additional filters
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

    const lateAttendanceLogs = await queryBuilder.getMany();

    // Calculate statistics
    const stats = lateAttendanceLogs.reduce((acc, log) => {
      acc.totalLateEmployees++;
      acc.totalLateMinutes += log.lateMinutes || 0;
      acc.averageLateMinutes = acc.totalLateMinutes / acc.totalLateEmployees;
      
      // Categorize by late minutes
      if (log.lateMinutes <= 15) {
        acc.byDuration['0-15'] = (acc.byDuration['0-15'] || 0) + 1;
      } else if (log.lateMinutes <= 30) {
        acc.byDuration['16-30'] = (acc.byDuration['16-30'] || 0) + 1;
      } else if (log.lateMinutes <= 60) {
        acc.byDuration['31-60'] = (acc.byDuration['31-60'] || 0) + 1;
      } else {
        acc.byDuration['60+'] = (acc.byDuration['60+'] || 0) + 1;
      }
      
      return acc;
    }, {
      totalLateEmployees: 0,
      totalLateMinutes: 0,
      averageLateMinutes: 0,
      byDuration: {}
    });

    return {
      status: true,
      message: `Late employees for ${date} retrieved successfully`,
      data: {
        logs: lateAttendanceLogs,
        date,
        count: lateAttendanceLogs.length,
        statistics: stats,
        summary: {
          totalLateEmployees: stats.totalLateEmployees,
          totalLateMinutes: stats.totalLateMinutes,
          averageLateMinutes: parseFloat(stats.averageLateMinutes.toFixed(2)),
          lateDistribution: stats.byDuration
        }
      }
    };
  } catch (error) {
    logger.error('Failed to get late employees:', error);
    
    return {
      status: false,
      message: `Failed to get late employees: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
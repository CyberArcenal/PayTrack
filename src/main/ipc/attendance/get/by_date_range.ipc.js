/**
 * @file Get attendance logs by date range
 * @type {import('../../../types/ipc').AttendanceGetByDateRangeHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Get attendance logs by date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {import('../../../types/ipc').AttendanceFilters} [filters] - Optional filters
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (startDate, endDate, filters = {}) => {
  try {
    // Validate dates
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!startDate || !dateRegex.test(startDate)) {
      return {
        status: false,
        message: 'Valid start date in YYYY-MM-DD format is required',
        data: null
      };
    }
    
    if (!endDate || !dateRegex.test(endDate)) {
      return {
        status: false,
        message: 'Valid end date in YYYY-MM-DD format is required',
        data: null
      };
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      return {
        status: false,
        message: 'Start date must be before or equal to end date',
        data: null
      };
    }

    const attendanceRepo = AppDataSource.getRepository('AttendanceLog');
    
    const queryBuilder = attendanceRepo
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee')
      .where('DATE(attendance.timestamp) BETWEEN :startDate AND :endDate', {
        startDate,
        endDate
      })
      .orderBy('attendance.timestamp', 'ASC');

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

    // Group by date for daily summary
    const dailySummary = attendanceLogs.reduce((acc, log) => {
      const date = log.timestamp.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = {
          date,
          total: 0,
          byStatus: {},
          employees: new Set()
        };
      }
      
      acc[date].total++;
      acc[date].byStatus[log.status] = (acc[date].byStatus[log.status] || 0) + 1;
      acc[date].employees.add(log.employeeId);
      
      return acc;
    }, {});

    // Convert Set to count for each date
    Object.keys(dailySummary).forEach(date => {
      dailySummary[date].employeeCount = dailySummary[date].employees.size;
      delete dailySummary[date].employees;
    });

    return {
      status: true,
      message: `Attendance logs from ${startDate} to ${endDate} retrieved successfully`,
      data: {
        logs: attendanceLogs,
        dateRange: { startDate, endDate },
        count: attendanceLogs.length,
        dailySummary,
        summary: {
          totalDays: Object.keys(dailySummary).length,
          totalRecords: attendanceLogs.length,
          uniqueEmployees: new Set(attendanceLogs.map(log => log.employeeId)).size
        }
      }
    };
  } catch (error) {
    logger.error('Failed to get attendance logs by date range:', error);
    
    return {
      status: false,
      message: `Failed to get attendance logs by date range: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
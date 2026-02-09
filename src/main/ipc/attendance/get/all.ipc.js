/**
 * @file Get all attendance logs with optional filters
 * @type {import('../../../types/ipc').AttendanceGetAllHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Get all attendance logs with filters
 * @param {import('../../../types/ipc').AttendanceFilters} [filters={}] 
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (filters = {}) => {
  try {
    const attendanceRepo = AppDataSource.getRepository('AttendanceLog');
    
    // Build query with filters
    const queryBuilder = attendanceRepo
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee')
      .orderBy('attendance.timestamp', 'DESC');

    // Apply filters if provided
    if (filters) {
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
      
      if (filters.source) {
        queryBuilder.andWhere('attendance.source = :source', { 
          source: filters.source 
        });
      }
      
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
      
      // Pagination
      if (filters.limit) {
        queryBuilder.limit(filters.limit);
      }
      
      if (filters.offset) {
        queryBuilder.offset(filters.offset);
      }
    }

    const attendanceLogs = await queryBuilder.getMany();
    const totalCount = await queryBuilder.getCount();

    return {
      status: true,
      message: 'Attendance logs retrieved successfully',
      data: {
        logs: attendanceLogs,
        total: totalCount,
        count: attendanceLogs.length
      }
    };
  } catch (error) {
    logger.error('Failed to get attendance logs:', error);
    
    return {
      status: false,
      message: `Failed to get attendance logs: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
/**
 * @file Get attendance logs by employee
 * @type {import('../../../types/ipc').AttendanceGetByEmployeeHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Get attendance logs by employee
 * @param {number} employeeId - Employee ID
 * @param {import('../../../types/ipc').DateRange} [dateRange] - Optional date range
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (employeeId, dateRange) => {
  try {
    if (!employeeId || isNaN(Number(employeeId))) {
      return {
        status: false,
        message: 'Valid employee ID is required',
        data: null
      };
    }

    const attendanceRepo = AppDataSource.getRepository('AttendanceLog');
    
    const queryBuilder = attendanceRepo
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee')
      .where('attendance.employeeId = :employeeId', { employeeId: Number(employeeId) })
      .orderBy('attendance.timestamp', 'DESC');

    // Apply date range if provided
    if (dateRange?.startDate && dateRange?.endDate) {
      queryBuilder.andWhere(
        'DATE(attendance.timestamp) BETWEEN :startDate AND :endDate',
        { 
          startDate: dateRange.startDate, 
          endDate: dateRange.endDate 
        }
      );
    }

    const attendanceLogs = await queryBuilder.getMany();

    return {
      status: true,
      message: 'Employee attendance logs retrieved successfully',
      data: {
        logs: attendanceLogs,
        count: attendanceLogs.length,
        employeeId: Number(employeeId)
      }
    };
  } catch (error) {
    logger.error('Failed to get employee attendance logs:', error);
    
    return {
      status: false,
      message: `Failed to get employee attendance logs: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
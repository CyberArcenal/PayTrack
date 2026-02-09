/**
 * @file Get attendance log by ID
 * @type {import('../../../types/ipc').AttendanceGetByIdHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Get attendance log by ID
 * @param {number} id - Attendance log ID
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (id) => {
  try {
    if (!id || isNaN(Number(id))) {
      return {
        status: false,
        message: 'Valid attendance log ID is required',
        data: null
      };
    }

    const attendanceRepo = AppDataSource.getRepository('AttendanceLog');
    
    const attendanceLog = await attendanceRepo.findOne({
      where: { id: Number(id) },
      relations: ['employee', 'payrollRecord']
    });

    if (!attendanceLog) {
      return {
        status: false,
        message: `Attendance log with ID ${id} not found`,
        data: null
      };
    }

    return {
      status: true,
      message: 'Attendance log retrieved successfully',
      data: attendanceLog
    };
  } catch (error) {
    logger.error('Failed to get attendance log by ID:', error);
    
    return {
      status: false,
      message: `Failed to get attendance log: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
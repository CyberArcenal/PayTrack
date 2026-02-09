/**
 * @file Delete attendance log
 * @type {import('../../../types/ipc').AttendanceDeleteHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Delete attendance log
 * @param {import('../../../types/ipc').DeleteAttendanceParams} params - Delete parameters
 * @param {import('typeorm').QueryRunner} [queryRunner] - Optional query runner for transaction
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (params, queryRunner = null) => {
  let connection = queryRunner ? queryRunner.manager : AppDataSource.manager;
  
  try {
    // Validate required parameters
    if (!params.id || isNaN(Number(params.id))) {
      return {
        status: false,
        message: 'Valid attendance log ID is required',
        data: null
      };
    }

    const attendanceId = Number(params.id);
    const attendanceRepo = connection.getRepository('AttendanceLog');
    
    // Check if attendance log exists
    const existingAttendance = await attendanceRepo.findOne({
      where: { id: attendanceId }
    });

    if (!existingAttendance) {
      return {
        status: false,
        message: `Attendance log with ID ${attendanceId} not found`,
        data: null
      };
    }

    // Check if attendance is linked to payroll (cannot delete if processed)
    if (existingAttendance.payrollRecordId) {
      return {
        status: false,
        message: 'Cannot delete attendance that has been processed in payroll',
        data: null
      };
    }

    // Store data for audit log
    const deletedData = {
      id: existingAttendance.id,
      employeeId: existingAttendance.employeeId,
      timestamp: existingAttendance.timestamp,
      status: existingAttendance.status,
      hoursWorked: existingAttendance.hoursWorked,
      source: existingAttendance.source
    };

    // Delete attendance log
    await attendanceRepo.delete(attendanceId);

    // Log the deletion
    logger.warn(`Attendance log ${attendanceId} deleted`, deletedData);

    return {
      status: true,
      message: 'Attendance log deleted successfully',
      data: deletedData
    };
  } catch (error) {
    logger.error('Failed to delete attendance log:', error);
    
    return {
      status: false,
      message: `Failed to delete attendance log: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
/**
 * @file Create new attendance log
 * @type {import('../../../types/ipc').AttendanceCreateHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Create new attendance log
 * @param {import('../../../types/ipc').CreateAttendanceParams} params - Attendance data
 * @param {import('typeorm').QueryRunner} [queryRunner] - Optional query runner for transaction
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (params, queryRunner = null) => {
  let connection = queryRunner ? queryRunner.manager : AppDataSource.manager;
  
  try {
    // Validate required parameters
    if (!params.employeeId || isNaN(Number(params.employeeId))) {
      return {
        status: false,
        message: 'Valid employee ID is required',
        data: null
      };
    }

    if (!params.timestamp) {
      return {
        status: false,
        message: 'Timestamp is required',
        data: null
      };
    }

    // Validate employee exists
    const employeeRepo = connection.getRepository('Employee');
    const employee = await employeeRepo.findOne({
      where: { id: Number(params.employeeId), status: 'active' }
    });

    if (!employee) {
      return {
        status: false,
        message: 'Active employee not found',
        data: null
      };
    }

    // Check for duplicate attendance on same day
    const attendanceRepo = connection.getRepository('AttendanceLog');
    const dateStr = new Date(params.timestamp).toISOString().split('T')[0];
    
    const existingAttendance = await attendanceRepo
      .createQueryBuilder('attendance')
      .where('attendance.employeeId = :employeeId', { 
        employeeId: Number(params.employeeId) 
      })
      .andWhere('DATE(attendance.timestamp) = :date', { date: dateStr })
      .getCount();

    if (existingAttendance > 0) {
      return {
        status: false,
        message: 'Attendance already recorded for this employee today',
        data: null
      };
    }

    // Prepare attendance data
    const attendanceData = {
      employeeId: Number(params.employeeId),
      timestamp: new Date(params.timestamp),
      source: params.source || 'manual',
      status: params.status || 'present',
      hoursWorked: parseFloat(params.hoursWorked || 8.0),
      overtimeHours: parseFloat(params.overtimeHours || 0.0),
      lateMinutes: parseInt(params.lateMinutes || 0),
      note: params.note || null
    };

    // Validate numeric values
    if (isNaN(attendanceData.hoursWorked) || attendanceData.hoursWorked < 0) {
      return {
        status: false,
        message: 'Invalid hours worked value',
        data: null
      };
    }

    if (isNaN(attendanceData.overtimeHours) || attendanceData.overtimeHours < 0) {
      return {
        status: false,
        message: 'Invalid overtime hours value',
        data: null
      };
    }

    if (isNaN(attendanceData.lateMinutes) || attendanceData.lateMinutes < 0) {
      return {
        status: false,
        message: 'Invalid late minutes value',
        data: null
      };
    }

    // Create attendance log
    const attendanceLog = attendanceRepo.create(attendanceData);
    const savedAttendance = await attendanceRepo.save(attendanceLog);

    // Log the creation
    logger.info(`Attendance created for employee ${params.employeeId}`, {
      attendanceId: savedAttendance.id,
      timestamp: savedAttendance.timestamp,
      status: savedAttendance.status
    });

    return {
      status: true,
      message: 'Attendance log created successfully',
      data: savedAttendance
    };
  } catch (error) {
    logger.error('Failed to create attendance log:', error);
    
    // Check for unique constraint violation
    if (error.code === 'SQLITE_CONSTRAINT' || error.code === '23505') {
      return {
        status: false,
        message: 'Duplicate attendance record detected',
        data: null,
        error: error.message
      };
    }
    
    return {
      status: false,
      message: `Failed to create attendance log: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
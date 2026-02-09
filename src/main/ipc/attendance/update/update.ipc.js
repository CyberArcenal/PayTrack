/**
 * @file Update attendance log
 * @type {import('../../../types/ipc').AttendanceUpdateHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Update attendance log
 * @param {import('../../../types/ipc').UpdateAttendanceParams} params - Update parameters
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

    // Prepare update data
    const updateData = {};
    
    if (params.timestamp !== undefined) {
      updateData.timestamp = new Date(params.timestamp);
    }
    
    if (params.status !== undefined) {
      updateData.status = params.status;
    }
    
    if (params.source !== undefined) {
      updateData.source = params.source;
    }
    
    if (params.hoursWorked !== undefined) {
      const hours = parseFloat(params.hoursWorked);
      if (isNaN(hours) || hours < 0) {
        return {
          status: false,
          message: 'Invalid hours worked value',
          data: null
        };
      }
      updateData.hoursWorked = hours;
    }
    
    if (params.overtimeHours !== undefined) {
      const overtime = parseFloat(params.overtimeHours);
      if (isNaN(overtime) || overtime < 0) {
        return {
          status: false,
          message: 'Invalid overtime hours value',
          data: null
        };
      }
      updateData.overtimeHours = overtime;
    }
    
    if (params.lateMinutes !== undefined) {
      const lateMins = parseInt(params.lateMinutes);
      if (isNaN(lateMins) || lateMins < 0) {
        return {
          status: false,
          message: 'Invalid late minutes value',
          data: null
        };
      }
      updateData.lateMinutes = lateMins;
    }
    
    if (params.note !== undefined) {
      updateData.note = params.note;
    }

    // Check for duplicate if changing date
    if (params.timestamp) {
      const dateStr = new Date(params.timestamp).toISOString().split('T')[0];
      const existingOnDate = await attendanceRepo
        .createQueryBuilder('attendance')
        .where('attendance.employeeId = :employeeId', { 
          employeeId: existingAttendance.employeeId 
        })
        .andWhere('DATE(attendance.timestamp) = :date', { date: dateStr })
        .andWhere('attendance.id != :id', { id: attendanceId })
        .getCount();

      if (existingOnDate > 0) {
        return {
          status: false,
          message: 'Another attendance record already exists for this employee on the specified date',
          data: null
        };
      }
    }

    // Update attendance log
    await attendanceRepo.update(attendanceId, updateData);

    // Get updated record
    const updatedAttendance = await attendanceRepo.findOne({
      where: { id: attendanceId },
      relations: ['employee']
    });

    // Log the update
    logger.info(`Attendance log ${attendanceId} updated`, {
      attendanceId,
      updatedFields: Object.keys(updateData)
    });

    return {
      status: true,
      message: 'Attendance log updated successfully',
      data: updatedAttendance
    };
  } catch (error) {
    logger.error('Failed to update attendance log:', error);
    
    // Check for constraint violations
    if (error.code === 'SQLITE_CONSTRAINT' || error.code === '23505') {
      return {
        status: false,
        message: 'Update would create duplicate attendance record',
        data: null,
        error: error.message
      };
    }
    
    return {
      status: false,
      message: `Failed to update attendance log: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
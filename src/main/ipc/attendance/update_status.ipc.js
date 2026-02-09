/**
 * @file Update attendance status
 * @type {import('../../../types/ipc').AttendanceUpdateStatusHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Update attendance status
 * @param {import('../../../types/ipc').UpdateAttendanceStatusParams} params - Status update parameters
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

    if (!params.status) {
      return {
        status: false,
        message: 'Status is required',
        data: null
      };
    }

    const attendanceId = Number(params.id);
    const newStatus = params.status.toLowerCase();
    
    // Validate status
    const validStatuses = ['present', 'absent', 'late', 'half-day', 'on-leave', 'holiday'];
    if (!validStatuses.includes(newStatus)) {
      return {
        status: false,
        message: `Invalid status. Valid values: ${validStatuses.join(', ')}`,
        data: null
      };
    }

    const attendanceRepo = connection.getRepository('AttendanceLog');
    
    // Check if attendance log exists
    const existingAttendance = await attendanceRepo.findOne({
      where: { id: attendanceId },
      relations: ['employee']
    });

    if (!existingAttendance) {
      return {
        status: false,
        message: `Attendance log with ID ${attendanceId} not found`,
        data: null
      };
    }

    // Check if attendance is linked to payroll
    if (existingAttendance.payrollRecordId) {
      return {
        status: false,
        message: 'Cannot update status of attendance that has been processed in payroll',
        data: null
      };
    }

    // Prepare update data
    const updateData = {
      status: newStatus,
      note: params.note ? 
        `${existingAttendance.note || ''} ${params.note}`.trim() : 
        existingAttendance.note
    };

    // If status is changing from/to certain statuses, adjust hours
    if (existingAttendance.status !== newStatus) {
      // If changing to absent, set hours to 0
      if (newStatus === 'absent') {
        updateData.hoursWorked = 0;
        updateData.overtimeHours = 0;
        updateData.lateMinutes = 0;
      }
      
      // If changing from absent to present/late/half-day, restore default hours if needed
      if (existingAttendance.status === 'absent' && 
          ['present', 'late', 'half-day'].includes(newStatus) &&
          existingAttendance.hoursWorked === 0) {
        updateData.hoursWorked = 8.0;
      }
      
      // If changing to half-day, halve the hours
      if (newStatus === 'half-day' && existingAttendance.hoursWorked > 0) {
        updateData.hoursWorked = parseFloat((existingAttendance.hoursWorked / 2).toFixed(2));
        updateData.overtimeHours = 0;
      }
    }

    // Update late minutes if provided
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

    // Update attendance log
    await attendanceRepo.update(attendanceId, updateData);

    // Get updated record
    const updatedAttendance = await attendanceRepo.findOne({
      where: { id: attendanceId },
      relations: ['employee']
    });

    // Log the status update
    logger.info(`Attendance status updated for log ${attendanceId}`, {
      attendanceId,
      employeeId: updatedAttendance.employeeId,
      employeeName: `${updatedAttendance.employee.firstName} ${updatedAttendance.employee.lastName}`,
      oldStatus: existingAttendance.status,
      newStatus: updatedAttendance.status,
      updatedBy: params.updatedBy || 'system'
    });

    return {
      status: true,
      message: 'Attendance status updated successfully',
      data: updatedAttendance
    };
  } catch (error) {
    logger.error('Failed to update attendance status:', error);
    
    return {
      status: false,
      message: `Failed to update attendance status: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
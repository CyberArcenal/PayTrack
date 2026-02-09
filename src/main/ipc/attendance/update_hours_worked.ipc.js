/**
 * @file Update hours worked for attendance
 * @type {import('../../../types/ipc').AttendanceUpdateHoursHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Update hours worked for attendance
 * @param {import('../../../types/ipc').UpdateHoursWorkedParams} params - Hours update parameters
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

    if (params.hoursWorked === undefined && params.overtimeHours === undefined) {
      return {
        status: false,
        message: 'Either hoursWorked or overtimeHours must be provided',
        data: null
      };
    }

    const attendanceId = Number(params.id);
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
        message: 'Cannot update hours for attendance that has been processed in payroll',
        data: null
      };
    }

    // Validate and prepare update data
    const updateData = {};
    
    if (params.hoursWorked !== undefined) {
      const hours = parseFloat(params.hoursWorked);
      if (isNaN(hours) || hours < 0 || hours > 24) {
        return {
          status: false,
          message: 'Hours worked must be between 0 and 24',
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
          message: 'Overtime hours must be a positive number',
          data: null
        };
      }
      updateData.overtimeHours = overtime;
    }
    
    if (params.recalculateOvertime) {
      // Recalculate overtime based on standard 8-hour work day
      const hours = params.hoursWorked !== undefined ? 
        parseFloat(params.hoursWorked) : existingAttendance.hoursWorked;
      
      if (hours > 8) {
        updateData.overtimeHours = parseFloat((hours - 8).toFixed(2));
      } else {
        updateData.overtimeHours = 0;
      }
    }

    // Update note if provided
    if (params.note) {
      updateData.note = existingAttendance.note ? 
        `${existingAttendance.note} ${params.note}`.trim() : 
        params.note;
    }

    // Update status if hours suggest half-day
    if (params.autoAdjustStatus) {
      const hours = updateData.hoursWorked !== undefined ? 
        updateData.hoursWorked : existingAttendance.hoursWorked;
      
      if (hours > 0 && hours < 4 && existingAttendance.status === 'present') {
        updateData.status = 'half-day';
      } else if (hours >= 4 && existingAttendance.status === 'half-day') {
        updateData.status = 'present';
      }
    }

    // Update attendance log
    await attendanceRepo.update(attendanceId, updateData);

    // Get updated record
    const updatedAttendance = await attendanceRepo.findOne({
      where: { id: attendanceId },
      relations: ['employee']
    });

    // Calculate payroll impact for logging
    const hourlyRate = parseFloat(existingAttendance.employee.hourlyRate) || 0;
    const overtimeRate = parseFloat(existingAttendance.employee.overtimeRate) || 1.25;
    
    const regularPay = updatedAttendance.hoursWorked * hourlyRate;
    const overtimePay = updatedAttendance.overtimeHours * hourlyRate * overtimeRate;
    const totalPay = regularPay + overtimePay;

    // Log the hours update
    logger.info(`Hours updated for attendance log ${attendanceId}`, {
      attendanceId,
      employeeId: updatedAttendance.employeeId,
      employeeName: `${updatedAttendance.employee.firstName} ${updatedAttendance.employee.lastName}`,
      oldHours: existingAttendance.hoursWorked,
      newHours: updatedAttendance.hoursWorked,
      oldOvertime: existingAttendance.overtimeHours,
      newOvertime: updatedAttendance.overtimeHours,
      payrollImpact: {
        regularPay: parseFloat(regularPay.toFixed(2)),
        overtimePay: parseFloat(overtimePay.toFixed(2)),
        totalPay: parseFloat(totalPay.toFixed(2))
      },
      updatedBy: params.updatedBy || 'system'
    });

    return {
      status: true,
      message: 'Hours worked updated successfully',
      data: updatedAttendance
    };
  } catch (error) {
    logger.error('Failed to update hours worked:', error);
    
    return {
      status: false,
      message: `Failed to update hours worked: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
/**
 * @file Approve/reject overtime log
 * @type {import('../../../types/ipc').AttendanceApproveOvertimeHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Approve/reject overtime log
 * @param {import('../../../types/ipc').ApproveOvertimeParams} params - Overtime approval parameters
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
        message: 'Valid overtime log ID is required',
        data: null
      };
    }

    if (!params.approvalStatus) {
      return {
        status: false,
        message: 'Approval status is required',
        data: null
      };
    }

    const overtimeId = Number(params.id);
    const newStatus = params.approvalStatus.toLowerCase();
    
    // Validate approval status
    const validStatuses = ['approved', 'rejected', 'pending'];
    if (!validStatuses.includes(newStatus)) {
      return {
        status: false,
        message: `Invalid approval status. Valid values: ${validStatuses.join(', ')}`,
        data: null
      };
    }

    if (!params.approvedBy && newStatus !== 'pending') {
      return {
        status: false,
        message: 'Approver name is required for approval/rejection',
        data: null
      };
    }

    const overtimeRepo = connection.getRepository('OvertimeLog');
    
    // Check if overtime log exists
    const existingOvertime = await overtimeRepo.findOne({
      where: { id: overtimeId },
      relations: ['employee']
    });

    if (!existingOvertime) {
      return {
        status: false,
        message: `Overtime log with ID ${overtimeId} not found`,
        data: null
      };
    }

    // Check if already processed in payroll
    if (existingOvertime.payrollRecordId && newStatus !== existingOvertime.approvalStatus) {
      return {
        status: false,
        message: 'Cannot change status of overtime that has been processed in payroll',
        data: null
      };
    }

    // Prepare update data
    const updateData = {
      approvalStatus: newStatus,
      approvedBy: newStatus !== 'pending' ? params.approvedBy : null
    };

    // Add note if provided
    if (params.note) {
      const timestamp = new Date().toLocaleString();
      const statusText = newStatus === 'approved' ? 'Approved' : 'Rejected';
      const noteEntry = `${timestamp} [${params.approvedBy}]: ${statusText} - ${params.note}`;
      
      updateData.note = existingOvertime.note ? 
        `${existingOvertime.note}\n${noteEntry}` : 
        noteEntry;
    }

    // Update overtime log
    await overtimeRepo.update(overtimeId, updateData);

    // Get updated record
    const updatedOvertime = await overtimeRepo.findOne({
      where: { id: overtimeId },
      relations: ['employee', 'payrollRecord']
    });

    // Update related attendance log if exists
    if (params.updateAttendance && updatedOvertime.date) {
      try {
        const attendanceRepo = connection.getRepository('AttendanceLog');
        const dateStr = updatedOvertime.date;
        
        // Find attendance for the same employee and date
        const attendance = await attendanceRepo
          .createQueryBuilder('attendance')
          .where('attendance.employeeId = :employeeId', { 
            employeeId: updatedOvertime.employeeId 
          })
          .andWhere('DATE(attendance.timestamp) = :date', { date: dateStr })
          .getOne();

        if (attendance) {
          // Update overtime hours in attendance
          const currentOvertime = parseFloat(attendance.overtimeHours) || 0;
          const newOvertime = newStatus === 'approved' ? 
            currentOvertime + parseFloat(updatedOvertime.hours) : 
            currentOvertime;
          
          await attendanceRepo.update(attendance.id, {
            overtimeHours: parseFloat(newOvertime.toFixed(2)),
            note: attendance.note ? 
              `${attendance.note} Overtime ${newStatus}: ${updatedOvertime.hours} hours` :
              `Overtime ${newStatus}: ${updatedOvertime.hours} hours`
          });
        }
      } catch (attendanceError) {
        // Log but don't fail the whole operation
        logger.warn('Failed to update related attendance:', attendanceError);
      }
    }

    // Log the approval
    logger.info(`Overtime log ${overtimeId} ${newStatus}`, {
      overtimeId,
      employeeId: updatedOvertime.employeeId,
      employeeName: `${updatedOvertime.employee.firstName} ${updatedOvertime.employee.lastName}`,
      oldStatus: existingOvertime.approvalStatus,
      newStatus: updatedOvertime.approvalStatus,
      hours: updatedOvertime.hours,
      amount: updatedOvertime.amount,
      approvedBy: updatedOvertime.approvedBy
    });

    return {
      status: true,
      message: `Overtime log ${newStatus} successfully`,
      data: updatedOvertime
    };
  } catch (error) {
    logger.error('Failed to approve/reject overtime:', error);
    
    return {
      status: false,
      message: `Failed to update overtime status: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
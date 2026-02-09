/**
 * @file Add note to attendance log
 * @type {import('../../../types/ipc').AttendanceAddNoteHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Add note to attendance log
 * @param {import('../../../types/ipc').AddNoteParams} params - Note parameters
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

    if (!params.note || params.note.trim() === '') {
      return {
        status: false,
        message: 'Note content is required',
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

    // Prepare the new note
    const timestamp = new Date().toLocaleString();
    const userInfo = params.addedBy ? `[${params.addedBy}]` : '';
    const newNoteEntry = `${timestamp} ${userInfo}: ${params.note.trim()}`;
    
    let updatedNote;
    if (existingAttendance.note) {
      // Append to existing note
      updatedNote = `${existingAttendance.note}\n${newNoteEntry}`;
    } else {
      // Create new note
      updatedNote = newNoteEntry;
    }

    // Update attendance log with new note
    await attendanceRepo.update(attendanceId, { note: updatedNote });

    // Get updated record
    const updatedAttendance = await attendanceRepo.findOne({
      where: { id: attendanceId },
      relations: ['employee']
    });

    // Log the note addition
    logger.info(`Note added to attendance log ${attendanceId}`, {
      attendanceId,
      employeeId: updatedAttendance.employeeId,
      employeeName: `${updatedAttendance.employee.firstName} ${updatedAttendance.employee.lastName}`,
      noteLength: params.note.length,
      addedBy: params.addedBy || 'system'
    });

    return {
      status: true,
      message: 'Note added successfully',
      data: updatedAttendance
    };
  } catch (error) {
    logger.error('Failed to add note to attendance log:', error);
    
    return {
      status: false,
      message: `Failed to add note: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
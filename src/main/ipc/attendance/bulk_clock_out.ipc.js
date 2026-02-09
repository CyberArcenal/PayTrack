/**
 * @file Bulk clock out for multiple employees
 * @type {import('../../../types/ipc').AttendanceBulkClockOutHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Bulk clock out for multiple employees
 * @param {import('../../../types/ipc').BulkClockOutParams} params - Bulk clock out parameters
 * @param {import('typeorm').QueryRunner} [queryRunner] - Optional query runner for transaction
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (params, queryRunner = null) => {
  let connection = queryRunner ? queryRunner.manager : AppDataSource.manager;
  
  try {
    // Validate required parameters
    if (!params.employeeIds || !Array.isArray(params.employeeIds) || params.employeeIds.length === 0) {
      return {
        status: false,
        message: 'Array of employee IDs is required',
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

    const clockOutTime = new Date(params.timestamp);
    const dateStr = clockOutTime.toISOString().split('T')[0];
    const note = params.note || 'Bulk clock out';
    
    const attendanceRepo = connection.getRepository('AttendanceLog');

    // Get today's attendance records for the employees
    const attendanceRecords = await attendanceRepo
      .createQueryBuilder('attendance')
      .where('attendance.employeeId IN (:...employeeIds)', { 
        employeeIds: params.employeeIds.map(id => Number(id)) 
      })
      .andWhere('DATE(attendance.timestamp) = :date', { date: dateStr })
      .andWhere('attendance.hoursWorked = :hours', { hours: 0 }) // Only records without hours (not clocked out yet)
      .getMany();

    if (attendanceRecords.length === 0) {
      return {
        status: false,
        message: 'No attendance records found for clock out',
        data: null
      };
    }

    const results = {
      successful: [],
      failed: [],
      notFound: []
    };

    const employeeIdsWithAttendance = new Set(
      attendanceRecords.map(record => record.employeeId)
    );

    // Find employees without attendance records
    const missingEmployees = params.employeeIds.filter(id => 
      !employeeIdsWithAttendance.has(Number(id))
    );

    if (missingEmployees.length > 0) {
      // Try to find if they have attendance but already clocked out
      const alreadyClockedOut = await attendanceRepo
        .createQueryBuilder('attendance')
        .where('attendance.employeeId IN (:...employeeIds)', { 
          employeeIds: missingEmployees.map(id => Number(id)) 
        })
        .andWhere('DATE(attendance.timestamp) = :date', { date: dateStr })
        .andWhere('attendance.hoursWorked > :hours', { hours: 0 })
        .getMany();

      const alreadyClockedOutIds = new Set(
        alreadyClockedOut.map(record => record.employeeId)
      );

      missingEmployees.forEach(employeeId => {
        if (alreadyClockedOutIds.has(Number(employeeId))) {
          results.notFound.push({
            employeeId: Number(employeeId),
            reason: 'Already clocked out for today'
          });
        } else {
          results.notFound.push({
            employeeId: Number(employeeId),
            reason: 'No clock in record found for today'
          });
        }
      });
    }

    // Update attendance records with clock out information
    for (const attendance of attendanceRecords) {
      try {
        // Calculate hours worked
        const clockInTime = new Date(attendance.timestamp);
        const hoursWorked = (clockOutTime - clockInTime) / (1000 * 60 * 60); // Convert ms to hours
        
        if (hoursWorked < 0) {
          results.failed.push({
            employeeId: attendance.employeeId,
            attendanceId: attendance.id,
            error: 'Clock out time cannot be before clock in time'
          });
          continue;
        }

        // Calculate overtime (assuming standard 8-hour work day)
        let overtimeHours = 0;
        if (hoursWorked > 8) {
          overtimeHours = hoursWorked - 8;
        }

        // Update attendance record
        const updateData = {
          hoursWorked: parseFloat(hoursWorked.toFixed(2)),
          overtimeHours: parseFloat(overtimeHours.toFixed(2)),
          note: attendance.note ? `${attendance.note}; ${note}` : note
        };

        await attendanceRepo.update(attendance.id, updateData);

        // Get updated record
        const updatedAttendance = await attendanceRepo.findOne({
          where: { id: attendance.id },
          relations: ['employee']
        });

        results.successful.push({
          employeeId: attendance.employeeId,
          employeeNumber: updatedAttendance.employee.employeeNumber,
          name: `${updatedAttendance.employee.firstName} ${updatedAttendance.employee.lastName}`,
          attendanceId: attendance.id,
          clockInTime: attendance.timestamp,
          clockOutTime: clockOutTime,
          hoursWorked: updatedAttendance.hoursWorked,
          overtimeHours: updatedAttendance.overtimeHours
        });
      } catch (error) {
        results.failed.push({
          employeeId: attendance.employeeId,
          attendanceId: attendance.id,
          error: error.message
        });
      }
    }

    // Log the bulk operation
    logger.info('Bulk clock out completed', {
      totalRecords: attendanceRecords.length,
      successful: results.successful.length,
      failed: results.failed.length,
      notFound: results.notFound.length,
      timestamp: clockOutTime.toISOString()
    });

    return {
      status: true,
      message: `Bulk clock out completed: ${results.successful.length} successful, ${results.failed.length} failed, ${results.notFound.length} not found`,
      data: results
    };
  } catch (error) {
    logger.error('Failed to perform bulk clock out:', error);
    
    return {
      status: false,
      message: `Failed to perform bulk clock out: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
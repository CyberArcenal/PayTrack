/**
 * @file Bulk clock in for multiple employees
 * @type {import('../../../types/ipc').AttendanceBulkClockInHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Bulk clock in for multiple employees
 * @param {import('../../../types/ipc').BulkClockInParams} params - Bulk clock in parameters
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

    const timestamp = new Date(params.timestamp);
    const source = params.source || 'manual';
    const status = params.status || 'present';
    const note = params.note || 'Bulk clock in';
    
    const employeeRepo = connection.getRepository('Employee');
    const attendanceRepo = connection.getRepository('AttendanceLog');

    // Get active employees from the provided IDs
    const employees = await employeeRepo
      .createQueryBuilder('employee')
      .where('employee.id IN (:...ids)', { ids: params.employeeIds.map(id => Number(id)) })
      .andWhere('employee.status = :status', { status: 'active' })
      .getMany();

    if (employees.length === 0) {
      return {
        status: false,
        message: 'No active employees found from the provided IDs',
        data: null
      };
    }

    const results = {
      successful: [],
      failed: [],
      skipped: []
    };

    const dateStr = timestamp.toISOString().split('T')[0];
    
    // Check for existing attendance for each employee
    const existingAttendance = await attendanceRepo
      .createQueryBuilder('attendance')
      .where('attendance.employeeId IN (:...employeeIds)', { 
        employeeIds: employees.map(emp => emp.id) 
      })
      .andWhere('DATE(attendance.timestamp) = :date', { date: dateStr })
      .getMany();

    const existingEmployeeIds = new Set(
      existingAttendance.map(att => att.employeeId)
    );

    // Create attendance records for each employee
    for (const employee of employees) {
      try {
        // Skip if already has attendance for today
        if (existingEmployeeIds.has(employee.id)) {
          results.skipped.push({
            employeeId: employee.id,
            employeeNumber: employee.employeeNumber,
            name: `${employee.firstName} ${employee.lastName}`,
            reason: 'Attendance already recorded for today'
          });
          continue;
        }

        // Calculate if late (assuming standard start time of 8:00 AM)
        let lateMinutes = 0;
        let finalStatus = status;
        
        if (params.calculateLate) {
          const clockInTime = timestamp.getHours() * 60 + timestamp.getMinutes();
          const standardStartTime = 8 * 60; // 8:00 AM in minutes
          
          if (clockInTime > standardStartTime) {
            lateMinutes = clockInTime - standardStartTime;
            finalStatus = 'late';
          }
        }

        // Create attendance record
        const attendanceData = {
          employeeId: employee.id,
          timestamp: timestamp,
          source: source,
          status: finalStatus,
          hoursWorked: 0, // Will be updated on clock out
          overtimeHours: 0,
          lateMinutes: lateMinutes,
          note: `${note} - Clock In`
        };

        const attendanceLog = attendanceRepo.create(attendanceData);
        const savedAttendance = await attendanceRepo.save(attendanceLog);

        results.successful.push({
          employeeId: employee.id,
          employeeNumber: employee.employeeNumber,
          name: `${employee.firstName} ${employee.lastName}`,
          attendanceId: savedAttendance.id,
          timestamp: savedAttendance.timestamp,
          status: savedAttendance.status,
          lateMinutes: savedAttendance.lateMinutes
        });
      } catch (error) {
        results.failed.push({
          employeeId: employee.id,
          employeeNumber: employee.employeeNumber,
          name: `${employee.firstName} ${employee.lastName}`,
          error: error.message
        });
      }
    }

    // Log the bulk operation
    logger.info('Bulk clock in completed', {
      totalEmployees: employees.length,
      successful: results.successful.length,
      failed: results.failed.length,
      skipped: results.skipped.length,
      timestamp: timestamp.toISOString()
    });

    return {
      status: true,
      message: `Bulk clock in completed: ${results.successful.length} successful, ${results.failed.length} failed, ${results.skipped.length} skipped`,
      data: results
    };
  } catch (error) {
    logger.error('Failed to perform bulk clock in:', error);
    
    return {
      status: false,
      message: `Failed to perform bulk clock in: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
/**
 * @file Bulk create attendance logs
 * @type {import('../../../types/ipc').AttendanceBulkCreateHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Bulk create attendance logs
 * @param {import('../../../types/ipc').BulkCreateAttendanceParams} params - Bulk creation parameters
 * @param {import('typeorm').QueryRunner} [queryRunner] - Optional query runner for transaction
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (params, queryRunner = null) => {
  let connection = queryRunner ? queryRunner.manager : AppDataSource.manager;
  
  try {
    // Validate required parameters
    if (!params.records || !Array.isArray(params.records) || params.records.length === 0) {
      return {
        status: false,
        message: 'Array of attendance records is required',
        data: null
      };
    }

    // Validate each record
    const validatedRecords = [];
    const validationErrors = [];
    
    for (let i = 0; i < params.records.length; i++) {
      const record = params.records[i];
      
      // Basic validation
      if (!record.employeeId || isNaN(Number(record.employeeId))) {
        validationErrors.push({
          index: i,
          error: 'Valid employee ID is required',
          record
        });
        continue;
      }
      
      if (!record.timestamp) {
        validationErrors.push({
          index: i,
          error: 'Timestamp is required',
          record
        });
        continue;
      }
      
      // Parse and validate numeric values
      const hoursWorked = parseFloat(record.hoursWorked || 8.0);
      const overtimeHours = parseFloat(record.overtimeHours || 0.0);
      const lateMinutes = parseInt(record.lateMinutes || 0);
      
      if (isNaN(hoursWorked) || hoursWorked < 0 || hoursWorked > 24) {
        validationErrors.push({
          index: i,
          error: 'Hours worked must be between 0 and 24',
          record
        });
        continue;
      }
      
      if (isNaN(overtimeHours) || overtimeHours < 0) {
        validationErrors.push({
          index: i,
          error: 'Overtime hours must be a positive number',
          record
        });
        continue;
      }
      
      if (isNaN(lateMinutes) || lateMinutes < 0) {
        validationErrors.push({
          index: i,
          error: 'Late minutes must be a positive number',
          record
        });
        continue;
      }
      
      validatedRecords.push({
        employeeId: Number(record.employeeId),
        timestamp: new Date(record.timestamp),
        source: record.source || 'manual',
        status: record.status || 'present',
        hoursWorked: hoursWorked,
        overtimeHours: overtimeHours,
        lateMinutes: lateMinutes,
        note: record.note || null
      });
    }

    if (validatedRecords.length === 0) {
      return {
        status: false,
        message: 'No valid records to process',
        data: { validationErrors }
      };
    }

    const attendanceRepo = connection.getRepository('AttendanceLog');
    const employeeRepo = connection.getRepository('Employee');
    
    // Get all unique employee IDs
    const employeeIds = [...new Set(validatedRecords.map(r => r.employeeId))];
    
    // Verify employees exist and are active
    const employees = await employeeRepo
      .createQueryBuilder('employee')
      .where('employee.id IN (:...ids)', { ids: employeeIds })
      .andWhere('employee.status = :status', { status: 'active' })
      .getMany();

    const activeEmployeeIds = new Set(employees.map(emp => emp.id));
    
    // Filter records for active employees only
    const processableRecords = validatedRecords.filter(record => 
      activeEmployeeIds.has(record.employeeId)
    );

    if (processableRecords.length === 0) {
      return {
        status: false,
        message: 'No records for active employees found',
        data: { 
          validationErrors,
          inactiveEmployees: validatedRecords
            .filter(r => !activeEmployeeIds.has(r.employeeId))
            .map(r => r.employeeId)
        }
      };
    }

    // Check for duplicates (same employee, same date)
    const duplicateChecks = [];
    for (const record of processableRecords) {
      const dateStr = record.timestamp.toISOString().split('T')[0];
      duplicateChecks.push({
        employeeId: record.employeeId,
        date: dateStr
      });
    }

    // Find existing records
    const existingRecords = await attendanceRepo
      .createQueryBuilder('attendance')
      .where('attendance.employeeId IN (:...employeeIds)', { 
        employeeIds: processableRecords.map(r => r.employeeId) 
      })
      .andWhere('DATE(attendance.timestamp) IN (:...dates)', { 
        dates: [...new Set(processableRecords.map(r => 
          r.timestamp.toISOString().split('T')[0]
        ))]
      })
      .getMany();

    // Create lookup map for existing records
    const existingMap = new Map();
    existingRecords.forEach(record => {
      const dateStr = record.timestamp.toISOString().split('T')[0];
      const key = `${record.employeeId}-${dateStr}`;
      existingMap.set(key, record);
    });

    // Process records
    const results = {
      created: [],
      skipped: [],
      failed: []
    };

    for (let i = 0; i < processableRecords.length; i++) {
      const record = processableRecords[i];
      const dateStr = record.timestamp.toISOString().split('T')[0];
      const key = `${record.employeeId}-${dateStr}`;
      
      try {
        // Skip if duplicate exists
        if (existingMap.has(key)) {
          results.skipped.push({
            index: i,
            employeeId: record.employeeId,
            date: dateStr,
            reason: 'Duplicate attendance record exists',
            existingId: existingMap.get(key).id
          });
          continue;
        }

        // Create attendance record
        const attendanceLog = attendanceRepo.create(record);
        const savedAttendance = await attendanceRepo.save(attendanceLog);
        
        results.created.push({
          index: i,
          employeeId: record.employeeId,
          attendanceId: savedAttendance.id,
          timestamp: savedAttendance.timestamp,
          status: savedAttendance.status,
          hoursWorked: savedAttendance.hoursWorked
        });
        
        // Add to existing map to prevent duplicates in this batch
        existingMap.set(key, savedAttendance);
      } catch (error) {
        results.failed.push({
          index: i,
          employeeId: record.employeeId,
          error: error.message,
          record
        });
      }
    }

    // Log the bulk operation
    logger.info('Bulk attendance creation completed', {
      totalRecords: params.records.length,
      validated: validatedRecords.length,
      processable: processableRecords.length,
      created: results.created.length,
      skipped: results.skipped.length,
      failed: results.failed.length,
      validationErrors: validationErrors.length
    });

    return {
      status: true,
      message: `Bulk creation completed: ${results.created.length} created, ${results.skipped.length} skipped, ${results.failed.length} failed`,
      data: {
        summary: {
          totalProcessed: processableRecords.length,
          created: results.created.length,
          skipped: results.skipped.length,
          failed: results.failed.length
        },
        details: results,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
        statistics: {
          byStatus: results.created.reduce((acc, item) => {
            const status = processableRecords[item.index].status;
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {}),
          bySource: results.created.reduce((acc, item) => {
            const source = processableRecords[item.index].source;
            acc[source] = (acc[source] || 0) + 1;
            return acc;
          }, {})
        }
      }
    };
  } catch (error) {
    logger.error('Failed to bulk create attendance logs:', error);
    
    return {
      status: false,
      message: `Failed to bulk create attendance logs: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
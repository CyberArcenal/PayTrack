/**
 * @file Sync attendance from biometric/RFID device
 * @type {import('../../../types/ipc').AttendanceSyncDeviceHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Sync attendance from device
 * @param {import('../../../types/ipc').SyncDeviceParams} params - Device sync parameters
 * @param {import('typeorm').QueryRunner} [queryRunner] - Optional query runner for transaction
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (params, queryRunner = null) => {
  let connection = queryRunner ? queryRunner.manager : AppDataSource.manager;
  
  try {
    // Validate required parameters
    if (!params.deviceId) {
      return {
        status: false,
        message: 'Device ID is required',
        data: null
      };
    }

    if (!params.records || !Array.isArray(params.records) || params.records.length === 0) {
      return {
        status: false,
        message: 'Array of attendance records from device is required',
        data: null
      };
    }

    const deviceId = params.deviceId;
    const attendanceRepo = connection.getRepository('AttendanceLog');
    const employeeRepo = connection.getRepository('Employee');

    // Get device configuration (in a real app, this would come from a devices table)
    const deviceConfig = {
      id: deviceId,
      type: params.deviceType || 'biometric',
      location: params.deviceLocation || 'Main Entrance',
      timezone: params.timezone || 'UTC'
    };

    const results = {
      synced: [],
      failed: [],
      skipped: [],
      newEmployees: []
    };

    // Process each device record
    for (let i = 0; i < params.records.length; i++) {
      const deviceRecord = params.records[i];
      
      try {
        // Validate device record
        if (!deviceRecord.employeeCode && !deviceRecord.cardNumber) {
          results.failed.push({
            index: i,
            error: 'Employee code or card number is required',
            record: deviceRecord
          });
          continue;
        }

        if (!deviceRecord.timestamp) {
          results.failed.push({
            index: i,
            error: 'Timestamp is required',
            record: deviceRecord
          });
          continue;
        }

        // Parse timestamp (adjust for timezone if needed)
        let timestamp;
        try {
          timestamp = new Date(deviceRecord.timestamp);
          if (isNaN(timestamp.getTime())) {
            throw new Error('Invalid timestamp');
          }
        } catch (error) {
          results.failed.push({
            index: i,
            error: 'Invalid timestamp format',
            record: deviceRecord
          });
          continue;
        }

        // Find employee by code or card number
        let employee;
        if (deviceRecord.employeeCode) {
          employee = await employeeRepo.findOne({
            where: { 
              employeeNumber: deviceRecord.employeeCode.toString(),
              status: 'active'
            }
          });
        }
        
        if (!employee && deviceRecord.cardNumber) {
          // In a real app, you would have a card number mapping
          // For now, we'll log but skip
          results.skipped.push({
            index: i,
            employeeCode: deviceRecord.employeeCode,
            cardNumber: deviceRecord.cardNumber,
            reason: 'Card number not mapped to employee'
          });
          continue;
        }

        if (!employee) {
          // Handle unknown employee
          if (params.createUnknownEmployees && deviceRecord.employeeCode) {
            // Create a temporary employee record
            const newEmployee = employeeRepo.create({
              employeeNumber: deviceRecord.employeeCode.toString(),
              firstName: 'Unknown',
              lastName: 'Employee',
              status: 'active',
              hireDate: new Date(),
              basePay: 0,
              dailyRate: 0,
              hourlyRate: 0
            });
            
            employee = await employeeRepo.save(newEmployee);
            results.newEmployees.push({
              employeeId: employee.id,
              employeeCode: deviceRecord.employeeCode,
              timestamp: timestamp
            });
          } else {
            results.skipped.push({
              index: i,
              employeeCode: deviceRecord.employeeCode,
              reason: 'Employee not found in system'
            });
            continue;
          }
        }

        // Check for existing attendance on same day
        const dateStr = timestamp.toISOString().split('T')[0];
        const existingAttendance = await attendanceRepo
          .createQueryBuilder('attendance')
          .where('attendance.employeeId = :employeeId', { 
            employeeId: employee.id 
          })
          .andWhere('DATE(attendance.timestamp) = :date', { date: dateStr })
          .orderBy('attendance.timestamp', 'ASC')
          .getMany();

        // Determine if this is clock in or clock out
        let isClockIn = true;
        let updateRecord = null;
        
        if (existingAttendance.length > 0) {
          // Check last record to determine if this is clock out
          const lastRecord = existingAttendance[existingAttendance.length - 1];
          const timeDiff = (timestamp - new Date(lastRecord.timestamp)) / (1000 * 60); // minutes
          
          if (timeDiff > 5) { // Minimum 5 minutes between clock in and out
            isClockIn = false;
            updateRecord = lastRecord;
          } else {
            // Too soon after last record, skip as duplicate
            results.skipped.push({
              index: i,
              employeeId: employee.id,
              employeeCode: deviceRecord.employeeCode,
              reason: 'Duplicate device record (too soon after last record)',
              existingId: lastRecord.id
            });
            continue;
          }
        }

        if (isClockIn) {
          // Create new clock in record
          const attendanceData = {
            employeeId: employee.id,
            timestamp: timestamp,
            source: deviceConfig.type,
            status: 'present', // Default status, could be calculated as late
            hoursWorked: 0, // Will be updated on clock out
            overtimeHours: 0,
            lateMinutes: 0,
            note: `Device: ${deviceConfig.location} (${deviceId})`
          };

          // Calculate if late
          const clockInHour = timestamp.getHours();
          const clockInMinute = timestamp.getMinutes();
          const standardStartHour = 8; // 8:00 AM
          
          if (clockInHour > standardStartHour || 
              (clockInHour === standardStartHour && clockInMinute > 0)) {
            attendanceData.status = 'late';
            attendanceData.lateMinutes = 
              (clockInHour - standardStartHour) * 60 + clockInMinute;
          }

          const attendanceLog = attendanceRepo.create(attendanceData);
          const savedAttendance = await attendanceRepo.save(attendanceLog);
          
          results.synced.push({
            index: i,
            employeeId: employee.id,
            employeeCode: deviceRecord.employeeCode,
            attendanceId: savedAttendance.id,
            action: 'clock_in',
            timestamp: savedAttendance.timestamp,
            status: savedAttendance.status,
            lateMinutes: savedAttendance.lateMinutes
          });
        } else {
          // Update existing record with clock out
          const clockInTime = new Date(updateRecord.timestamp);
          const hoursWorked = (timestamp - clockInTime) / (1000 * 60 * 60);
          
          if (hoursWorked < 0) {
            results.failed.push({
              index: i,
              employeeId: employee.id,
              error: 'Clock out time cannot be before clock in time',
              record: deviceRecord
            });
            continue;
          }

          // Calculate overtime
          let overtimeHours = 0;
          if (hoursWorked > 8) {
            overtimeHours = hoursWorked - 8;
          }

          await attendanceRepo.update(updateRecord.id, {
            hoursWorked: parseFloat(hoursWorked.toFixed(2)),
            overtimeHours: parseFloat(overtimeHours.toFixed(2)),
            note: updateRecord.note ? 
              `${updateRecord.note}; Clock out from device` :
              `Clock out from device: ${deviceConfig.location} (${deviceId})`
          });

          results.synced.push({
            index: i,
            employeeId: employee.id,
            employeeCode: deviceRecord.employeeCode,
            attendanceId: updateRecord.id,
            action: 'clock_out',
            clockInTime: clockInTime,
            clockOutTime: timestamp,
            hoursWorked: parseFloat(hoursWorked.toFixed(2)),
            overtimeHours: parseFloat(overtimeHours.toFixed(2))
          });
        }
      } catch (error) {
        results.failed.push({
          index: i,
          error: error.message,
          record: deviceRecord
        });
      }
    }

    // Generate sync summary
    const syncSummary = {
      deviceId,
      deviceType: deviceConfig.type,
      syncDate: new Date().toISOString(),
      totalRecords: params.records.length,
      synced: results.synced.length,
      failed: results.failed.length,
      skipped: results.skipped.length,
      newEmployees: results.newEmployees.length,
      statistics: {
        clockIns: results.synced.filter(r => r.action === 'clock_in').length,
        clockOuts: results.synced.filter(r => r.action === 'clock_out').length,
        byStatus: results.synced.reduce((acc, record) => {
          if (record.status) {
            acc[record.status] = (acc[record.status] || 0) + 1;
          }
          return acc;
        }, {})
      }
    };

    // Log the sync
    logger.info('Device sync completed', syncSummary);

    // Mark device records as processed if needed
    if (params.markAsProcessed && params.acknowledgeCallback) {
      try {
        const processedIds = results.synced
          .map(r => params.records[r.index]?.recordId)
          .filter(id => id);
        
        // Callback to acknowledge processed records
        await params.acknowledgeCallback(processedIds);
      } catch (ackError) {
        logger.warn('Failed to acknowledge processed records:', ackError);
      }
    }

    return {
      status: true,
      message: `Device sync completed: ${results.synced.length} synced, ${results.failed.length} failed, ${results.skipped.length} skipped`,
      data: {
        summary: syncSummary,
        details: results,
        deviceInfo: deviceConfig
      }
    };
  } catch (error) {
    logger.error('Failed to sync attendance from device:', error);
    
    return {
      status: false,
      message: `Failed to sync from device: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
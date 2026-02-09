/**
 * @file Import attendance from CSV
 * @type {import('../../../types/ipc').AttendanceImportCSVHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { parse } = require('date-fns');

/**
 * Import attendance from CSV file
 * @param {import('../../../types/ipc').ImportCSVParams} params - Import parameters
 * @param {import('typeorm').QueryRunner} [queryRunner] - Optional query runner for transaction
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (params, queryRunner = null) => {
  let connection = queryRunner ? queryRunner.manager : AppDataSource.manager;
  
  try {
    // Validate required parameters
    if (!params.filePath) {
      return {
        status: false,
        message: 'CSV file path is required',
        data: null
      };
    }

    if (!fs.existsSync(params.filePath)) {
      return {
        status: false,
        message: 'CSV file not found',
        data: null
      };
    }

    const options = {
      delimiter: params.delimiter || ',',
      skipHeaders: params.skipHeaders || 0,
      dateFormat: params.dateFormat || 'yyyy-MM-dd HH:mm:ss',
      employeeIdField: params.employeeIdField || 'employeeId',
      timestampField: params.timestampField || 'timestamp',
      statusField: params.statusField || 'status',
      hoursField: params.hoursField || 'hoursWorked',
      overtimeField: params.overtimeField || 'overtimeHours',
      lateField: params.lateField || 'lateMinutes',
      sourceField: params.sourceField || 'source',
      noteField: params.noteField || 'note'
    };

    const records = [];
    const errors = [];
    let rowNumber = options.skipHeaders;

    // Read and parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(params.filePath)
        .pipe(csv({ separator: options.delimiter }))
        .on('data', (row) => {
          rowNumber++;
          
          try {
            // Validate required fields
            if (!row[options.employeeIdField] || !row[options.timestampField]) {
              errors.push({
                row: rowNumber,
                error: 'Missing required fields',
                data: row
              });
              return;
            }

            // Parse employee ID
            const employeeId = parseInt(row[options.employeeIdField]);
            if (isNaN(employeeId)) {
              errors.push({
                row: rowNumber,
                error: 'Invalid employee ID',
                data: row
              });
              return;
            }

            // Parse timestamp
            let timestamp;
            try {
              timestamp = parse(row[options.timestampField], options.dateFormat, new Date());
              if (isNaN(timestamp.getTime())) {
                throw new Error('Invalid date');
              }
            } catch (dateError) {
              // Try ISO format as fallback
              timestamp = new Date(row[options.timestampField]);
              if (isNaN(timestamp.getTime())) {
                errors.push({
                  row: rowNumber,
                  error: 'Invalid timestamp format',
                  data: row
                });
                return;
              }
            }

            // Parse numeric values
            const hoursWorked = parseFloat(row[options.hoursField] || '8.0');
            const overtimeHours = parseFloat(row[options.overtimeField] || '0.0');
            const lateMinutes = parseInt(row[options.lateField] || '0');

            if (isNaN(hoursWorked) || hoursWorked < 0 || hoursWorked > 24) {
              errors.push({
                row: rowNumber,
                error: 'Invalid hours worked value',
                data: row
              });
              return;
            }

            if (isNaN(overtimeHours) || overtimeHours < 0) {
              errors.push({
                row: rowNumber,
                error: 'Invalid overtime hours value',
                data: row
              });
              return;
            }

            if (isNaN(lateMinutes) || lateMinutes < 0) {
              errors.push({
                row: rowNumber,
                error: 'Invalid late minutes value',
                data: row
              });
              return;
            }

            // Validate status
            const status = (row[options.statusField] || 'present').toLowerCase();
            const validStatuses = ['present', 'absent', 'late', 'half-day', 'on-leave', 'holiday'];
            if (!validStatuses.includes(status)) {
              errors.push({
                row: rowNumber,
                error: `Invalid status. Valid values: ${validStatuses.join(', ')}`,
                data: row
              });
              return;
            }

            records.push({
              employeeId,
              timestamp,
              status,
              hoursWorked,
              overtimeHours,
              lateMinutes,
              source: row[options.sourceField] || 'csv-import',
              note: row[options.noteField] || `Imported from CSV on ${new Date().toLocaleString()}`,
              rawData: params.keepRawData ? row : undefined
            });
          } catch (error) {
            errors.push({
              row: rowNumber,
              error: `Processing error: ${error.message}`,
              data: row
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    if (records.length === 0 && errors.length === 0) {
      return {
        status: false,
        message: 'No data found in CSV file',
        data: null
      };
    }

    if (errors.length > 0 && params.stopOnError) {
      return {
        status: false,
        message: `CSV validation failed with ${errors.length} errors`,
        data: { errors, validRecords: records.length }
      };
    }

    // Get all unique employee IDs
    const employeeIds = [...new Set(records.map(r => r.employeeId))];
    const employeeRepo = connection.getRepository('Employee');
    
    // Verify employees exist
    const employees = await employeeRepo
      .createQueryBuilder('employee')
      .where('employee.id IN (:...ids)', { ids: employeeIds })
      .getMany();

    const existingEmployeeIds = new Set(employees.map(emp => emp.id));
    
    // Filter records for existing employees
    const validRecords = records.filter(record => 
      existingEmployeeIds.has(record.employeeId)
    );

    if (validRecords.length === 0) {
      return {
        status: false,
        message: 'No records for existing employees found',
        data: { 
          errors,
          nonExistentEmployees: [...new Set(
            records
              .filter(r => !existingEmployeeIds.has(r.employeeId))
              .map(r => r.employeeId)
          )]
        }
      };
    }

    const attendanceRepo = connection.getRepository('AttendanceLog');
    const results = {
      imported: [],
      skipped: [],
      failed: []
    };

    // Process in batches for better performance
    const batchSize = params.batchSize || 100;
    for (let i = 0; i < validRecords.length; i += batchSize) {
      const batch = validRecords.slice(i, i + batchSize);
      
      for (let j = 0; j < batch.length; j++) {
        const record = batch[j];
        const globalIndex = i + j;
        
        try {
          // Check for duplicates
          const dateStr = record.timestamp.toISOString().split('T')[0];
          const existing = await attendanceRepo
            .createQueryBuilder('attendance')
            .where('attendance.employeeId = :employeeId', { 
              employeeId: record.employeeId 
            })
            .andWhere('DATE(attendance.timestamp) = :date', { date: dateStr })
            .getOne();

          if (existing && !params.overwriteDuplicates) {
            results.skipped.push({
              index: globalIndex,
              employeeId: record.employeeId,
              date: dateStr,
              reason: 'Duplicate record exists',
              existingId: existing.id
            });
            continue;
          }

          // Create or update attendance record
          if (existing && params.overwriteDuplicates) {
            // Update existing record
            await attendanceRepo.update(existing.id, {
              status: record.status,
              hoursWorked: record.hoursWorked,
              overtimeHours: record.overtimeHours,
              lateMinutes: record.lateMinutes,
              source: record.source,
              note: existing.note ? 
                `${existing.note}\n${record.note}` : 
                record.note
            });
            
            results.imported.push({
              index: globalIndex,
              employeeId: record.employeeId,
              attendanceId: existing.id,
              action: 'updated',
              timestamp: record.timestamp,
              status: record.status
            });
          } else {
            // Create new record
            const attendanceLog = attendanceRepo.create(record);
            const savedAttendance = await attendanceRepo.save(attendanceLog);
            
            results.imported.push({
              index: globalIndex,
              employeeId: record.employeeId,
              attendanceId: savedAttendance.id,
              action: 'created',
              timestamp: savedAttendance.timestamp,
              status: savedAttendance.status
            });
          }
        } catch (error) {
          results.failed.push({
            index: globalIndex,
            employeeId: record.employeeId,
            error: error.message,
            record: params.keepFailedRecords ? record : undefined
          });
        }
      }
    }

    // Generate import summary
    const importSummary = {
      file: path.basename(params.filePath),
      importDate: new Date().toISOString(),
      totalRows: rowNumber - options.skipHeaders,
      validRecords: records.length,
      existingEmployees: employees.length,
      imported: results.imported.length,
      skipped: results.skipped.length,
      failed: results.failed.length,
      validationErrors: errors.length,
      statistics: {
        byStatus: results.imported.reduce((acc, item) => {
          const status = validRecords[item.index].status;
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {}),
        dateRange: validRecords.length > 0 ? {
          start: new Date(Math.min(...validRecords.map(r => r.timestamp.getTime()))),
          end: new Date(Math.max(...validRecords.map(r => r.timestamp.getTime())))
        } : null
      }
    };

    // Log the import
    logger.info('CSV import completed', importSummary);

    return {
      status: true,
      message: `CSV import completed: ${results.imported.length} imported, ${results.skipped.length} skipped, ${results.failed.length} failed`,
      data: {
        summary: importSummary,
        details: {
          imported: results.imported,
          skipped: results.skipped,
          failed: results.failed
        },
        errors: errors.length > 0 ? errors : undefined
      }
    };
  } catch (error) {
    logger.error('Failed to import attendance from CSV:', error);
    
    return {
      status: false,
      message: `Failed to import CSV: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
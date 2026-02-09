/**
 * @file Export attendance to CSV
 * @type {import('../../../types/ipc').AttendanceExportCSVHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

/**
 * Export attendance to CSV file
 * @param {import('../../../types/ipc').ExportCSVParams} params - Export parameters
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (params) => {
  try {
    // Validate parameters
    if (!params.filePath) {
      return {
        status: false,
        message: 'Output file path is required',
        data: null
      };
    }

    const outputDir = path.dirname(params.filePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const attendanceRepo = AppDataSource.getRepository('AttendanceLog');
    
    // Build query based on parameters
    const queryBuilder = attendanceRepo
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee')
      .orderBy('attendance.timestamp', 'DESC');

    // Apply filters
    if (params.filters) {
      if (params.filters.employeeId) {
        queryBuilder.andWhere('attendance.employeeId = :employeeId', { 
          employeeId: params.filters.employeeId 
        });
      }
      
      if (params.filters.status) {
        queryBuilder.andWhere('attendance.status = :status', { 
          status: params.filters.status 
        });
      }
      
      if (params.filters.source) {
        queryBuilder.andWhere('attendance.source = :source', { 
          source: params.filters.source 
        });
      }
      
      if (params.filters.startDate && params.filters.endDate) {
        queryBuilder.andWhere(
          'DATE(attendance.timestamp) BETWEEN :startDate AND :endDate',
          { startDate: params.filters.startDate, endDate: params.filters.endDate }
        );
      }
      
      if (params.filters.date) {
        queryBuilder.andWhere(
          'DATE(attendance.timestamp) = :date',
          { date: params.filters.date }
        );
      }
      
      if (params.filters.department) {
        queryBuilder.andWhere('employee.department = :department', {
          department: params.filters.department
        });
      }
    }

    // Limit records if specified
    if (params.limit) {
      queryBuilder.limit(params.limit);
    }

    const attendanceLogs = await queryBuilder.getMany();

    if (attendanceLogs.length === 0) {
      return {
        status: false,
        message: 'No attendance records found to export',
        data: null
      };
    }

    // Prepare CSV headers
    const headers = [
      { id: 'id', title: 'ID' },
      { id: 'employeeId', title: 'Employee ID' },
      { id: 'employeeNumber', title: 'Employee Number' },
      { id: 'employeeName', title: 'Employee Name' },
      { id: 'department', title: 'Department' },
      { id: 'timestamp', title: 'Timestamp' },
      { id: 'date', title: 'Date' },
      { id: 'time', title: 'Time' },
      { id: 'status', title: 'Status' },
      { id: 'source', title: 'Source' },
      { id: 'hoursWorked', title: 'Hours Worked' },
      { id: 'overtimeHours', title: 'Overtime Hours' },
      { id: 'lateMinutes', title: 'Late Minutes' },
      { id: 'note', title: 'Note' },
      { id: 'createdAt', title: 'Created At' },
      { id: 'updatedAt', title: 'Updated At' }
    ];

    // Add additional fields if requested
    if (params.includeAllFields) {
      headers.push(
        { id: 'payrollRecordId', title: 'Payroll Record ID' },
        { id: 'position', title: 'Position' },
        { id: 'dailyRate', title: 'Daily Rate' },
        { id: 'hourlyRate', title: 'Hourly Rate' }
      );
    }

    // Prepare data for CSV
    const csvData = attendanceLogs.map(log => {
      const timestamp = new Date(log.timestamp);
      const data = {
        id: log.id,
        employeeId: log.employeeId,
        employeeNumber: log.employee?.employeeNumber || '',
        employeeName: `${log.employee?.firstName || ''} ${log.employee?.lastName || ''}`.trim(),
        department: log.employee?.department || '',
        timestamp: timestamp.toISOString(),
        date: timestamp.toISOString().split('T')[0],
        time: timestamp.toISOString().split('T')[1].substring(0, 8),
        status: log.status,
        source: log.source,
        hoursWorked: parseFloat(log.hoursWorked).toFixed(2),
        overtimeHours: parseFloat(log.overtimeHours).toFixed(2),
        lateMinutes: log.lateMinutes || 0,
        note: log.note || '',
        createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : '',
        updatedAt: log.updatedAt ? new Date(log.updatedAt).toISOString() : ''
      };

      if (params.includeAllFields) {
        data.payrollRecordId = log.payrollRecordId || '';
        data.position = log.employee?.position || '';
        data.dailyRate = log.employee?.dailyRate ? parseFloat(log.employee.dailyRate).toFixed(2) : '';
        data.hourlyRate = log.employee?.hourlyRate ? parseFloat(log.employee.hourlyRate).toFixed(2) : '';
      }

      return data;
    });

    // Write CSV file
    const csvWriter = createObjectCsvWriter({
      path: params.filePath,
      header: headers,
      fieldDelimiter: params.delimiter || ',',
      encoding: params.encoding || 'utf8'
    });

    await csvWriter.writeRecords(csvData);

    // Generate summary
    const summary = {
      filePath: params.filePath,
      fileSize: fs.statSync(params.filePath).size,
      recordsExported: csvData.length,
      exportDate: new Date().toISOString(),
      dateRange: attendanceLogs.length > 0 ? {
        start: new Date(Math.min(...attendanceLogs.map(log => 
          new Date(log.timestamp).getTime()
        ))).toISOString().split('T')[0],
        end: new Date(Math.max(...attendanceLogs.map(log => 
          new Date(log.timestamp).getTime()
        ))).toISOString().split('T')[0]
      } : null,
      statistics: {
        byStatus: attendanceLogs.reduce((acc, log) => {
          acc[log.status] = (acc[log.status] || 0) + 1;
          return acc;
        }, {}),
        bySource: attendanceLogs.reduce((acc, log) => {
          acc[log.source] = (acc[log.source] || 0) + 1;
          return acc;
        }, {}),
        byDepartment: attendanceLogs.reduce((acc, log) => {
          const dept = log.employee?.department || 'Unknown';
          acc[dept] = (acc[dept] || 0) + 1;
          return acc;
        }, {})
      }
    };

    // Log the export
    logger.info('Attendance export completed', summary);

    return {
      status: true,
      message: `Successfully exported ${csvData.length} attendance records to ${params.filePath}`,
      data: {
        summary,
        sampleData: params.includeSample ? csvData.slice(0, 5) : undefined,
        fileInfo: {
          path: params.filePath,
          size: summary.fileSize,
          records: csvData.length
        }
      }
    };
  } catch (error) {
    logger.error('Failed to export attendance to CSV:', error);
    
    return {
      status: false,
      message: `Failed to export CSV: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
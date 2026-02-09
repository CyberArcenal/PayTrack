/**
 * @file Check for duplicate attendance
 * @type {import('../../../types/ipc').AttendanceCheckDuplicateHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Check for duplicate attendance
 * @param {import('../../../types/ipc').CheckDuplicateParams} params - Duplicate check parameters
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (params) => {
  try {
    // Validate required parameters
    if (!params.employeeId || isNaN(Number(params.employeeId))) {
      return {
        status: false,
        message: 'Valid employee ID is required',
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

    const employeeId = Number(params.employeeId);
    const timestamp = new Date(params.timestamp);
    
    if (isNaN(timestamp.getTime())) {
      return {
        status: false,
        message: 'Invalid timestamp format',
        data: null
      };
    }

    const dateStr = timestamp.toISOString().split('T')[0];
    const attendanceRepo = AppDataSource.getRepository('AttendanceLog');
    
    // Check for exact duplicates (same employee, same timestamp)
    const exactDuplicates = await attendanceRepo
      .createQueryBuilder('attendance')
      .where('attendance.employeeId = :employeeId', { employeeId })
      .andWhere('attendance.timestamp = :timestamp', { timestamp })
      .getMany();

    // Check for same-day duplicates
    const sameDayDuplicates = await attendanceRepo
      .createQueryBuilder('attendance')
      .where('attendance.employeeId = :employeeId', { employeeId })
      .andWhere('DATE(attendance.timestamp) = :date', { date: dateStr })
      .getMany();

    // Check for similar records within time window
    let similarRecords = [];
    if (params.timeWindow) {
      const windowMs = params.timeWindow * 60 * 1000; // Convert minutes to milliseconds
      const startTime = new Date(timestamp.getTime() - windowMs);
      const endTime = new Date(timestamp.getTime() + windowMs);
      
      similarRecords = await attendanceRepo
        .createQueryBuilder('attendance')
        .where('attendance.employeeId = :employeeId', { employeeId })
        .andWhere('attendance.timestamp BETWEEN :startTime AND :endTime', {
          startTime,
          endTime
        })
        .getMany();
    }

    // Analyze duplicates
    const analysis = {
      exactDuplicates: exactDuplicates.map(dup => ({
        id: dup.id,
        timestamp: dup.timestamp,
        status: dup.status,
        source: dup.source
      })),
      sameDayDuplicates: sameDayDuplicates
        .filter(dup => dup.timestamp.getTime() !== timestamp.getTime())
        .map(dup => ({
          id: dup.id,
          timestamp: dup.timestamp,
          status: dup.status,
          source: dup.source,
          timeDifference: Math.abs(dup.timestamp.getTime() - timestamp.getTime()) / (1000 * 60) // minutes
        })),
      similarRecords: similarRecords
        .filter(record => record.timestamp.getTime() !== timestamp.getTime())
        .map(record => ({
          id: record.id,
          timestamp: record.timestamp,
          status: record.status,
          source: record.source,
          timeDifference: Math.abs(record.timestamp.getTime() - timestamp.getTime()) / (1000 * 60) // minutes
        }))
    };

    // Determine duplicate type
    let duplicateType = 'none';
    let duplicateMessage = 'No duplicates found';
    
    if (analysis.exactDuplicates.length > 0) {
      duplicateType = 'exact';
      duplicateMessage = `Found ${analysis.exactDuplicates.length} exact duplicate(s)`;
    } else if (analysis.sameDayDuplicates.length > 0) {
      duplicateType = 'same-day';
      duplicateMessage = `Found ${analysis.sameDayDuplicates.length} attendance record(s) for the same day`;
    } else if (analysis.similarRecords.length > 0) {
      duplicateType = 'similar';
      duplicateMessage = `Found ${analysis.similarRecords.length} similar record(s) within time window`;
    }

    // Check if duplicates have different statuses (potential data quality issue)
    const statusConflicts = [];
    if (analysis.sameDayDuplicates.length > 0 && params.status) {
      const differentStatuses = analysis.sameDayDuplicates.filter(
        dup => dup.status.toLowerCase() !== params.status.toLowerCase()
      );
      
      if (differentStatuses.length > 0) {
        statusConflicts.push(...differentStatuses.map(dup => ({
          existingId: dup.id,
          existingStatus: dup.status,
          newStatus: params.status,
          timestamp: dup.timestamp
        })));
      }
    }

    return {
      status: true,
      message: duplicateMessage,
      data: {
        isDuplicate: duplicateType !== 'none',
        duplicateType,
        analysis,
        statusConflicts: statusConflicts.length > 0 ? statusConflicts : undefined,
        recommendations: generateDuplicateRecommendations(duplicateType, analysis, params)
      }
    };
  } catch (error) {
    logger.error('Failed to check for duplicates:', error);
    
    return {
      status: false,
      message: `Failed to check for duplicates: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};

function generateDuplicateRecommendations(type, analysis, params) {
  const recommendations = [];
  
  switch (type) {
    case 'exact':
      recommendations.push({
        severity: 'high',
        message: 'Exact duplicate detected. Consider:',
        actions: [
          'Skip creating new record',
          'Update existing record if needed',
          'Merge data if applicable'
        ]
      });
      break;
      
    case 'same-day':
      recommendations.push({
        severity: 'medium',
        message: `Multiple attendance records found for ${new Date(params.timestamp).toISOString().split('T')[0]}`,
        actions: [
          'Review if this is clock-in/clock-out pair',
          'Check if employee had multiple shifts',
          'Consider consolidating records'
        ]
      });
      
      // Check if records could be clock-in/clock-out pairs
      if (analysis.sameDayDuplicates.length === 1) {
        const existingRecord = analysis.sameDayDuplicates[0];
        const newTime = new Date(params.timestamp).getTime();
        const existingTime = new Date(existingRecord.timestamp).getTime();
        const timeDiff = Math.abs(newTime - existingTime) / (1000 * 60 * 60); // hours
        
        if (timeDiff > 4 && timeDiff < 12) {
          recommendations.push({
            severity: 'info',
            message: 'Records appear to be clock-in/clock-out pair',
            actions: [
              'Update existing record with clock-out time',
              'Calculate hours worked between records'
            ]
          });
        }
      }
      break;
      
    case 'similar':
      recommendations.push({
        severity: 'low',
        message: 'Similar records found within time window',
        actions: [
          'Verify if these are separate events',
          'Check device/source for potential duplicates',
          'Consider timezone differences if applicable'
        ]
      });
      break;
      
    default:
      recommendations.push({
        severity: 'info',
        message: 'No duplicates detected',
        actions: [
          'Proceed with creating new record',
          'Ensure data quality before saving'
        ]
      });
  }
  
  return recommendations;
}
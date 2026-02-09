/**
 * @file Get attendance logs by source
 * @type {import('../../../types/ipc').AttendanceGetBySourceHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Get attendance logs by source
 * @param {string} source - Attendance source (manual, rfid, biometric, mobile, etc.)
 * @param {import('../../../types/ipc').AttendanceFilters} [filters] - Optional filters
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (source, filters = {}) => {
  try {
    if (!source) {
      return {
        status: false,
        message: 'Source is required',
        data: null
      };
    }

    // Validate source against known values
    const validSources = ['manual', 'rfid', 'biometric', 'mobile', 'web', 'system'];
    if (!validSources.includes(source.toLowerCase())) {
      return {
        status: false,
        message: `Invalid source. Valid values: ${validSources.join(', ')}`,
        data: null
      };
    }

    const attendanceRepo = AppDataSource.getRepository('AttendanceLog');
    
    const queryBuilder = attendanceRepo
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.employee', 'employee')
      .where('attendance.source = :source', { source: source.toLowerCase() })
      .orderBy('attendance.timestamp', 'DESC');

    // Apply date filters
    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere(
        'DATE(attendance.timestamp) BETWEEN :startDate AND :endDate',
        { startDate: filters.startDate, endDate: filters.endDate }
      );
    }
    
    if (filters.date) {
      queryBuilder.andWhere(
        'DATE(attendance.timestamp) = :date',
        { date: filters.date }
      );
    }
    
    if (filters.employeeId) {
      queryBuilder.andWhere('attendance.employeeId = :employeeId', {
        employeeId: filters.employeeId
      });
    }
    
    if (filters.status) {
      queryBuilder.andWhere('attendance.status = :status', {
        status: filters.status
      });
    }

    const attendanceLogs = await queryBuilder.getMany();

    // Group by date for trend analysis
    const dailyStats = attendanceLogs.reduce((acc, log) => {
      const date = log.timestamp.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, count: 0, byStatus: {} };
      }
      acc[date].count++;
      acc[date].byStatus[log.status] = (acc[date].byStatus[log.status] || 0) + 1;
      return acc;
    }, {});

    const dailyStatsArray = Object.values(dailyStats).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    return {
      status: true,
      message: `Attendance logs from source '${source}' retrieved successfully`,
      data: {
        logs: attendanceLogs,
        source,
        count: attendanceLogs.length,
        dailyStats: dailyStatsArray,
        summary: {
          totalRecords: attendanceLogs.length,
          dateRange: dailyStatsArray.length > 0 
            ? { 
                start: dailyStatsArray[0].date, 
                end: dailyStatsArray[dailyStatsArray.length - 1].date 
              }
            : null,
          statusDistribution: attendanceLogs.reduce((acc, log) => {
            acc[log.status] = (acc[log.status] || 0) + 1;
            return acc;
          }, {})
        }
      }
    };
  } catch (error) {
    logger.error('Failed to get attendance logs by source:', error);
    
    return {
      status: false,
      message: `Failed to get attendance logs by source: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
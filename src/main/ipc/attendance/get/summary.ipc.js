/**
 * @file Get attendance summary
 * @type {import('../../../types/ipc').AttendanceGetSummaryHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Get attendance summary
 * @param {import('../../../types/ipc').DateRange} [dateRange] - Date range for summary
 * @param {number} [employeeId] - Optional employee ID for individual summary
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (dateRange, employeeId) => {
  try {
    const attendanceRepo = AppDataSource.getRepository('AttendanceLog');
    
    // Build query based on parameters
    let query = attendanceRepo
      .createQueryBuilder('attendance')
      .leftJoin('attendance.employee', 'employee');

    // Apply employee filter if provided
    if (employeeId) {
      query.where('attendance.employeeId = :employeeId', { 
        employeeId: Number(employeeId) 
      });
    }

    // Apply date range if provided
    if (dateRange?.startDate && dateRange?.endDate) {
      query.andWhere(
        'DATE(attendance.timestamp) BETWEEN :startDate AND :endDate',
        { startDate: dateRange.startDate, endDate: dateRange.endDate }
      );
    } else {
      // Default to current month if no date range provided
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString().split('T')[0];
      
      query.andWhere(
        'DATE(attendance.timestamp) BETWEEN :startDate AND :endDate',
        { startDate: firstDay, endDate: lastDay }
      );
      
      dateRange = { startDate: firstDay, endDate: lastDay };
    }

    // Get all attendance logs for the period
    const attendanceLogs = await query.getMany();

    // Calculate summary statistics
    const summary = attendanceLogs.reduce((acc, log) => {
      const date = log.timestamp.toISOString().split('T')[0];
      
      // Initialize date entry if not exists
      if (!acc.daily[date]) {
        acc.daily[date] = {
          date,
          total: 0,
          byStatus: {},
          totalHours: 0,
          overtimeHours: 0
        };
      }
      
      // Update daily stats
      acc.daily[date].total++;
      acc.daily[date].byStatus[log.status] = 
        (acc.daily[date].byStatus[log.status] || 0) + 1;
      acc.daily[date].totalHours += parseFloat(log.hoursWorked);
      acc.daily[date].overtimeHours += parseFloat(log.overtimeHours);
      
      // Update overall stats
      acc.totalRecords++;
      acc.totalHours += parseFloat(log.hoursWorked);
      acc.totalOvertime += parseFloat(log.overtimeHours);
      acc.byStatus[log.status] = (acc.byStatus[log.status] || 0) + 1;
      
      // Track unique employees
      acc.employeeIds.add(log.employeeId);
      
      // Track source distribution
      acc.bySource[log.source] = (acc.bySource[log.source] || 0) + 1;
      
      // Track late minutes if applicable
      if (log.status === 'late') {
        acc.totalLateMinutes += log.lateMinutes || 0;
      }
      
      return acc;
    }, {
      totalRecords: 0,
      totalHours: 0,
      totalOvertime: 0,
      totalLateMinutes: 0,
      byStatus: {},
      bySource: {},
      daily: {},
      employeeIds: new Set()
    });

    // Convert daily object to array and sort by date
    const dailySummary = Object.values(summary.daily).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Get employee details for individual summary
    let employeeDetails = null;
    if (employeeId) {
      const employeeRepo = AppDataSource.getRepository('Employee');
      employeeDetails = await employeeRepo.findOne({
        where: { id: Number(employeeId) },
        select: ['id', 'employeeNumber', 'firstName', 'lastName', 'department', 'position']
      });
    }

    return {
      status: true,
      message: 'Attendance summary retrieved successfully',
      data: {
        summary: {
          dateRange,
          totalRecords: summary.totalRecords,
          totalHours: parseFloat(summary.totalHours.toFixed(2)),
          totalOvertime: parseFloat(summary.totalOvertime.toFixed(2)),
          averageHoursPerDay: dailySummary.length > 0 
            ? parseFloat((summary.totalHours / dailySummary.length).toFixed(2))
            : 0,
          totalEmployees: summary.employeeIds.size,
          statusDistribution: summary.byStatus,
          sourceDistribution: summary.bySource,
          totalLateMinutes: summary.totalLateMinutes,
          averageLateMinutes: summary.byStatus.late > 0
            ? parseFloat((summary.totalLateMinutes / summary.byStatus.late).toFixed(2))
            : 0
        },
        dailySummary,
        employeeDetails
      }
    };
  } catch (error) {
    logger.error('Failed to get attendance summary:', error);
    
    return {
      status: false,
      message: `Failed to get attendance summary: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
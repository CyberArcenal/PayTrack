/**
 * @file Get overtime logs
 * @type {import('../../../types/ipc').AttendanceGetOvertimeHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Get overtime logs
 * @param {import('../../../types/ipc').DateRange} [dateRange] - Date range for overtime
 * @param {import('../../../types/ipc').OvertimeFilters} [filters] - Optional filters
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (dateRange, filters = {}) => {
  try {
    const overtimeRepo = AppDataSource.getRepository('OvertimeLog');
    
    const queryBuilder = overtimeRepo
      .createQueryBuilder('overtime')
      .leftJoinAndSelect('overtime.employee', 'employee')
      .leftJoinAndSelect('overtime.payrollRecord', 'payrollRecord')
      .orderBy('overtime.date', 'DESC');

    // Apply date range
    if (dateRange?.startDate && dateRange?.endDate) {
      queryBuilder.where(
        'overtime.date BETWEEN :startDate AND :endDate',
        { startDate: dateRange.startDate, endDate: dateRange.endDate }
      );
    } else {
      // Default to current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString().split('T')[0];
      
      queryBuilder.where(
        'overtime.date BETWEEN :startDate AND :endDate',
        { startDate: firstDay, endDate: lastDay }
      );
      
      dateRange = { startDate: firstDay, endDate: lastDay };
    }

    // Apply additional filters
    if (filters.employeeId) {
      queryBuilder.andWhere('overtime.employeeId = :employeeId', {
        employeeId: filters.employeeId
      });
    }
    
    if (filters.approvalStatus) {
      queryBuilder.andWhere('overtime.approvalStatus = :approvalStatus', {
        approvalStatus: filters.approvalStatus
      });
    }
    
    if (filters.overtimeType) {
      queryBuilder.andWhere('overtime.type = :type', {
        type: filters.overtimeType
      });
    }
    
    if (filters.department) {
      queryBuilder.andWhere('employee.department = :department', {
        department: filters.department
      });
    }

    const overtimeLogs = await queryBuilder.getMany();

    // Calculate statistics
    const stats = overtimeLogs.reduce((acc, log) => {
      const date = log.date;
      
      // Initialize date entry
      if (!acc.daily[date]) {
        acc.daily[date] = {
          date,
          count: 0,
          totalHours: 0,
          totalAmount: 0,
          byType: {},
          byStatus: {}
        };
      }
      
      // Update daily stats
      acc.daily[date].count++;
      acc.daily[date].totalHours += parseFloat(log.hours);
      acc.daily[date].totalAmount += parseFloat(log.amount);
      acc.daily[date].byType[log.type] = 
        (acc.daily[date].byType[log.type] || 0) + 1;
      acc.daily[date].byStatus[log.approvalStatus] = 
        (acc.daily[date].byStatus[log.approvalStatus] || 0) + 1;
      
      // Update overall stats
      acc.totalRecords++;
      acc.totalHours += parseFloat(log.hours);
      acc.totalAmount += parseFloat(log.amount);
      acc.byType[log.type] = (acc.byType[log.type] || 0) + 1;
      acc.byStatus[log.approvalStatus] = (acc.byStatus[log.approvalStatus] || 0) + 1;
      
      // Track employees
      acc.employeeIds.add(log.employeeId);
      
      return acc;
    }, {
      totalRecords: 0,
      totalHours: 0,
      totalAmount: 0,
      byType: {},
      byStatus: {},
      daily: {},
      employeeIds: new Set()
    });

    // Convert daily object to array
    const dailyStats = Object.values(stats.daily).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Calculate approval rates
    const approvalRate = stats.totalRecords > 0
      ? ((stats.byStatus.approved || 0) / stats.totalRecords * 100).toFixed(2)
      : 0;

    return {
      status: true,
      message: 'Overtime logs retrieved successfully',
      data: {
        logs: overtimeLogs,
        dateRange,
        count: overtimeLogs.length,
        statistics: {
          totalRecords: stats.totalRecords,
          totalHours: parseFloat(stats.totalHours.toFixed(2)),
          totalAmount: parseFloat(stats.totalAmount.toFixed(2)),
          averageHoursPerRecord: stats.totalRecords > 0
            ? parseFloat((stats.totalHours / stats.totalRecords).toFixed(2))
            : 0,
          uniqueEmployees: stats.employeeIds.size,
          typeDistribution: stats.byType,
          statusDistribution: stats.byStatus,
          approvalRate: parseFloat(approvalRate),
          pendingCount: stats.byStatus.pending || 0
        },
        dailyStats,
        pendingApprovals: overtimeLogs
          .filter(log => log.approvalStatus === 'pending')
          .slice(0, 20) // Limit to 20 pending for performance
      }
    };
  } catch (error) {
    logger.error('Failed to get overtime logs:', error);
    
    return {
      status: false,
      message: `Failed to get overtime logs: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
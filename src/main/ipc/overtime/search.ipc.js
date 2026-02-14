const overtimeLogService = require("../../../services/OvertimeLog");

/**
 * Search overtime logs by keyword (in note field) or other criteria.
 * @param {Object} params - Request parameters.
 * @param {string} params.keyword - Search keyword.
 * @param {number} [params.employeeId] - Optional employee filter.
 * @param {string} [params.startDate] - Optional start date.
 * @param {string} [params.endDate] - Optional end date.
 * @returns {Promise<{ success: boolean, message?: string, data?: any }>}
 */
module.exports = async (params) => {
  try {
    const { keyword, employeeId, startDate, endDate } = params;
    if (!keyword || typeof keyword !== 'string') {
      throw new Error('Search keyword is required');
    }

    // Use the service's findAll with a custom where clause.
    // Since the service doesn't natively support text search, we manually build a query.
    const { AppDataSource } = require('../../db/datasource');
    const OvertimeLog = require('../../../entities/OvertimeLog');
    const repo = AppDataSource.getRepository(OvertimeLog);

    const query = repo
      .createQueryBuilder('overtime')
      .leftJoinAndSelect('overtime.employee', 'employee')
      .leftJoinAndSelect('overtime.payrollRecord', 'payrollRecord')
      .where('overtime.note LIKE :keyword', { keyword: `%${keyword}%` });

    if (employeeId) {
      query.andWhere('overtime.employeeId = :employeeId', { employeeId: parseInt(employeeId) });
    }
    if (startDate) {
      query.andWhere('overtime.date >= :startDate', { startDate });
    }
    if (endDate) {
      query.andWhere('overtime.date <= :endDate', { endDate });
    }

    const data = await query.getMany();
    return { success: true, data };
  } catch (error) {
    console.error('[search.ipc] Error:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to search overtime logs',
    };
  }
};
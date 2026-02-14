
const { AppDataSource } = require('../../db/datasource');
const overtimeLogService = require("../../../services/OvertimeLog");

/**
 * Create multiple overtime logs in a transaction.
 * @param {Object} params - Request parameters.
 * @param {Array<Object>} params.items - Array of overtime log objects.
 * @param {string} [params.user] - User performing the action.
 * @returns {Promise<{ success: boolean, message?: string, data?: any }>}
 */
module.exports = async (params) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { items, user = 'system' } = params;

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Items array is required and must not be empty');
    }

    const created = [];
    for (const item of items) {
      // Basic validation per item
      if (!item.employeeId || !item.date || !item.startTime || !item.endTime) {
        throw new Error('Each item must have employeeId, date, startTime, endTime');
      }
      // Use the service's create method with the transaction's query runner?
      // For simplicity, we directly use the repository within the transaction.
      // But service.create uses its own repositories; we need to override them.
      // Alternative: we can implement a bulk method in the service later.
      // Here we'll use the repository directly to keep transaction.
      const repo = queryRunner.manager.getRepository('OvertimeLog');
      const employeeRepo = queryRunner.manager.getRepository('Employee');

      // Validate employee existence
      const employee = await employeeRepo.findOne({ where: { id: item.employeeId } });
      if (!employee) {
        throw new Error(`Employee with ID ${item.employeeId} not found`);
      }

      // Calculate hours and amount
      const hours = overtimeLogService.calculateHours(item.startTime, item.endTime, item.date);
      const amount = await require('../../../utils/overtimeUtils').calculateOvertimeAmount(
        employee,
        hours,
        item.rate || employee.overtimeRate || 1.25
      );

      const overtimeData = {
        employeeId: item.employeeId,
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        hours,
        rate: item.rate || employee.overtimeRate || 1.25,
        amount,
        type: item.type || 'regular',
        approvedBy: item.approvedBy,
        approvalStatus: 'pending',
        note: item.note,
        employee,
      };

      const newOvertime = repo.create(overtimeData);
      const saved = await repo.save(newOvertime);
      created.push(saved);

      // Audit log per item
      await require('../../../utils/auditLogger').logCreate('OvertimeLog', saved.id, saved, user);
    }

    await queryRunner.commitTransaction();
    return {
      success: true,
      data: created,
      message: `${created.length} overtime logs created successfully`,
    };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('[bulk_create.ipc] Error:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to bulk create overtime logs',
    };
  } finally {
    await queryRunner.release();
  }
};
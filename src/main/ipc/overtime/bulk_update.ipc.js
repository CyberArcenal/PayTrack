
const { AppDataSource } = require("../../db/datasource");
const overtimeLogService = require("../../../services/OvertimeLog");

/**
 * Update multiple overtime logs in a transaction.
 * @param {Object} params - Request parameters.
 * @param {Array<{ id: number, data: Object }>} params.updates - Array of update objects.
 * @param {string} [params.user] - User performing the action.
 * @returns {Promise<{ success: boolean, message?: string, data?: any }>}
 */
module.exports = async (params) => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { updates, user = "system" } = params;

    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error("Updates array is required and must not be empty");
    }

    const updated = [];
    for (const { id, data } of updates) {
      if (!id || typeof data !== "object") {
        throw new Error("Each update must have an id and data object");
      }

      // Fetch existing with relations for recalculation
      const repo = queryRunner.manager.getRepository("OvertimeLog");
      const existing = await repo.findOne({
        where: { id },
        relations: ["employee"],
      });
      if (!existing) {
        throw new Error(`Overtime log with ID ${id} not found`);
      }

      // Apply updates
      if (data.employeeId) {
        const employeeRepo = queryRunner.manager.getRepository("Employee");
        const newEmployee = await employeeRepo.findOne({
          where: { id: data.employeeId },
        });
        if (!newEmployee)
          throw new Error(`Employee ${data.employeeId} not found`);
        existing.employee = newEmployee;
        existing.employeeId = data.employeeId;
      }
      if (data.date !== undefined) existing.date = data.date;
      if (data.startTime !== undefined) existing.startTime = data.startTime;
      if (data.endTime !== undefined) existing.endTime = data.endTime;
      if (data.type !== undefined) existing.type = data.type;
      if (data.rate !== undefined) existing.rate = data.rate;
      if (data.approvedBy !== undefined) existing.approvedBy = data.approvedBy;
      if (data.approvalStatus !== undefined)
        existing.approvalStatus = data.approvalStatus;
      if (data.note !== undefined) existing.note = data.note;

      // Recalculate hours if needed
      if (data.date || data.startTime || data.endTime) {
        existing.hours = overtimeLogService.calculateHours(
          existing.startTime,
          existing.endTime,
          existing.date,
        );
      }

      // Recalculate amount if needed
      if (
        data.employeeId ||
        data.rate !== undefined ||
        data.date ||
        data.startTime ||
        data.endTime
      ) {
        existing.amount =
          await require("../../../utils/overtimeUtils").calculateOvertimeAmount(
            existing.employee,
            existing.hours,
            existing.rate,
          );
      }

      const saved = await repo.save(existing);
      updated.push(saved);

      await require("../../../utils/auditLogger").logUpdate(
        "OvertimeLog",
        id,
        { ...existing, ...data }, // old data approximation
        saved,
        user,
      );
    }

    await queryRunner.commitTransaction();
    return {
      success: true,
      data: updated,
      message: `${updated.length} overtime logs updated successfully`,
    };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error("[bulk_update.ipc] Error:", error.message);
    return {
      success: false,
      message: error.message || "Failed to bulk update overtime logs",
    };
  } finally {
    await queryRunner.release();
  }
};

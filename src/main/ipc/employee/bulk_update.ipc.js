// @ts-check
const { AppDataSource } = require("../../db/datasource");
const Employee = require("../../../entities/Employee");
const auditLogger = require("../../../utils/auditLogger");
const { logger } = require("../../../utils/logger");
const { validateEmployeeData } = require("../../../utils/employeeUtils");

/**
 * Bulk update employees (atomic transaction)
 * @param {Object} params - { updates: Array<{id: number, data: Object}>, user? }
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  // @ts-ignore
  const { updates, user = "system" } = params;
  if (!Array.isArray(updates) || updates.length === 0) {
    return { status: false, message: "Updates array is required" };
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const repo = queryRunner.manager.getRepository(Employee);
    const updated = [];

    for (const item of updates) {
      const { id, data } = item;
      if (!id || isNaN(Number(id))) {
        throw new Error("Each update must include a numeric id");
      }

      const existing = await repo.findOne({ where: { id: Number(id) } });
      if (!existing) {
        throw new Error(`Employee with ID ${id} not found`);
      }

      // Validate updated data
      const validation = await validateEmployeeData({ ...existing, ...data }, repo, id);
      if (!validation.valid) {
        throw new Error(`Validation failed for employee ${id}: ${validation.errors.join(", ")}`);
      }

      const oldData = { ...existing };
      Object.assign(existing, data);
      const saved = await repo.save(existing);
      updated.push({ before: oldData, after: saved });

      // Audit log inside transaction (if we want rollback on audit failure)
      // @ts-ignore
      await auditLogger.logUpdate("Employee", id, oldData, saved, user, queryRunner.manager);
    }

    await queryRunner.commitTransaction();
    return { status: true, data: updated, message: `${updated.length} employees updated` };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    // @ts-ignore
    logger.error("Error in bulkUpdateEmployees:", error);
    // @ts-ignore
    return { status: false, message: error.message || "Bulk update failed" };
  } finally {
    await queryRunner.release();
  }
};
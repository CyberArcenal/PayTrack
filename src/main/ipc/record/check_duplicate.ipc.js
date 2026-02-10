// src/ipc/handlers/payroll-record/check_duplicate.ipc.js
// @ts-check
const PayrollRecord = require("../../../entities/PayrollRecord");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");

/**
 * Check for duplicate payroll record
 * @param {Object} params - Parameters to check
 * @param {number} params.employeeId - Employee ID
 * @param {number} params.periodId - Period ID
 * @param {number} [params.excludeId] - Exclude this ID (for updates)
 * @returns {Promise<{status: boolean, message: string, isDuplicate: boolean, existingRecord: Object|null}>}
 */
async function checkDuplicatePayrollRecord(params) {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    const { employeeId, periodId, excludeId } = params;

    if (!employeeId || !periodId) {
      return {
        status: false,
        message: "Employee ID and Period ID are required",
        isDuplicate: false,
        existingRecord: null,
      };
    }

    const payrollRecordRepo = queryRunner.manager.getRepository(PayrollRecord);

    const query = payrollRecordRepo
      .createQueryBuilder("pr")
      .where("pr.employeeId = :employeeId", {
        employeeId: parseInt(employeeId),
      })
      .andWhere("pr.periodId = :periodId", { periodId: parseInt(periodId) });

    if (excludeId) {
      query.andWhere("pr.id != :excludeId", { excludeId: parseInt(excludeId) });
    }

    const existingRecord = await query.getOne();

    if (existingRecord) {
      return {
        status: true,
        message: "Duplicate payroll record found",
        isDuplicate: true,
        existingRecord,
      };
    }

    return {
      status: true,
      message: "No duplicate found",
      isDuplicate: false,
      existingRecord: null,
    };
  } catch (error) {
    logger.error("Failed to check for duplicate payroll record:", error);
    return {
      status: false,
      message: `Failed to check for duplicate: ${error.message}`,
      isDuplicate: false,
      existingRecord: null,
    };
  } finally {
    await queryRunner.release();
  }
}

module.exports = checkDuplicatePayrollRecord;

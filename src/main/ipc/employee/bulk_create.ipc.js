// @ts-check
const { AppDataSource } = require("../../db/datasource");
const Employee = require("../../../entities/Employee");
const auditLogger = require("../../../utils/auditLogger");
const { logger } = require("../../../utils/logger");
const { validateEmployeeData, generateEmployeeNumber } = require("../../../utils/employeeUtils");

/**
 * Bulk create employees (atomic transaction)
 * @param {Object} params - { employees: Array<Object>, user? }
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  // @ts-ignore
  const { employees, user = "system" } = params;
  if (!Array.isArray(employees) || employees.length === 0) {
    return { status: false, message: "Employees array is required" };
  }

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const repo = queryRunner.manager.getRepository(Employee);
    const created = [];

    for (const empData of employees) {
      // Validate each employee
      const validation = await validateEmployeeData(empData, repo);
      if (!validation.valid) {
        throw new Error(`Validation failed for one employee: ${validation.errors.join(", ")}`);
      }

      // Generate employee number if missing
      if (!empData.employeeNumber) {
        empData.employeeNumber = await generateEmployeeNumber(repo);
      }

      const employee = repo.create({
        ...empData,
        status: empData.status || "active",
        employmentType: empData.employmentType || "regular",
        paymentMethod: empData.paymentMethod || "bank",
        overtimeRate: empData.overtimeRate || 1.25,
      });

      const saved = await repo.save(employee);
      created.push(saved);
    }

    await queryRunner.commitTransaction();

    // Audit logs (outside transaction to avoid rollback, but safe)
    for (const emp of created) {
      // @ts-ignore
      await auditLogger.logCreate("Employee", emp.id, emp, user);
    }

    return { status: true, data: created, message: `${created.length} employees created` };
  } catch (error) {
    await queryRunner.rollbackTransaction();
    // @ts-ignore
    logger.error("Error in bulkCreateEmployees:", error);
    // @ts-ignore
    return { status: false, message: error.message || "Bulk create failed" };
  } finally {
    await queryRunner.release();
  }
};
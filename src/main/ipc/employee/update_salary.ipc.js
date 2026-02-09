// ===================== update_salary.ipc.js =====================

const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");

/**
 * Update employee salary
 * @param {Object} salaryData
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function updateEmployeeSalary(salaryData, queryRunner) {
  const repo = queryRunner ? queryRunner.manager.getRepository("Employee") : AppDataSource.getRepository("Employee");

  try {
    const { id, basePay, effectiveDate, userId, userType, reason } = salaryData;

    if (!id || basePay === undefined) {
      return {
        status: false,
        message: "Employee ID and base pay are required",
        data: null,
      };
    }

    const basePayAmount = parseFloat(basePay);
    if (isNaN(basePayAmount) || basePayAmount < 0) {
      return {
        status: false,
        message: "Base pay must be a positive number",
        data: null,
      };
    }

    const employee = await repo.findOne({ where: { id } });
    if (!employee) {
      return {
        status: false,
        message: `Employee with ID ${id} not found`,
        data: null,
      };
    }

    const oldBasePay = employee.basePay;
    const dailyRate = basePayAmount / 10; // Assuming 10 working days
    const hourlyRate = dailyRate / 8;

    const updateData = {
      basePay: basePayAmount,
      dailyRate,
      hourlyRate,
      updatedAt: new Date(),
    };

    await repo.update(id, updateData);
    const updatedEmployee = await repo.findOne({ where: { id } });

    logger.info(`Employee salary updated: ID ${id}, ${oldBasePay} -> ${basePayAmount}`);

    return {
      status: true,
      message: "Employee salary updated successfully",
      data: updatedEmployee,
    };
  } catch (error) {
    logger.error("Error in updateEmployeeSalary:", error);
    return {
      status: false,
      message: error.message || "Failed to update employee salary",
      data: null,
    };
  }
};
// ===================== apply_increase.ipc.js =====================


const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");

/**
 * Apply salary increase
 * @param {Object} increaseData
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function applySalaryIncrease(increaseData, queryRunner) {
  const repo = queryRunner ? queryRunner.manager.getRepository("Employee") : AppDataSource.getRepository("Employee");

  try {
    const { id, increaseType, increaseValue, effectiveDate, userId, userType, reason } = increaseData;

    if (!id || !increaseType || !increaseValue) {
      return {
        status: false,
        message: "Employee ID, increase type, and increase value are required",
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
    let newBasePay = oldBasePay;

    // Calculate new base pay based on increase type
    if (increaseType === "percentage") {
      const percentage = parseFloat(increaseValue);
      if (isNaN(percentage) || percentage <= 0) {
        return {
          status: false,
          message: "Percentage must be a positive number",
          data: null,
        };
      }
      newBasePay = oldBasePay * (1 + percentage / 100);
    } else if (increaseType === "fixed") {
      const fixedAmount = parseFloat(increaseValue);
      if (isNaN(fixedAmount) || fixedAmount <= 0) {
        return {
          status: false,
          message: "Fixed amount must be a positive number",
          data: null,
        };
      }
      newBasePay = oldBasePay + fixedAmount;
    } else {
      return {
        status: false,
        message: "Invalid increase type. Must be 'percentage' or 'fixed'",
        data: null,
      };
    }

    // Calculate new rates
    const workingDays = 10;
    const dailyRate = newBasePay / workingDays;
    const hourlyRate = dailyRate / 8;

    const updateData = {
      basePay: parseFloat(newBasePay.toFixed(2)),
      dailyRate: parseFloat(dailyRate.toFixed(2)),
      hourlyRate: parseFloat(hourlyRate.toFixed(2)),
      updatedAt: new Date(),
    };

    await repo.update(id, updateData);
    const updatedEmployee = await repo.findOne({ where: { id } });


    logger.info(`Salary increase applied: ID ${id}, ${oldBasePay} -> ${newBasePay}`);

    return {
      status: true,
      message: "Salary increase applied successfully",
      data: {
        ...updatedEmployee,
        increaseDetails: {
          oldBasePay,
          newBasePay,
          increaseType,
          increaseValue,
          effectiveDate,
          increaseAmount: newBasePay - oldBasePay,
        },
      },
    };
  } catch (error) {
    logger.error("Error in applySalaryIncrease:", error);
    return {
      status: false,
      message: error.message || "Failed to apply salary increase",
      data: null,
    };
  }
};
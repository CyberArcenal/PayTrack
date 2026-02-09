// ===================== update_bank_info.ipc.js =====================

const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");

/**
 * Update employee bank information
 * @param {Object} bankData
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function updateEmployeeBankInfo(bankData, queryRunner) {
  const repo = queryRunner ? queryRunner.manager.getRepository("Employee") : AppDataSource.getRepository("Employee");

  try {
    const { id, bankName, accountNumber, paymentMethod, userId, userType } = bankData;

    if (!id) {
      return {
        status: false,
        message: "Employee ID is required",
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

    const oldBankInfo = {
      bankName: employee.bankName,
      accountNumber: employee.accountNumber,
      paymentMethod: employee.paymentMethod,
    };

    const updateData = {
      bankName: bankName || employee.bankName,
      accountNumber: accountNumber || employee.accountNumber,
      paymentMethod: paymentMethod || employee.paymentMethod,
      updatedAt: new Date(),
    };

    await repo.update(id, updateData);
    const updatedEmployee = await repo.findOne({ where: { id } });


    logger.info(`Employee bank info updated: ID ${id}`);

    return {
      status: true,
      message: "Employee bank information updated successfully",
      data: updatedEmployee,
    };
  } catch (error) {
    logger.error("Error in updateEmployeeBankInfo:", error);
    return {
      status: false,
      message: error.message || "Failed to update employee bank information",
      data: null,
    };
  }
};
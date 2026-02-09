// ===================== update_govt_ids.ipc.js =====================

const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");

/**
 * Update employee government IDs
 * @param {Object} govtData
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function updateEmployeeGovernmentIds(govtData, queryRunner) {
  const repo = queryRunner ? queryRunner.manager.getRepository("Employee") : AppDataSource.getRepository("Employee");

  try {
    const { id, sssNumber, philhealthNumber, pagibigNumber, tinNumber, userId, userType } = govtData;

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

    const oldGovtIds = {
      sssNumber: employee.sssNumber,
      philhealthNumber: employee.philhealthNumber,
      pagibigNumber: employee.pagibigNumber,
      tinNumber: employee.tinNumber,
    };

    const updateData = {
      sssNumber: sssNumber || employee.sssNumber,
      philhealthNumber: philhealthNumber || employee.philhealthNumber,
      pagibigNumber: pagibigNumber || employee.pagibigNumber,
      tinNumber: tinNumber || employee.tinNumber,
      updatedAt: new Date(),
    };

    await repo.update(id, updateData);
    const updatedEmployee = await repo.findOne({ where: { id } });



    logger.info(`Employee government IDs updated: ID ${id}`);

    return {
      status: true,
      message: "Employee government IDs updated successfully",
      data: updatedEmployee,
    };
  } catch (error) {
    logger.error("Error in updateEmployeeGovernmentIds:", error);
    return {
      status: false,
      message: error.message || "Failed to update employee government IDs",
      data: null,
    };
  }
};
// ===================== update_department.ipc.js =====================

const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");

/**
 * Update employee department
 * @param {Object} departmentData
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function updateEmployeeDepartment(departmentData, queryRunner) {
  const repo = queryRunner ? queryRunner.manager.getRepository("Employee") : AppDataSource.getRepository("Employee");

  try {
    const { id, department, userId, userType, reason } = departmentData;

    if (!id || !department) {
      return {
        status: false,
        message: "Employee ID and department are required",
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

    const oldDepartment = employee.department;
    await repo.update(id, { department, updatedAt: new Date() });
    const updatedEmployee = await repo.findOne({ where: { id } });



    logger.info(`Employee department updated: ID ${id}, ${oldDepartment} -> ${department}`);

    return {
      status: true,
      message: "Employee department updated successfully",
      data: updatedEmployee,
    };
  } catch (error) {
    logger.error("Error in updateEmployeeDepartment:", error);
    return {
      status: false,
      message: error.message || "Failed to update employee department",
      data: null,
    };
  }
};
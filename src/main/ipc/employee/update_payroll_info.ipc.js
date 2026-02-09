// ===================== update_payroll_info.ipc.js =====================


const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");

/**
 * Update employee payroll information
 * @param {Object} payrollData
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function updateEmployeePayrollInfo(payrollData, queryRunner) {
  const repo = queryRunner ? queryRunner.manager.getRepository("Employee") : AppDataSource.getRepository("Employee");

  try {
    const { id, basePay, dailyRate, hourlyRate, overtimeRate, paymentMethod, userId, userType } = payrollData;

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

    // Validate rates
    const updateData = {
      basePay: basePay !== undefined ? parseFloat(basePay) : employee.basePay,
      dailyRate: dailyRate !== undefined ? parseFloat(dailyRate) : employee.dailyRate,
      hourlyRate: hourlyRate !== undefined ? parseFloat(hourlyRate) : employee.hourlyRate,
      overtimeRate: overtimeRate !== undefined ? parseFloat(overtimeRate) : employee.overtimeRate,
      paymentMethod: paymentMethod || employee.paymentMethod,
      updatedAt: new Date(),
    };

    await repo.update(id, updateData);
    const updatedEmployee = await repo.findOne({ where: { id } });

 

    logger.info(`Employee payroll info updated: ID ${id}`);

    return {
      status: true,
      message: "Employee payroll information updated successfully",
      data: updatedEmployee,
    };
  } catch (error) {
    logger.error("Error in updateEmployeePayrollInfo:", error);
    return {
      status: false,
      message: error.message || "Failed to update employee payroll information",
      data: null,
    };
  }
};
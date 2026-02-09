// ===================== update.ipc.js =====================
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");
const validateEmployeeData = require("../validation/validate_data.ipc")
/**
 * Update employee
 * @param {Object} updateData
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function updateEmployee(updateData, queryRunner) {
  const repo = queryRunner ? queryRunner.manager.getRepository("Employee") : AppDataSource.getRepository("Employee");

  try {
    const { id, ...updateFields } = updateData;

    if (!id) {
      return {
        status: false,
        message: "Employee ID is required",
        data: null,
      };
    }

    // Get current employee data for audit log
    const currentEmployee = await repo.findOne({ where: { id } });
    if (!currentEmployee) {
      return {
        status: false,
        message: `Employee with ID ${id} not found`,
        data: null,
      };
    }

    // Validate update data
    const validation = validateEmployeeData(updateFields);
    if (!validation.isValid) {
      return {
        status: false,
        message: "Validation failed",
        data: { errors: validation.errors },
      };
    }

    // Check for duplicate employee number if changing
    if (updateFields.employeeNumber && updateFields.employeeNumber !== currentEmployee.employeeNumber) {
      const existingEmployee = await repo.findOne({
        where: { employeeNumber: updateFields.employeeNumber },
      });

      if (existingEmployee) {
        return {
          status: false,
          message: `Employee number ${updateFields.employeeNumber} already exists`,
          data: null,
        };
      }
    }

    // Check for duplicate email if changing
    if (updateFields.email && updateFields.email !== currentEmployee.email) {
      const existingEmail = await repo.findOne({
        where: { email: updateFields.email },
      });

      if (existingEmail) {
        return {
          status: false,
          message: `Email ${updateFields.email} already exists`,
          data: null,
        };
      }
    }

    // Recalculate rates if basePay is being updated
    if (updateFields.basePay !== undefined) {
      const basePay = parseFloat(updateFields.basePay);
      updateFields.dailyRate = basePay / 10; // Assuming 10 working days
      updateFields.hourlyRate = updateFields.dailyRate / 8;
    }

    // Update employee
    updateFields.updatedAt = new Date();
    await repo.update(id, updateFields);

    // Get updated employee
    const updatedEmployee = await repo.findOne({ where: { id } });

    logger.info(`Employee updated: ID ${id}`);

    return {
      status: true,
      message: "Employee updated successfully",
      data: updatedEmployee,
    };
  } catch (error) {
    logger.error("Error in updateEmployee:", error);
    return {
      status: false,
      message: error.message || "Failed to update employee",
      data: null,
    };
  }
};
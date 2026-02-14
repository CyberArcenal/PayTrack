// @ts-check

const Employee = require("../../../../entities/Employee");
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");


/**
 * Get employee by employee number
 * @param {Object} params - { employeeNumber }
 * @returns {Promise<{status: boolean, message?: string, data?: any}>}
 */
module.exports = async (params) => {
  try {
    // @ts-ignore
    if (!params.employeeNumber) {
      return { status: false, message: "Employee number is required" };
    }

    const repo = AppDataSource.getRepository(Employee);
    // @ts-ignore
    const employee = await repo.findOne({ where: { employeeNumber: params.employeeNumber } });

    if (!employee) {
      return { status: false, message: "Employee not found" };
    }

    return { status: true, data: employee };
  } catch (error) {
    // @ts-ignore
    logger.error("Error in getEmployeeByNumber:", error);
    // @ts-ignore
    return { status: false, message: error.message || "Failed to get employee by number" };
  }
};
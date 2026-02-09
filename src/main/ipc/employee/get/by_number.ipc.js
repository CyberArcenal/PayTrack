// ===================== by_number.ipc.js =====================
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get employee by employee number
 * @param {string} employeeNumber
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getEmployeeByNumber(employeeNumber) {
  try {
    const employeeRepo = AppDataSource.getRepository("Employee");
    const employee = await employeeRepo.findOne({
      where: { employeeNumber },
    });

    if (!employee) {
      return {
        status: false,
        message: `Employee with number ${employeeNumber} not found`,
        data: null,
      };
    }

    return {
      status: true,
      message: "Employee retrieved successfully",
      data: employee,
    };
  } catch (error) {
    logger.error("Error in getEmployeeByNumber:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve employee",
      data: null,
    };
  }
};
// ===================== generate_employee_number.ipc.js =====================
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");

/**
 * Generate employee number
 * @param {string} [prefix]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function generateEmployeeNumber(prefix = "EMP") {
  try {
    const employeeRepo = AppDataSource.getRepository("Employee");
    
    // Get the highest employee number with the given prefix
    const result = await employeeRepo
      .createQueryBuilder("employee")
      .select("MAX(employee.employeeNumber)", "maxNumber")
      .where("employee.employeeNumber LIKE :prefix", { prefix: `${prefix}%` })
      .getRawOne();

    let nextNumber = 1;

    if (result.maxNumber) {
      const match = result.maxNumber.match(/\d+$/);
      if (match) {
        nextNumber = parseInt(match[0]) + 1;
      }
    }

    // Format with leading zeros
    const employeeNumber = `${prefix}${nextNumber.toString().padStart(5, "0")}`;

    return {
      status: true,
      message: "Employee number generated successfully",
      data: {
        employeeNumber,
        prefix,
        sequence: nextNumber,
      },
    };
  } catch (error) {
    logger.error("Error in generateEmployeeNumber:", error);
    return {
      status: false,
      message: error.message || "Failed to generate employee number",
      data: null,
    };
  }
};
// ===================== check_duplicate.ipc.js =====================

const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");

/**
 * Check for duplicate employee
 * @param {Object} employeeData
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function checkDuplicateEmployee(employeeData) {
  try {
    const employeeRepo = AppDataSource.getRepository("Employee");
    const duplicates = [];

    // Check by employee number
    if (employeeData.employeeNumber) {
      const existingByNumber = await employeeRepo.findOne({
        where: { employeeNumber: employeeData.employeeNumber },
      });
      if (existingByNumber) {
        duplicates.push({
          field: "employeeNumber",
          value: employeeData.employeeNumber,
          existingEmployeeId: existingByNumber.id,
          existingEmployeeName: `${existingByNumber.firstName} ${existingByNumber.lastName}`,
        });
      }
    }

    // Check by email
    if (employeeData.email) {
      const existingByEmail = await employeeRepo.findOne({
        where: { email: employeeData.email },
      });
      if (existingByEmail) {
        duplicates.push({
          field: "email",
          value: employeeData.email,
          existingEmployeeId: existingByEmail.id,
          existingEmployeeName: `${existingByEmail.firstName} ${existingByEmail.lastName}`,
        });
      }
    }

    // Check by government IDs
    if (employeeData.sssNumber) {
      const existingBySSS = await employeeRepo.findOne({
        where: { sssNumber: employeeData.sssNumber },
      });
      if (existingBySSS) {
        duplicates.push({
          field: "sssNumber",
          value: employeeData.sssNumber,
          existingEmployeeId: existingBySSS.id,
          existingEmployeeName: `${existingBySSS.firstName} ${existingBySSS.lastName}`,
        });
      }
    }

    if (employeeData.tinNumber) {
      const existingByTIN = await employeeRepo.findOne({
        where: { tinNumber: employeeData.tinNumber },
      });
      if (existingByTIN) {
        duplicates.push({
          field: "tinNumber",
          value: employeeData.tinNumber,
          existingEmployeeId: existingByTIN.id,
          existingEmployeeName: `${existingByTIN.firstName} ${existingByTIN.lastName}`,
        });
      }
    }

    return {
      status: true,
      message: duplicates.length > 0 ? "Potential duplicates found" : "No duplicates found",
      data: {
        hasDuplicates: duplicates.length > 0,
        duplicates,
      },
    };
  } catch (error) {
    logger.error("Error in checkDuplicateEmployee:", error);
    return {
      status: false,
      message: error.message || "Failed to check for duplicates",
      data: null,
    };
  }
};
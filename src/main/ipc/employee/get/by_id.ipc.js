// ===================== by_id.ipc.js =====================
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get employee by ID
 * @param {number} id
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getEmployeeById(id) {
  try {
    const employeeRepo = AppDataSource.getRepository("Employee");
    const employee = await employeeRepo.findOne({
      where: { id },
      relations: ["attendanceLogs", "payrollRecords", "overtimeLogs"],
    });

    if (!employee) {
      return {
        status: false,
        message: `Employee with ID ${id} not found`,
        data: null,
      };
    }

    return {
      status: true,
      message: "Employee retrieved successfully",
      data: employee,
    };
  } catch (error) {
    logger.error("Error in getEmployeeById:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve employee",
      data: null,
    };
  }
};
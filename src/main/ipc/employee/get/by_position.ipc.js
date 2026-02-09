// ===================== by_position.ipc.js =====================
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get employees by position
 * @param {string} position
 * @param {Object} filters
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getEmployeesByPosition(position, filters = {}) {
  try {
    const employeeRepo = AppDataSource.getRepository("Employee");
    const queryBuilder = employeeRepo.createQueryBuilder("employee")
      .where("employee.position = :position", { position })
      .andWhere("employee.status = :status", { status: filters.status || "active" });

    if (filters.department) {
      queryBuilder.andWhere("employee.department = :department", { department: filters.department });
    }

    const employees = await queryBuilder.getMany();

    return {
      status: true,
      message: `Employees with position ${position} retrieved successfully`,
      data: employees,
    };
  } catch (error) {
    logger.error("Error in getEmployeesByPosition:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve employees by position",
      data: null,
    };
  }
};
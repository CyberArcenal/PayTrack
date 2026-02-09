// ===================== by_department.ipc.js =====================
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get employees by department
 * @param {string} department
 * @param {Object} filters
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getEmployeesByDepartment(department, filters = {}) {
  try {
    const employeeRepo = AppDataSource.getRepository("Employee");
    const queryBuilder = employeeRepo.createQueryBuilder("employee")
      .where("employee.department = :department", { department })
      .andWhere("employee.status = :status", { status: filters.status || "active" });

    if (filters.position) {
      queryBuilder.andWhere("employee.position = :position", { position: filters.position });
    }

    const employees = await queryBuilder.getMany();

    return {
      status: true,
      message: `Employees in ${department} department retrieved successfully`,
      data: employees,
    };
  } catch (error) {
    logger.error("Error in getEmployeesByDepartment:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve employees by department",
      data: null,
    };
  }
};
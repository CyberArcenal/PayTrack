// ===================== by_status.ipc.js =====================
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get employees by status
 * @param {string} status
 * @param {Object} filters
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getEmployeesByStatus(status, filters = {}) {
  try {
    const employeeRepo = AppDataSource.getRepository("Employee");
    const queryBuilder = employeeRepo.createQueryBuilder("employee")
      .where("employee.status = :status", { status });

    if (filters.department) {
      queryBuilder.andWhere("employee.department = :department", { department: filters.department });
    }
    if (filters.employmentType) {
      queryBuilder.andWhere("employee.employmentType = :employmentType", { employmentType: filters.employmentType });
    }

    const employees = await queryBuilder.getMany();

    return {
      status: true,
      message: `${status} employees retrieved successfully`,
      data: employees,
    };
  } catch (error) {
    logger.error("Error in getEmployeesByStatus:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve employees by status",
      data: null,
    };
  }
};
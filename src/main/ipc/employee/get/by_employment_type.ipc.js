// ===================== by_employment_type.ipc.js =====================
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get employees by employment type
 * @param {string} employmentType
 * @param {Object} filters
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getEmployeesByEmploymentType(employmentType, filters = {}) {
  try {
    const employeeRepo = AppDataSource.getRepository("Employee");
    const queryBuilder = employeeRepo.createQueryBuilder("employee")
      .where("employee.employmentType = :employmentType", { employmentType });

    if (filters.status) {
      queryBuilder.andWhere("employee.status = :status", { status: filters.status });
    }
    if (filters.department) {
      queryBuilder.andWhere("employee.department = :department", { department: filters.department });
    }

    const employees = await queryBuilder.getMany();

    return {
      status: true,
      message: `${employmentType} employees retrieved successfully`,
      data: employees,
    };
  } catch (error) {
    logger.error("Error in getEmployeesByEmploymentType:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve employees by employment type",
      data: null,
    };
  }
};
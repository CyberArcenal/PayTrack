// ===================== count.ipc.js =====================
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get employee count with filters
 * @param {Object} filters
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getEmployeeCount(filters = {}) {
  try {
    const employeeRepo = AppDataSource.getRepository("Employee");
    const queryBuilder = employeeRepo.createQueryBuilder("employee");

    if (filters.department) {
      queryBuilder.andWhere("employee.department = :department", { department: filters.department });
    }
    if (filters.status) {
      queryBuilder.andWhere("employee.status = :status", { status: filters.status });
    }
    if (filters.employmentType) {
      queryBuilder.andWhere("employee.employmentType = :employmentType", { employmentType: filters.employmentType });
    }

    const total = await queryBuilder.getCount();

    // Get counts by status
    const statusCounts = await employeeRepo
      .createQueryBuilder("employee")
      .select("employee.status", "status")
      .addSelect("COUNT(*)", "count")
      .groupBy("employee.status")
      .getRawMany();

    // Get counts by department
    const departmentCounts = await employeeRepo
      .createQueryBuilder("employee")
      .select("employee.department", "department")
      .addSelect("COUNT(*)", "count")
      .groupBy("employee.department")
      .getRawMany();

    return {
      status: true,
      message: "Employee count retrieved successfully",
      data: {
        total,
        byStatus: statusCounts,
        byDepartment: departmentCounts,
        filters,
      },
    };
  } catch (error) {
    logger.error("Error in getEmployeeCount:", error);
    return {
      status: false,
      message: error.message || "Failed to get employee count",
      data: null,
    };
  }
};
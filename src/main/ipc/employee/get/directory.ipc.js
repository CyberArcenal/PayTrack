// ===================== directory.ipc.js =====================
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get employee directory
 * @param {Object} filters
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getEmployeeDirectory(filters = {}) {
  try {
    const employeeRepo = AppDataSource.getRepository("Employee");
    const queryBuilder = employeeRepo.createQueryBuilder("employee");

    // Only active employees for directory
    queryBuilder.where("employee.status = :status", { status: "active" });

    if (filters.department) {
      queryBuilder.andWhere("employee.department = :department", { department: filters.department });
    }

    // Select directory fields
    queryBuilder.select([
      "employee.id",
      "employee.employeeNumber",
      "employee.firstName",
      "employee.middleName",
      "employee.lastName",
      "employee.position",
      "employee.department",
      "employee.email",
      "employee.phone",
    ]);

    // Sort by last name
    queryBuilder.orderBy("employee.lastName", "ASC").addOrderBy("employee.firstName", "ASC");

    const employees = await queryBuilder.getMany();

    // Group by department
    const directoryByDepartment = employees.reduce((acc, employee) => {
      const department = employee.department || "Unassigned";
      if (!acc[department]) {
        acc[department] = [];
      }
      acc[department].push(employee);
      return acc;
    }, {});

    return {
      status: true,
      message: "Employee directory retrieved successfully",
      data: {
        directoryByDepartment,
        totalActiveEmployees: employees.length,
        departments: Object.keys(directoryByDepartment),
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error("Error in getEmployeeDirectory:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve employee directory",
      data: null,
    };
  }
};
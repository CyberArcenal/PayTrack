// ===================== masterlist.ipc.js =====================
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get employee masterlist
 * @param {Object} filters
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getEmployeeMasterlist(filters = {}) {
  try {
    const employeeRepo = AppDataSource.getRepository("Employee");
    const queryBuilder = employeeRepo.createQueryBuilder("employee");

    // Apply filters
    if (filters.department) {
      queryBuilder.andWhere("employee.department = :department", { department: filters.department });
    }
    if (filters.status) {
      queryBuilder.andWhere("employee.status = :status", { status: filters.status });
    }

    // Select only necessary fields for masterlist
    queryBuilder.select([
      "employee.id",
      "employee.employeeNumber",
      "employee.firstName",
      "employee.middleName",
      "employee.lastName",
      "employee.position",
      "employee.department",
      "employee.hireDate",
      "employee.status",
      "employee.employmentType",
      "employee.basePay",
      "employee.dailyRate",
      "employee.hourlyRate",
    ]);

    // Sort by department and last name
    queryBuilder.orderBy("employee.department", "ASC").addOrderBy("employee.lastName", "ASC");

    const employees = await queryBuilder.getMany();

    // Calculate totals
    const totalEmployees = employees.length;
    const totalBasePay = employees.reduce((sum, emp) => sum + (emp.basePay || 0), 0);
    const avgBasePay = totalEmployees > 0 ? totalBasePay / totalEmployees : 0;

    return {
      status: true,
      message: "Employee masterlist retrieved successfully",
      data: {
        employees,
        summary: {
          totalEmployees,
          totalBasePay: parseFloat(totalBasePay.toFixed(2)),
          avgBasePay: parseFloat(avgBasePay.toFixed(2)),
          generatedAt: new Date().toISOString(),
        },
      },
    };
  } catch (error) {
    logger.error("Error in getEmployeeMasterlist:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve employee masterlist",
      data: null,
    };
  }
};
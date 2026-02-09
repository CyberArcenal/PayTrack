// ===================== salary_report.ipc.js =====================
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get employee salary report
 * @param {string} [department]
 * @param {number} [minSalary]
 * @param {number} [maxSalary]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getEmployeeSalaryReport(department, minSalary, maxSalary) {
  try {
    const employeeRepo = AppDataSource.getRepository("Employee");
    const queryBuilder = employeeRepo.createQueryBuilder("employee");

    // Apply filters
    if (department) {
      queryBuilder.andWhere("employee.department = :department", { department });
    }
    if (minSalary !== undefined) {
      queryBuilder.andWhere("employee.basePay >= :minSalary", { minSalary: parseFloat(minSalary) });
    }
    if (maxSalary !== undefined) {
      queryBuilder.andWhere("employee.basePay <= :maxSalary", { maxSalary: parseFloat(maxSalary) });
    }

    // Only active employees
    queryBuilder.andWhere("employee.status = :status", { status: "active" });

    // Select salary report fields
    queryBuilder.select([
      "employee.id",
      "employee.employeeNumber",
      "employee.firstName",
      "employee.lastName",
      "employee.position",
      "employee.department",
      "employee.basePay",
      "employee.dailyRate",
      "employee.hourlyRate",
      "employee.hireDate",
      "employee.employmentType",
    ]);

    // Sort by salary (descending)
    queryBuilder.orderBy("employee.basePay", "DESC");

    const employees = await queryBuilder.getMany();

    // Calculate statistics
    const salaries = employees.map((emp) => emp.basePay || 0);
    const totalSalary = salaries.reduce((sum, salary) => sum + salary, 0);
    const avgSalary = salaries.length > 0 ? totalSalary / salaries.length : 0;
    const minSalaryActual = salaries.length > 0 ? Math.min(...salaries) : 0;
    const maxSalaryActual = salaries.length > 0 ? Math.max(...salaries) : 0;

    // Group by department
    const salaryByDepartment = employees.reduce((acc, employee) => {
      const dept = employee.department || "Unassigned";
      if (!acc[dept]) {
        acc[dept] = {
          employees: [],
          totalSalary: 0,
          avgSalary: 0,
        };
      }
      acc[dept].employees.push(employee);
      acc[dept].totalSalary += employee.basePay || 0;
      acc[dept].avgSalary = acc[dept].employees.length > 0 ? acc[dept].totalSalary / acc[dept].employees.length : 0;
      return acc;
    }, {});

    return {
      status: true,
      message: "Employee salary report retrieved successfully",
      data: {
        employees,
        statistics: {
          totalEmployees: employees.length,
          totalSalary: parseFloat(totalSalary.toFixed(2)),
          avgSalary: parseFloat(avgSalary.toFixed(2)),
          minSalary: parseFloat(minSalaryActual.toFixed(2)),
          maxSalary: parseFloat(maxSalaryActual.toFixed(2)),
        },
        salaryByDepartment,
        filters: {
          department,
          minSalary,
          maxSalary,
        },
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error("Error in getEmployeeSalaryReport:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve employee salary report",
      data: null,
    };
  }
};
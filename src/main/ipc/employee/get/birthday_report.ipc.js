// ===================== birthday_report.ipc.js =====================
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get employee birthday report
 * @param {number} [month]
 * @param {number} [year]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getEmployeeBirthdayReport(month, year) {
  try {
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;
    const employeeRepo = AppDataSource.getRepository("Employee");
    const queryBuilder = employeeRepo.createQueryBuilder("employee");

    // Only active employees
    queryBuilder.where("employee.status = :status", { status: "active" });

    // Filter by birth month
    queryBuilder.andWhere("EXTRACT(MONTH FROM employee.birthDate) = :month", { month: currentMonth });

    // Select birthday report fields
    queryBuilder.select([
      "employee.id",
      "employee.employeeNumber",
      "employee.firstName",
      "employee.lastName",
      "employee.birthDate",
      "employee.position",
      "employee.department",
      "employee.email",
      "employee.phone",
    ]);

    // Sort by birth day
    queryBuilder.orderBy("EXTRACT(DAY FROM employee.birthDate)", "ASC");

    const employees = await queryBuilder.getMany();

    // Calculate age
    const employeesWithAge = employees.map((employee) => {
      const birthDate = new Date(employee.birthDate);
      const age = currentYear - birthDate.getFullYear();
      const nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
      if (nextBirthday < new Date()) {
        nextBirthday.setFullYear(currentYear + 1);
      }
      const daysUntilBirthday = Math.ceil((nextBirthday - new Date()) / (1000 * 60 * 60 * 24));

      return {
        ...employee,
        age,
        nextBirthday: nextBirthday.toISOString().split("T")[0],
        daysUntilBirthday,
      };
    });

    // Group by birth day
    const birthdaysByDay = employeesWithAge.reduce((acc, employee) => {
      const birthDate = new Date(employee.birthDate);
      const day = birthDate.getDate();
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(employee);
      return acc;
    }, {});

    // Get month name
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const monthName = monthNames[currentMonth - 1];

    return {
      status: true,
      message: "Employee birthday report retrieved successfully",
      data: {
        month: currentMonth,
        monthName,
        year: currentYear,
        totalBirthdays: employees.length,
        birthdaysByDay,
        employees: employeesWithAge,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error("Error in getEmployeeBirthdayReport:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve employee birthday report",
      data: null,
    };
  }
};
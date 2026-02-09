// ===================== calculate_age.ipc.js =====================
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");

/**
 * Get employee age
 * @param {number} employeeId
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getEmployeeAge(employeeId) {
  try {
    if (!employeeId) {
      return {
        status: false,
        message: "Employee ID is required",
        data: null,
      };
    }

    const employeeRepo = AppDataSource.getRepository("Employee");
    const employee = await employeeRepo.findOne({ where: { id: employeeId } });
    if (!employee || !employee.birthDate) {
      return {
        status: false,
        message: employee ? "Employee birth date not available" : `Employee with ID ${employeeId} not found`,
        data: null,
      };
    }

    const birthDate = new Date(employee.birthDate);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();

    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    // Calculate next birthday
    const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }

    const daysUntilBirthday = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));

    return {
      status: true,
      message: "Employee age calculated successfully",
      data: {
        employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        birthDate: employee.birthDate,
        age,
        nextBirthday: nextBirthday.toISOString().split("T")[0],
        daysUntilBirthday,
        isBirthdayToday: monthDiff === 0 && dayDiff === 0,
      },
    };
  } catch (error) {
    logger.error("Error in getEmployeeAge:", error);
    return {
      status: false,
      message: error.message || "Failed to calculate employee age",
      data: null,
    };
  }
};
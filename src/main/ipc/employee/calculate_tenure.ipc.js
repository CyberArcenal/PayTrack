// ===================== calculate_tenure.ipc.js =====================

const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");

/**
 * Calculate service tenure
 * @param {number} employeeId
 * @param {string} [asOfDate]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function calculateServiceTenure(employeeId, asOfDate) {
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
    if (!employee) {
      return {
        status: false,
        message: `Employee with ID ${employeeId} not found`,
        data: null,
      };
    }

    const hireDate = new Date(employee.hireDate);
    const endDate = asOfDate ? new Date(asOfDate) : new Date();

    // Calculate difference in years, months, and days
    let years = endDate.getFullYear() - hireDate.getFullYear();
    let months = endDate.getMonth() - hireDate.getMonth();
    let days = endDate.getDate() - hireDate.getDate();

    // Adjust for negative days
    if (days < 0) {
      months--;
      // Get days in previous month
      const prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
      days += prevMonth.getDate();
    }

    // Adjust for negative months
    if (months < 0) {
      years--;
      months += 12;
    }

    // Calculate total days
    const totalDays = Math.floor((endDate - hireDate) / (1000 * 60 * 60 * 24));
    const totalMonths = years * 12 + months;

    return {
      status: true,
      message: "Service tenure calculated successfully",
      data: {
        employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        hireDate: employee.hireDate,
        asOfDate: endDate.toISOString().split("T")[0],
        tenure: {
          years,
          months,
          days,
          totalDays,
          totalMonths,
        },
        formattedTenure: `${years} years, ${months} months, ${days} days`,
        isAnniversary: hireDate.getDate() === endDate.getDate() && hireDate.getMonth() === endDate.getMonth(),
      },
    };
  } catch (error) {
    logger.error("Error in calculateServiceTenure:", error);
    return {
      status: false,
      message: error.message || "Failed to calculate service tenure",
      data: null,
    };
  }
};
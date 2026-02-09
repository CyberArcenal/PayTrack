// ===================== calculate_rates.ipc.js =====================


const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");

/**
 * Calculate employee rates based on base pay
 * @param {number} employeeId
 * @param {number} [basePay]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function calculateEmployeeRates(employeeId, basePay) {
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

    const effectiveBasePay = basePay || employee.basePay;
    const workingDays = 10; // Default assumption
    const hoursPerDay = 8;

    const dailyRate = effectiveBasePay / workingDays;
    const hourlyRate = dailyRate / hoursPerDay;
    const overtimeRate = employee.overtimeRate || 1.25;

    return {
      status: true,
      message: "Employee rates calculated successfully",
      data: {
        basePay: effectiveBasePay,
        dailyRate: parseFloat(dailyRate.toFixed(2)),
        hourlyRate: parseFloat(hourlyRate.toFixed(2)),
        overtimeRate,
        workingDays,
        hoursPerDay,
      },
    };
  } catch (error) {
    logger.error("Error in calculateEmployeeRates:", error);
    return {
      status: false,
      message: error.message || "Failed to calculate employee rates",
      data: null,
    };
  }
};
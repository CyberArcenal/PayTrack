// src/main/ipc/payrollPeriod/get/by_date.ipc.js
// @ts-check
const { AppDataSource } = require("../../../db/datasource");
const PayrollPeriod = require("../../../../entities/PayrollPeriod");

/**
 * Get payroll period that covers a specific date
 * @param {Object} params
 * @param {string} params.date - Date in ISO format (YYYY-MM-DD)
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const { date } = params || {};
    if (!date) {
      throw new Error("Missing required parameter: date");
    }

    // Ensure DataSource is initialized
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const repository = AppDataSource.getRepository(PayrollPeriod);

    const period = await repository
      .createQueryBuilder("period")
      .where("period.startDate <= :date", { date })
      .andWhere("period.endDate >= :date", { date })
      .getOne();

    return {
      status: true,
      message: period ? "Payroll period found for date" : "No payroll period covers the specified date",
      data: period || null,
    };
  } catch (error) {
    console.error("Error in getPayrollPeriodByDate:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to retrieve payroll period by date",
      data: null,
    };
  }
};
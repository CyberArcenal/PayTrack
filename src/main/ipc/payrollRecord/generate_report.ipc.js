// src/main/ipc/payrollRecord/generate_report.ipc
const payrollRecordService = require("../../../../services/PayrollRecordService");
const { logger } = require("../../../utils/logger");

/**
 * Generate a payroll report (summary data).
 * @param {Object} params - { periodId, startDate, endDate, format } format can be ignored for now
 */
module.exports = async (params) => {
  try {
    const { periodId, startDate, endDate, format } = params;
    const filters = {};
    if (periodId) filters.periodId = parseInt(periodId);
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const summary = await payrollRecordService.getSummary(filters);
    // Additional report data could be added here (e.g., list of records)
    const { payroll } = await payrollRecordService.getRepositories();
    const records = await payroll
      .createQueryBuilder("payroll")
      .leftJoinAndSelect("payroll.employee", "employee")
      .leftJoinAndSelect("payroll.period", "period")
      .where(filters.periodId ? "payroll.periodId = :periodId" : "1=1", filters)
      .getMany();

    return {
      status: true,
      data: {
        summary,
        records,
      },
      message: "Report generated successfully",
    };
  } catch (error) {
    logger.error("Error in generatePayrollReport:", error);
    return { status: false, message: error.message, data: null };
  }
};
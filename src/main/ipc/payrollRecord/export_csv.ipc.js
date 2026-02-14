// src/main/ipc/payrollRecord/export_csv.ipc
const { Parser } = require("json2csv");
const payrollRecordService = require("../../../../services/PayrollRecordService");
const { logger } = require("../../../utils/logger");

/**
 * Export payroll records to CSV.
 * @param {Object} params - filters like employeeId, periodId, paymentStatus, etc.
 */
module.exports = async (params) => {
  try {
    const { page, limit, ...filters } = params; // ignore pagination for export, fetch all
    const { payroll } = await payrollRecordService.getRepositories();

    const query = payroll.createQueryBuilder("payroll")
      .leftJoinAndSelect("payroll.employee", "employee")
      .leftJoinAndSelect("payroll.period", "period");

    if (filters.employeeId) {
      query.andWhere("payroll.employeeId = :employeeId", { employeeId: filters.employeeId });
    }
    if (filters.periodId) {
      query.andWhere("payroll.periodId = :periodId", { periodId: filters.periodId });
    }
    if (filters.paymentStatus) {
      query.andWhere("payroll.paymentStatus = :paymentStatus", { paymentStatus: filters.paymentStatus });
    }
    if (filters.startDate) {
      query.andWhere("period.endDate >= :startDate", { startDate: filters.startDate });
    }
    if (filters.endDate) {
      query.andWhere("period.endDate <= :endDate", { endDate: filters.endDate });
    }

    const records = await query.getMany();

    // Flatten data for CSV
    const flatRecords = records.map((r) => ({
      id: r.id,
      employeeName: `${r.employee?.firstName || ""} ${r.employee?.lastName || ""}`.trim(),
      employeeNumber: r.employee?.employeeNumber,
      period: `${r.period?.startDate} to ${r.period?.endDate}`,
      daysPresent: r.daysPresent,
      daysAbsent: r.daysAbsent,
      daysLate: r.daysLate,
      daysHalfDay: r.daysHalfDay,
      basicPay: r.basicPay,
      overtimePay: r.overtimePay,
      grossPay: r.grossPay,
      sssDeduction: r.sssDeduction,
      philhealthDeduction: r.philhealthDeduction,
      pagibigDeduction: r.pagibigDeduction,
      taxDeduction: r.taxDeduction,
      loanDeduction: r.loanDeduction,
      advanceDeduction: r.advanceDeduction,
      otherDeductions: r.otherDeductions,
      deductionsTotal: r.deductionsTotal,
      netPay: r.netPay,
      paymentStatus: r.paymentStatus,
      paidAt: r.paidAt,
      paymentMethod: r.paymentMethod,
      paymentReference: r.paymentReference,
    }));

    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(flatRecords);

    return {
      status: true,
      data: csv,
      message: "CSV generated successfully",
    };
  } catch (error) {
    logger.error("Error in exportPayrollRecordsToCSV:", error);
    return { status: false, message: error.message, data: null };
  }
};
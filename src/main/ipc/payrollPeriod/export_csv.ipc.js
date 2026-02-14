// src/main/ipc/payrollPeriod/export_csv.ipc.js
const payrollPeriodService = require("../../../services/PayrollPeriod");

/**
 * Convert array of objects to CSV string
 * @param {Array<Object>} items
 * @returns {string}
 */
function jsonToCsv(items) {
  if (!items || items.length === 0) return "";

  const headers = Object.keys(items[0]);
  const csvRows = [];
  csvRows.push(headers.join(","));

  for (const item of items) {
    const values = headers.map(header => {
      const val = item[header] ?? "";
      // Escape commas, quotes, and newlines using JSON.stringify
      return JSON.stringify(String(val));
    });
    csvRows.push(values.join(","));
  }

  return csvRows.join("\n");
}

/**
 * Export payroll periods to CSV
 * @param {Object} params - Optional filters similar to getAll
 * @param {string} [params.status] - Filter by status
 * @param {string} [params.periodType] - Filter by period type
 * @param {string} [params.startDate] - Start date filter
 * @param {string} [params.endDate] - End date filter
 * @returns {Promise<{status: boolean, message: string, data: { csv: string, filename: string } | null}>}
 */
module.exports = async (params) => {
  try {
    const {
      status,
      periodType,
      startDate,
      endDate,
    } = params || {};

    const options = {};
    if (status) options.status = status;
    if (periodType) options.periodType = periodType;
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;

    const periods = await payrollPeriodService.findAll(options);

    // Flatten to a plain object for CSV
    const csvData = periods.map(p => ({
      ID: p.id,
      Name: p.name,
      PeriodType: p.periodType,
      StartDate: p.startDate,
      EndDate: p.endDate,
      PayDate: p.payDate,
      Status: p.status,
      WorkingDays: p.workingDays,
      TotalEmployees: p.totalEmployees,
      TotalGrossPay: p.totalGrossPay,
      TotalDeductions: p.totalDeductions,
      TotalNetPay: p.totalNetPay,
      CreatedAt: p.createdAt,
    }));

    const csv = jsonToCsv(csvData);
    const filename = `payroll_periods_${new Date().toISOString().slice(0,10)}.csv`;

    return {
      status: true,
      message: "CSV generated successfully",
      data: { csv, filename },
    };
  } catch (error) {
    console.error("Error in exportPayrollPeriodsToCSV:", error);
    return {
      status: false,
      message: error.message || "Failed to export payroll periods to CSV",
      data: null,
    };
  }
};
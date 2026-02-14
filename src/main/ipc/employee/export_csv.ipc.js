const employeeService = require("../../../services/Employee");
const { logger } = require("../../../utils/logger");
const { stringify } = require("csv-stringify/sync"); // You may need to install csv-stringify

/**
 * Export employees to CSV format
 * @param {Object} params - { filters?: object, columns?: string[] }
 * @returns {Promise<{status: boolean, message?: string, data?: string}>}
 */
module.exports = async (params) => {
  try {
    const { filters = {}, columns } = params;

    const employees = await employeeService.findAll(filters);

    if (!employees.length) {
      return { status: false, message: "No employees to export" };
    }

    // Define default columns if not provided
    const defaultColumns = [
      "id", "employeeNumber", "firstName", "middleName", "lastName",
      "email", "phone", "department", "position", "status", "employmentType",
      "hireDate", "basePay", "dailyRate", "hourlyRate"
    ];
    const selectedColumns = columns && columns.length ? columns : defaultColumns;

    // Prepare data: map employees to arrays of values in column order
    const data = employees.map(emp => {
      return selectedColumns.map(col => emp[col] ?? "");
    });

    const csv = stringify([selectedColumns, ...data], { delimiter: "," });

    return { status: true, data: csv, message: "CSV generated successfully" };
  } catch (error) {
    logger.error("Error in exportEmployeesToCSV:", error);
    return { status: false, message: error.message || "Failed to export employees" };
  }
};
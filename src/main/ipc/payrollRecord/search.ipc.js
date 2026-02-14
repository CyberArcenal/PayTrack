// src/main/ipc/payrollRecord/search.ipc
const { AppDataSource } = require("../../../db/datasource");
const { Employee } = require("../../../../entities/Employee");
const payrollRecordService = require("../../../../services/PayrollRecordService");
const { logger } = require("../../../utils/logger");

/**
 * Search payroll records by employee name or number.
 * @param {Object} params - { query, page, limit }
 */
module.exports = async (params) => {
  try {
    const { query, page, limit } = params;
    if (!query || query.trim() === "") {
      throw new Error("Search query is required");
    }

    // Find employees matching the query
    const employeeRepo = AppDataSource.getRepository(Employee);
    const employees = await employeeRepo
      .createQueryBuilder("employee")
      .where("employee.firstName LIKE :query", { query: `%${query}%` })
      .orWhere("employee.lastName LIKE :query", { query: `%${query}%` })
      .orWhere("employee.employeeNumber LIKE :query", { query: `%${query}%` })
      .getMany();

    const employeeIds = employees.map((e) => e.id);

    if (employeeIds.length === 0) {
      return {
        status: true,
        data: { records: [], pagination: { page: 1, limit: 0, total: 0 } },
        message: "No matching employees found",
      };
    }

    // Get payroll records for those employees
    const { payroll } = await payrollRecordService.getRepositories();
    const queryBuilder = payroll
      .createQueryBuilder("payroll")
      .leftJoinAndSelect("payroll.employee", "employee")
      .leftJoinAndSelect("payroll.period", "period")
      .where("payroll.employeeId IN (:...employeeIds)", { employeeIds });

    const total = await queryBuilder.getCount();

    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      queryBuilder.skip(skip).take(parseInt(limit));
    }

    queryBuilder.orderBy("period.endDate", "DESC");
    const records = await queryBuilder.getMany();

    return {
      status: true,
      data: {
        records,
        pagination: {
          page: page ? parseInt(page) : 1,
          limit: limit ? parseInt(limit) : total,
          total,
        },
      },
      message: "Search completed successfully",
    };
  } catch (error) {
    logger.error("Error in searchPayrollRecords:", error);
    return { status: false, message: error.message, data: null };
  }
};
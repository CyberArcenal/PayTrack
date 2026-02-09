// ===================== search.ipc.js =====================


const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Search employees with advanced filtering
 * @param {string} query
 * @param {Object} filters
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function searchEmployees(query, filters = {}) {
  try {
    const employeeRepo = AppDataSource.getRepository("Employee");
    const queryBuilder = employeeRepo.createQueryBuilder("employee");

    // Search across multiple fields
    if (query) {
      queryBuilder.where(
        "(employee.firstName LIKE :query OR " +
        "employee.lastName LIKE :query OR " +
        "employee.employeeNumber LIKE :query OR " +
        "employee.email LIKE :query OR " +
        "employee.position LIKE :query OR " +
        "employee.department LIKE :query)",
        { query: `%${query}%` }
      );
    }

    // Apply additional filters
    if (filters.department) {
      queryBuilder.andWhere("employee.department = :department", { department: filters.department });
    }
    if (filters.position) {
      queryBuilder.andWhere("employee.position = :position", { position: filters.position });
    }
    if (filters.status) {
      queryBuilder.andWhere("employee.status = :status", { status: filters.status });
    }
    if (filters.employmentType) {
      queryBuilder.andWhere("employee.employmentType = :employmentType", { employmentType: filters.employmentType });
    }

    // Date filters
    if (filters.hireDateFrom) {
      queryBuilder.andWhere("employee.hireDate >= :hireDateFrom", { hireDateFrom: filters.hireDateFrom });
    }
    if (filters.hireDateTo) {
      queryBuilder.andWhere("employee.hireDate <= :hireDateTo", { hireDateTo: filters.hireDateTo });
    }

    // Salary range filter
    if (filters.minSalary) {
      queryBuilder.andWhere("employee.basePay >= :minSalary", { minSalary: parseFloat(filters.minSalary) });
    }
    if (filters.maxSalary) {
      queryBuilder.andWhere("employee.basePay <= :maxSalary", { maxSalary: parseFloat(filters.maxSalary) });
    }

    // Pagination
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const skip = (page - 1) * pageSize;

    queryBuilder.skip(skip).take(pageSize);

    // Sorting
    const sortField = filters.sortField || "employeeNumber";
    const sortOrder = filters.sortOrder || "ASC";
    queryBuilder.orderBy(`employee.${sortField}`, sortOrder);

    const [employees, total] = await queryBuilder.getManyAndCount();

    return {
      status: true,
      message: "Search completed successfully",
      data: {
        employees,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        query,
        filters,
      },
    };
  } catch (error) {
    logger.error("Error in searchEmployees:", error);
    return {
      status: false,
      message: error.message || "Failed to search employees",
      data: null,
    };
  }
};
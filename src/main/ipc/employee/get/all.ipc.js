// ===================== all.ipc.js =====================
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get all employees with optional filtering
 * @param {Object} filters - Optional filters
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getAllEmployees(filters = {}) {
  try {
    const employeeRepo = AppDataSource.getRepository("Employee");
    const queryBuilder = employeeRepo.createQueryBuilder("employee");

    // Apply filters
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

    // Search by name
    if (filters.search) {
      queryBuilder.andWhere(
        "(employee.firstName LIKE :search OR employee.lastName LIKE :search OR employee.employeeNumber LIKE :search)",
        { search: `%${filters.search}%` }
      );
    }

    // Sorting
    const sortField = filters.sortField || "employeeNumber";
    const sortOrder = filters.sortOrder || "ASC";
    queryBuilder.orderBy(`employee.${sortField}`, sortOrder);

    // Pagination
    if (filters.page && filters.pageSize) {
      const skip = (filters.page - 1) * filters.pageSize;
      queryBuilder.skip(skip).take(filters.pageSize);
    }

    const employees = await queryBuilder.getMany();
    const total = await queryBuilder.getCount();

    return {
      status: true,
      message: "Employees retrieved successfully",
      data: {
        employees,
        total,
        page: filters.page || 1,
        pageSize: filters.pageSize || total,
        totalPages: filters.pageSize ? Math.ceil(total / filters.pageSize) : 1,
      },
    };
  } catch (error) {
    logger.error("Error in getAllEmployees:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve employees",
      data: null,
    };
  }
};
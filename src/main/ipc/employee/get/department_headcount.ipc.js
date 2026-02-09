// ===================== department_headcount.ipc.js =====================
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get department headcount
 * @param {string} [date]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getDepartmentHeadcount(date) {
  try {
    const effectiveDate = date ? new Date(date) : new Date();
    const employeeRepo = AppDataSource.getRepository("Employee");
    const queryBuilder = employeeRepo.createQueryBuilder("employee");

    // Only count active employees
    queryBuilder.where("employee.status = :status", { status: "active" });

    // If date is provided, check if employee was hired before or on that date
    if (date) {
      queryBuilder.andWhere("employee.hireDate <= :effectiveDate", { effectiveDate });
    }

    // Group by department and count
    const headcountData = await queryBuilder
      .select("employee.department", "department")
      .addSelect("COUNT(*)", "count")
      .groupBy("employee.department")
      .orderBy("count", "DESC")
      .getRawMany();

    // Calculate totals
    const totalHeadcount = headcountData.reduce((sum, item) => sum + parseInt(item.count), 0);

    return {
      status: true,
      message: "Department headcount retrieved successfully",
      data: {
        headcountData,
        totalHeadcount,
        asOfDate: effectiveDate.toISOString().split("T")[0],
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    logger.error("Error in getDepartmentHeadcount:", error);
    return {
      status: false,
      message: error.message || "Failed to retrieve department headcount",
      data: null,
    };
  }
};
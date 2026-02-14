// src/main/ipc/payrollRecord/get/by_employee.ipc
const payrollRecordService = require("../../../../services/PayrollRecordService");
const { logger } = require("../../../utils/logger");

/**
 * Get payroll records for a specific employee.
 * @param {Object} params - { employeeId, page, limit, paymentStatus, startDate, endDate }
 */
module.exports = async (params) => {
  try {
    const { employeeId, page, limit, ...filters } = params;
    if (!employeeId || isNaN(parseInt(employeeId))) {
      throw new Error("Valid employee ID is required");
    }

    const { payroll } = await payrollRecordService.getRepositories();
    const query = payroll.createQueryBuilder("payroll")
      .leftJoinAndSelect("payroll.employee", "employee")
      .leftJoinAndSelect("payroll.period", "period")
      .where("payroll.employeeId = :employeeId", { employeeId: parseInt(employeeId) });

    if (filters.paymentStatus) {
      query.andWhere("payroll.paymentStatus = :paymentStatus", { paymentStatus: filters.paymentStatus });
    }
    if (filters.startDate) {
      query.andWhere("period.endDate >= :startDate", { startDate: filters.startDate });
    }
    if (filters.endDate) {
      query.andWhere("period.endDate <= :endDate", { endDate: filters.endDate });
    }

    const total = await query.getCount();

    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      query.skip(skip).take(parseInt(limit));
    }

    query.orderBy("period.endDate", "DESC");
    const records = await query.getMany();

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
      message: "Employee payroll records retrieved successfully",
    };
  } catch (error) {
    logger.error("Error in getPayrollRecordsByEmployee:", error);
    return { status: false, message: error.message, data: null };
  }
};
// src/main/ipc/payrollRecord/get/by_status.ipc
const payrollRecordService = require("../../../../services/PayrollRecordService");
const { logger } = require("../../../utils/logger");

/**
 * Get payroll records by payment status.
 * @param {Object} params - { paymentStatus, page, limit, employeeId, periodId, startDate, endDate }
 */
module.exports = async (params) => {
  try {
    const { paymentStatus, page, limit, ...filters } = params;
    if (!paymentStatus) {
      throw new Error("Payment status is required");
    }

    const { payroll } = await payrollRecordService.getRepositories();
    const query = payroll.createQueryBuilder("payroll")
      .leftJoinAndSelect("payroll.employee", "employee")
      .leftJoinAndSelect("payroll.period", "period")
      .where("payroll.paymentStatus = :paymentStatus", { paymentStatus });

    if (filters.employeeId) {
      query.andWhere("payroll.employeeId = :employeeId", { employeeId: parseInt(filters.employeeId) });
    }
    if (filters.periodId) {
      query.andWhere("payroll.periodId = :periodId", { periodId: parseInt(filters.periodId) });
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
      message: "Payroll records by status retrieved successfully",
    };
  } catch (error) {
    logger.error("Error in getPayrollRecordsByStatus:", error);
    return { status: false, message: error.message, data: null };
  }
};
// src/main/ipc/payrollRecord/get/all.ipc
const payrollRecordService = require("../../../../services/PayrollRecordService");
const { logger } = require("../../../utils/logger");

/**
 * Get all payroll records with optional filters and pagination.
 * @param {Object} params - { employeeId, periodId, paymentStatus, startDate, endDate, page, limit }
 */
module.exports = async (params) => {
  try {
    const { page, limit, ...filters } = params;
    const { payroll } = await payrollRecordService.getRepositories();

    // Build query for filters
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

    // Get total count before pagination
    const total = await query.getCount();

    // Apply pagination
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
      message: "Payroll records retrieved successfully",
    };
  } catch (error) {
    logger.error("Error in getAllPayrollRecords:", error);
    return { status: false, message: error.message, data: null };
  }
};
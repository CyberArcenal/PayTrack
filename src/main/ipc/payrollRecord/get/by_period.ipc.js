// src/main/ipc/payrollRecord/get/by_period.ipc
const payrollRecordService = require("../../../../services/PayrollRecordService");
const { logger } = require("../../../utils/logger");

/**
 * Get payroll records for a specific period.
 * @param {Object} params - { periodId, page, limit, paymentStatus }
 */
module.exports = async (params) => {
  try {
    const { periodId, page, limit, paymentStatus } = params;
    if (!periodId || isNaN(parseInt(periodId))) {
      throw new Error("Valid period ID is required");
    }

    const { payroll } = await payrollRecordService.getRepositories();
    const query = payroll.createQueryBuilder("payroll")
      .leftJoinAndSelect("payroll.employee", "employee")
      .leftJoinAndSelect("payroll.period", "period")
      .where("payroll.periodId = :periodId", { periodId: parseInt(periodId) });

    if (paymentStatus) {
      query.andWhere("payroll.paymentStatus = :paymentStatus", { paymentStatus });
    }

    const total = await query.getCount();

    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      query.skip(skip).take(parseInt(limit));
    }

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
      message: "Period payroll records retrieved successfully",
    };
  } catch (error) {
    logger.error("Error in getPayrollRecordsByPeriod:", error);
    return { status: false, message: error.message, data: null };
  }
};
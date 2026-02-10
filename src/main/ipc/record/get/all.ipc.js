// src/ipc/handlers/payroll-record/get/all.ipc.js
// @ts-check
const PayrollRecordSchema = require("../../../../entities/PayrollRecord");
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get all payroll records with optional filtering
 * @param {Object} filters - Filter criteria
 * @param {number} [filters.periodId] - Filter by payroll period
 * @param {number} [filters.employeeId] - Filter by employee
 * @param {string} [filters.paymentStatus] - Filter by payment status
 * @param {string} [filters.dateFrom] - Start date filter
 * @param {string} [filters.dateTo] - End date filter
 * @param {number} [filters.page] - Page number for pagination
 * @param {number} [filters.limit] - Records per page
 */
async function getAllPayrollRecords(filters = {}) {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    const {
      periodId,
      employeeId,
      paymentStatus,
      dateFrom,
      dateTo,
      page = 1,
      limit = 50,
    } = filters;

    const payrollRecordRepo =
      queryRunner.manager.getRepository(PayrollRecordSchema);

    // Build query
    const query = payrollRecordRepo
      .createQueryBuilder("pr")
      .leftJoinAndSelect("pr.employee", "employee")
      .leftJoinAndSelect("pr.period", "period")
      .leftJoinAndSelect("pr.deductions", "deductions")
      .orderBy("pr.createdAt", "DESC");

    // Apply filters
    if (periodId) {
      query.andWhere("pr.periodId = :periodId", {
        periodId: parseInt(periodId),
      });
    }

    if (employeeId) {
      query.andWhere("pr.employeeId = :employeeId", {
        employeeId: parseInt(employeeId),
      });
    }

    if (paymentStatus) {
      query.andWhere("pr.paymentStatus = :paymentStatus", { paymentStatus });
    }

    if (dateFrom && dateTo) {
      query.andWhere("pr.createdAt BETWEEN :dateFrom AND :dateTo", {
        dateFrom: new Date(dateFrom),
        dateTo: new Date(dateTo),
      });
    }

    // Apply pagination
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    // Execute query
    const [records, total] = await query.getManyAndCount();

    return {
      status: true,
      message: "Payroll records retrieved successfully",
      data: records,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Failed to get payroll records:", error);
    return {
      status: false,
      message: `Failed to retrieve payroll records: ${error.message}`,
      data: [],
    };
  } finally {
    await queryRunner.release();
  }
}

module.exports = getAllPayrollRecords;

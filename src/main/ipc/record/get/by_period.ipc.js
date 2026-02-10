// src/ipc/handlers/payroll-record/get/by_period.ipc.js
// @ts-check
const PayrollRecord = require("../../../../entities/PayrollRecord");
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get payroll records by period
 * @param {number} periodId - Payroll period ID
 * @param {Object} filters - Additional filters
 * @param {string} [filters.paymentStatus] - Filter by payment status
 * @param {number} [filters.page] - Page number
 * @param {number} [filters.limit] - Records per page
 * @returns {Promise<{status: boolean, message: string, data: Array, meta?: Object}>}
 */
async function getPayrollRecordsByPeriod(periodId, filters = {}) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
        if (!periodId || isNaN(periodId)) {
            return {
                status: false,
                message: "Invalid period ID",
                data: []
            };
        }

        const { paymentStatus, page = 1, limit = 100 } = filters;
        const skip = (page - 1) * limit;

        const payrollRecordRepo = queryRunner.manager.getRepository(PayrollRecord);
        
        const query = payrollRecordRepo
            .createQueryBuilder("pr")
            .leftJoinAndSelect("pr.employee", "employee")
            .leftJoinAndSelect("pr.deductions", "deductions")
            .where("pr.periodId = :periodId", { periodId: parseInt(periodId) });

        if (paymentStatus) {
            query.andWhere("pr.paymentStatus = :paymentStatus", { paymentStatus });
        }

        // Get total count for pagination
        const totalQuery = query.clone();
        const total = await totalQuery.getCount();

        // Apply pagination to main query
        query
            .orderBy("employee.lastName", "ASC")
            .skip(skip)
            .take(limit);

        const records = await query.getMany();

        return {
            status: true,
            message: `Found ${records.length} payroll records for period`,
            data: records,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };

    } catch (error) {
        logger.error("Failed to get payroll records by period:", error);
        return {
            status: false,
            message: `Failed to retrieve payroll records: ${error.message}`,
            data: []
        };
    } finally {
        await queryRunner.release();
    }
}

module.exports = getPayrollRecordsByPeriod;
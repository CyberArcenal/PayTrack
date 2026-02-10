// src/ipc/handlers/payroll-record/get/by_status.ipc.js
// @ts-check
const PayrollRecord = require("../../../../entities/PayrollRecord");
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get payroll records by payment status
 * @param {string} status - Payment status (unpaid, paid, partially-paid, cancelled)
 * @param {Object} filters - Additional filters
 * @param {number} [filters.periodId] - Filter by period
 * @param {string} [filters.dateFrom] - Start date filter
 * @param {string} [filters.dateTo] - End date filter
 */
async function getPayrollRecordsByStatus(status, filters = {}) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
        const validStatuses = ["unpaid", "paid", "partially-paid", "cancelled"];
        
        if (!validStatuses.includes(status)) {
            return {
                status: false,
                message: `Invalid payment status. Must be one of: ${validStatuses.join(", ")}`,
                data: []
            };
        }

        const { periodId, dateFrom, dateTo } = filters;

        const payrollRecordRepo = queryRunner.manager.getRepository(PayrollRecord);
        
        const query = payrollRecordRepo
            .createQueryBuilder("pr")
            .leftJoinAndSelect("pr.employee", "employee")
            .leftJoinAndSelect("pr.period", "period")
            .where("pr.paymentStatus = :status", { status });

        if (periodId) {
            query.andWhere("pr.periodId = :periodId", { periodId: parseInt(periodId) });
        }

        if (dateFrom && dateTo) {
            query.andWhere("pr.createdAt BETWEEN :dateFrom AND :dateTo", {
                dateFrom: new Date(dateFrom),
                dateTo: new Date(dateTo)
            });
        }

        query.orderBy("pr.createdAt", "DESC");

        const records = await query.getMany();

        return {
            status: true,
            message: `Found ${records.length} ${status} payroll records`,
            data: records
        };

    } catch (error) {
        logger.error("Failed to get payroll records by status:", error);
        return {
            status: false,
            message: `Failed to retrieve payroll records: ${error.message}`,
            data: []
        };
    } finally {
        await queryRunner.release();
    }
}

module.exports = getPayrollRecordsByStatus;
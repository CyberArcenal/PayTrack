// src/ipc/handlers/payroll-record/get/by_employee.ipc.js
// @ts-check
const PayrollRecord = require("../../../../entities/PayrollRecord");
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get payroll records by employee
 * @param {number} employeeId - Employee ID
 * @param {Object} dateRange - Date range filter
 * @param {string} [dateRange.startDate] - Start date
 * @param {string} [dateRange.endDate] - End date
 * @returns {Promise<{status: boolean, message: string, data: Array}>}
 */
async function getPayrollRecordsByEmployee(employeeId, dateRange = {}) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
        if (!employeeId || isNaN(employeeId)) {
            return {
                status: false,
                message: "Invalid employee ID",
                data: []
            };
        }

        const payrollRecordRepo = queryRunner.manager.getRepository(PayrollRecord);
        
        const query = payrollRecordRepo
            .createQueryBuilder("pr")
            .leftJoinAndSelect("pr.period", "period")
            .leftJoinAndSelect("pr.deductions", "deductions")
            .where("pr.employeeId = :employeeId", { employeeId: parseInt(employeeId) })
            .orderBy("period.startDate", "DESC");

        // Apply date range filter
        if (dateRange.startDate && dateRange.endDate) {
            query.andWhere("period.startDate >= :startDate AND period.endDate <= :endDate", {
                startDate: new Date(dateRange.startDate),
                endDate: new Date(dateRange.endDate)
            });
        }

        const records = await query.getMany();

        return {
            status: true,
            message: `Found ${records.length} payroll records for employee`,
            data: records
        };

    } catch (error) {
        logger.error("Failed to get payroll records by employee:", error);
        return {
            status: false,
            message: `Failed to retrieve payroll records: ${error.message}`,
            data: []
        };
    } finally {
        await queryRunner.release();
    }
}

module.exports = getPayrollRecordsByEmployee;
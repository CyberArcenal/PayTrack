// src/ipc/handlers/payroll-record/get/by_id.ipc.js
// @ts-check
const PayrollRecord = require("../../../../entities/PayrollRecord");
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get payroll record by ID with all relations
 * @param {number} id - Payroll record ID
 * @returns {Promise<{status: boolean, message: string, data: Object|null}>}
 */
async function getPayrollRecordById(id) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
        if (!id || isNaN(id)) {
            return {
                status: false,
                message: "Invalid payroll record ID",
                data: null
            };
        }

        const payrollRecordRepo = queryRunner.manager.getRepository(PayrollRecord);
        
        const record = await payrollRecordRepo.findOne({
            where: { id: parseInt(id) },
            relations: [
                "employee",
                "period",
                "deductions",
                "overtimeLogs",
                "attendanceLogs"
            ]
        });

        if (!record) {
            return {
                status: false,
                message: "Payroll record not found",
                data: null
            };
        }

        return {
            status: true,
            message: "Payroll record retrieved successfully",
            data: record
        };

    } catch (error) {
        logger.error("Failed to get payroll record by ID:", error);
        return {
            status: false,
            message: `Failed to retrieve payroll record: ${error.message}`,
            data: null
        };
    } finally {
        await queryRunner.release();
    }
}

module.exports = getPayrollRecordById;
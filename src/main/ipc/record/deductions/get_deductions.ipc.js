// src/ipc/handlers/payroll-record/deductions/get_deductions.ipc.js
// @ts-check
const Deduction = require("../../../../entities/Deduction");
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get deductions for a payroll record
 * @param {number} payrollRecordId - Payroll record ID
 * @returns {Promise<{status: boolean, message: string, data: Array}>}
 */
async function getPayrollDeductions(payrollRecordId) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
        if (!payrollRecordId || isNaN(payrollRecordId)) {
            return {
                status: false,
                message: "Invalid payroll record ID",
                data: []
            };
        }

        const deductionRepo = queryRunner.manager.getRepository(Deduction);
        
        const deductions = await deductionRepo.find({
            where: { payrollRecordId: parseInt(payrollRecordId) },
            order: { type: "ASC", createdAt: "DESC" }
        });

        // Calculate totals
        const totals = deductions.reduce((acc, deduction) => {
            const amount = parseFloat(deduction.amount) || 0;
            if (deduction.type === "tax") acc.tax += amount;
            else if (deduction.type === "sss") acc.sss += amount;
            else if (deduction.type === "philhealth") acc.philhealth += amount;
            else if (deduction.type === "pag-ibig") acc.pagibig += amount;
            else if (deduction.type === "loan") acc.loan += amount;
            else if (deduction.type === "advance") acc.advance += amount;
            else acc.other += amount;
            
            acc.total += amount;
            return acc;
        }, { tax: 0, sss: 0, philhealth: 0, pagibig: 0, loan: 0, advance: 0, other: 0, total: 0 });

        return {
            status: true,
            message: `Found ${deductions.length} deductions`,
            data: {
                deductions,
                totals,
                summary: {
                    recurring: deductions.filter(d => d.isRecurring).length,
                    oneTime: deductions.filter(d => !d.isRecurring).length
                }
            }
        };

    } catch (error) {
        logger.error("Failed to get payroll deductions:", error);
        return {
            status: false,
            message: `Failed to retrieve deductions: ${error.message}`,
            data: []
        };
    } finally {
        await queryRunner.release();
    }
}

module.exports = getPayrollDeductions;
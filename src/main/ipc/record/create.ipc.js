// src/ipc/handlers/payroll-record/create.ipc.js
// @ts-check
const Employee = require("../../../entities/Employee");
const PayrollPeriod = require("../../../entities/PayrollPeriod");
const PayrollRecord = require("../../../entities/PayrollRecord");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");

/**
 * Create a new payroll record
 * @param {Object} params - Payroll record data
 * @param {number} params.employeeId - Employee ID
 * @param {number} params.periodId - Payroll period ID
 * @param {Object} [params.data] - Optional initial data
 * @param {import('typeorm').QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<{status: boolean, message: string, data: Object|null}>}
 */
async function createPayrollRecord(params, queryRunner) {
  try {
    const { employeeId, periodId, data = {} } = params;

    // Validate required fields
    if (!employeeId || !periodId) {
      return {
        status: false,
        message: "Employee ID and Period ID are required",
        data: null,
      };
    }

    const payrollRecordRepo = queryRunner.manager.getRepository(PayrollRecord);
    const employeeRepo = queryRunner.manager.getRepository(Employee);
    const periodRepo = queryRunner.manager.getRepository(PayrollPeriod);

    // Check if employee exists
    const employee = await employeeRepo.findOne({
      where: { id: parseInt(employeeId) },
    });
    if (!employee) {
      return {
        status: false,
        message: "Employee not found",
        data: null,
      };
    }

    // Check if period exists
    const period = await periodRepo.findOne({
      where: { id: parseInt(periodId) },
    });
    if (!period) {
      return {
        status: false,
        message: "Payroll period not found",
        data: null,
      };
    }

    // Check for duplicate payroll record
    const existingRecord = await payrollRecordRepo.findOne({
      where: {
        employeeId: parseInt(employeeId),
        periodId: parseInt(periodId),
      },
    });

    if (existingRecord) {
      return {
        status: false,
        message: "Payroll record already exists for this employee and period",
        data: null,
      };
    }

    // Create new payroll record with employee's base rates
    const payrollRecord = payrollRecordRepo.create({
      employeeId: parseInt(employeeId),
      periodId: parseInt(periodId),
      basicPay: employee.basePay,
      dailyRate: employee.dailyRate,
      hourlyRate: employee.hourlyRate,
      overtimeRate: employee.overtimeRate,
      paymentMethod: employee.paymentMethod,
      ...data,
    });

    await payrollRecordRepo.save(payrollRecord);

    logger.info(
      `Created payroll record ${payrollRecord.id} for employee ${employeeId}, period ${periodId}`,
    );

    return {
      status: true,
      message: "Payroll record created successfully",
      data: payrollRecord,
    };
  } catch (error) {
    logger.error("Failed to create payroll record:", error);
    return {
      status: false,
      message: `Failed to create payroll record: ${error.message}`,
      data: null,
    };
  }
}

module.exports = createPayrollRecord;

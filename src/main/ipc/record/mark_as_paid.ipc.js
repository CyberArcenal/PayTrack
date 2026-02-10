// src/ipc/handlers/payroll-record/mark_as_paid.ipc.js
// @ts-check
const AuditLog = require("../../../entities/AuditLog");
const PayrollRecord = require("../../../entities/PayrollRecord");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");

/**
 * Mark payroll record as paid
 * @param {Object} params - Payment parameters
 * @param {number} params.payrollRecordId - Payroll record ID
 * @param {string} [params.paymentMethod] - Payment method (cash, check, bank)
 * @param {string} [params.paymentReference] - Reference number
 * @param {string} [params.remarks] - Payment remarks
 * @param {number} [params.userId] - User ID marking as paid
 * @param {import('typeorm').QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<{status: boolean, message: string, data: Object|null}>}
 */
async function markAsPaid(params, queryRunner) {
  try {
    const {
      payrollRecordId,
      paymentMethod = "bank",
      paymentReference = "",
      remarks = "",
      userId = null,
    } = params;

    if (!payrollRecordId || isNaN(payrollRecordId)) {
      return {
        status: false,
        message: "Invalid payroll record ID",
        data: null,
      };
    }

    const payrollRecordRepo = queryRunner.manager.getRepository(PayrollRecord);
    const auditLogRepo = queryRunner.manager.getRepository(AuditLog);

    const payrollRecord = await payrollRecordRepo.findOne({
      where: { id: parseInt(payrollRecordId) },
      relations: ["employee", "period"],
    });

    if (!payrollRecord) {
      return {
        status: false,
        message: "Payroll record not found",
        data: null,
      };
    }

    // Check if already paid
    if (payrollRecord.paymentStatus === "paid") {
      return {
        status: false,
        message: "Payroll record is already marked as paid",
        data: payrollRecord,
      };
    }

    // Verify payroll is computed
    if (!payrollRecord.computedAt) {
      return {
        status: false,
        message: "Payroll must be computed before marking as paid",
        data: null,
      };
    }

    // Update payment status
    const oldStatus = payrollRecord.paymentStatus;

    payrollRecord.paymentStatus = "paid";
    payrollRecord.paidAt = new Date();
    payrollRecord.paymentMethod = paymentMethod;
    payrollRecord.paymentReference = paymentReference;
    payrollRecord.remarks = remarks;
    payrollRecord.updatedAt = new Date();

    await payrollRecordRepo.save(payrollRecord);

    // Create audit log
    const auditLog = auditLogRepo.create({
      entity: "PayrollRecord",
      entityId: payrollRecordId.toString(),
      action: "UPDATE",
      oldData: JSON.stringify({ paymentStatus: oldStatus }),
      newData: JSON.stringify({
        paymentStatus: "paid",
        paidAt: payrollRecord.paidAt,
        paymentMethod,
        paymentReference,
      }),
      changes: `Marked payroll record as paid`,
      userId: userId,
      userType: userId ? "admin" : "system",
      timestamp: new Date(),
    });

    await auditLogRepo.save(auditLog);

    logger.info(`Marked payroll record ${payrollRecordId} as paid`);

    return {
      status: true,
      message: "Payroll record marked as paid successfully",
      data: payrollRecord,
    };
  } catch (error) {
    logger.error("Failed to mark payroll record as paid:", error);
    return {
      status: false,
      message: `Failed to mark as paid: ${error.message}`,
      data: null,
    };
  }
}

module.exports = markAsPaid;

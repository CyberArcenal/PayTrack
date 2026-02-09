// ===================== payroll-record.ipc.js =====================
// src/ipc/handlers/payroll-record.ipc.js - Payroll Record Management Handler
// @ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");
const { withErrorHandling } = require("../../../middlewares/errorHandler");

class PayrollRecordHandler {
  constructor() {
    // Initialize all handlers
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 BASIC PAYROLL RECORD OPERATIONS
    this.getAllPayrollRecords = this.importHandler("./get/all.ipc");
    this.getPayrollRecordById = this.importHandler("./get/by_id.ipc");
    this.getPayrollRecordsByEmployee = this.importHandler("./get/by_employee.ipc");
    this.getPayrollRecordsByPeriod = this.importHandler("./get/by_period.ipc");
    this.getPayrollRecordsByStatus = this.importHandler("./get/by_status.ipc");
    this.getUnpaidPayrollRecords = this.importHandler("./get/unpaid.ipc");
    this.getPaidPayrollRecords = this.importHandler("./get/paid.ipc");
    this.getEmployeePayrollHistory = this.importHandler("./get/employee_history.ipc");

    // ✏️ WRITE OPERATIONS
    this.createPayrollRecord = this.importHandler("./create.ipc.js");
    this.updatePayrollRecord = this.importHandler("./update/update.ipc.js");
    this.deletePayrollRecord = this.importHandler("./delete/delete.ipc.js");
    this.computePayrollRecord = this.importHandler("./compute.ipc.js");
    this.markAsPaid = this.importHandler("./mark_as_paid.ipc.js");
    this.markAsUnpaid = this.importHandler("./mark_as_unpaid.ipc.js");
    this.adjustPayrollRecord = this.importHandler("./adjust.ipc.js");

    // 📊 BASIC REPORT HANDLERS
    this.getPayrollRecordReport = this.importHandler("./get/report.ipc");
    this.getPayslipReport = this.importHandler("./get/payslip.ipc");

    // 💰 PAYROLL CALCULATION HANDLERS
    this.calculateGrossPay = this.importHandler("./calculation/calculate_gross.ipc.js");
    this.calculateDeductions = this.importHandler("./calculation/calculate_deductions.ipc.js");
    this.calculateNetPay = this.importHandler("./calculation/calculate_net.ipc.js");
    this.calculateOvertimePay = this.importHandler("./calculation/calculate_overtime.ipc.js");
    this.calculateGovernmentContributions = this.importHandler("./calculation/calculate_govt_contributions.ipc.js");

    // 📋 DEDUCTION HANDLERS (since may Deduction entity)
    this.addDeduction = this.importHandler("./deductions/add_deduction.ipc.js");
    this.updateDeduction = this.importHandler("./deductions/update_deduction.ipc.js");
    this.removeDeduction = this.importHandler("./deductions/remove_deduction.ipc.js");
    this.getPayrollDeductions = this.importHandler("./deductions/get_deductions.ipc.js");

    // ⚙️ VALIDATION & UTILITY HANDLERS
    this.validatePayrollRecordData = this.importHandler("./validation/validate_data.ipc.js");
    this.checkDuplicatePayrollRecord = this.importHandler("./check_duplicate.ipc.js");
    this.getPayrollRecordStatuses = this.importHandler("./get_statuses.ipc.js");
  }

  /**
   * @param {string} path
   */
  importHandler(path) {
    try {
      return require(path);
    } catch (error) {
      console.warn(
        `[PayrollRecordHandler] Failed to load handler: ${path}`,
        // @ts-ignore
        error.message,
      );
      return async () => ({
        status: false,
        message: `Handler not found: ${path}`,
        data: null,
      });
    }
  }

  /** @param {Electron.IpcMainInvokeEvent} event @param {{ method: any; params: {}; }} payload */
  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};

      // Log the request
      if (logger) {
        // @ts-ignore
        logger.info(`PayrollRecordHandler: ${method}`, { params });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📋 BASIC OPERATIONS
        case "getAllPayrollRecords":
          // @ts-ignore
          return await this.getAllPayrollRecords(params.filters);

        case "getPayrollRecordById":
          // @ts-ignore
          return await this.getPayrollRecordById(params.id);

        case "getPayrollRecordsByEmployee":
          return await this.getPayrollRecordsByEmployee(
            // @ts-ignore
            params.employeeId,
            // @ts-ignore
            params.dateRange,
          );

        case "getPayrollRecordsByPeriod":
          return await this.getPayrollRecordsByPeriod(
            // @ts-ignore
            params.periodId,
            // @ts-ignore
            params.filters,
          );

        case "getPayrollRecordsByStatus":
          return await this.getPayrollRecordsByStatus(
            // @ts-ignore
            params.status,
            // @ts-ignore
            params.filters,
          );

        case "getUnpaidPayrollRecords":
          return await this.getUnpaidPayrollRecords(
            // @ts-ignore
            params.periodId,
            // @ts-ignore
            params.filters,
          );

        case "getPaidPayrollRecords":
          return await this.getPaidPayrollRecords(
            // @ts-ignore
            params.periodId,
            // @ts-ignore
            params.filters,
          );

        case "getEmployeePayrollHistory":
          return await this.getEmployeePayrollHistory(
            // @ts-ignore
            params.employeeId,
            // @ts-ignore
            params.limit,
          );

        // ✏️ WRITE OPERATIONS (with transactions)
        case "createPayrollRecord":
          return await this.handleWithTransaction(
            this.createPayrollRecord,
            // @ts-ignore
            params,
          );

        case "updatePayrollRecord":
          return await this.handleWithTransaction(
            this.updatePayrollRecord,
            // @ts-ignore
            params,
          );

        case "deletePayrollRecord":
          return await this.handleWithTransaction(
            this.deletePayrollRecord,
            // @ts-ignore
            params,
          );

        case "computePayrollRecord":
          return await this.handleWithTransaction(
            this.computePayrollRecord,
            // @ts-ignore
            params,
          );

        case "markAsPaid":
          return await this.handleWithTransaction(
            this.markAsPaid,
            // @ts-ignore
            params,
          );

        case "markAsUnpaid":
          return await this.handleWithTransaction(
            this.markAsUnpaid,
            // @ts-ignore
            params,
          );

        case "adjustPayrollRecord":
          return await this.handleWithTransaction(
            this.adjustPayrollRecord,
            // @ts-ignore
            params,
          );

        // 📊 REPORT OPERATIONS
        case "getPayrollRecordReport":
          return await this.getPayrollRecordReport(
            // @ts-ignore
            params.periodId,
            // @ts-ignore
            params.reportType,
          );

        case "getPayslipReport":
          return await this.getPayslipReport(
            // @ts-ignore
            params.payrollRecordId,
            // @ts-ignore
            params.format,
          );

        // 💰 PAYROLL CALCULATION OPERATIONS
        case "calculateGrossPay":
          return await this.calculateGrossPay(
            // @ts-ignore
            params.employeeId,
            // @ts-ignore
            params.periodId,
          );

        case "calculateDeductions":
          return await this.calculateDeductions(
            // @ts-ignore
            params.employeeId,
            // @ts-ignore
            params.periodId,
            // @ts-ignore
            params.grossPay,
          );

        case "calculateNetPay":
          return await this.calculateNetPay(
            // @ts-ignore
            params.grossPay,
            // @ts-ignore
            params.deductions,
          );

        case "calculateOvertimePay":
          return await this.calculateOvertimePay(
            // @ts-ignore
            params.employeeId,
            // @ts-ignore
            params.periodId,
            // @ts-ignore
            params.overtimeHours,
          );

        case "calculateGovernmentContributions":
          return await this.calculateGovernmentContributions(
            // @ts-ignore
            params.employeeId,
            // @ts-ignore
            params.grossPay,
            // @ts-ignore
            params.periodId,
          );

        // 📋 DEDUCTION OPERATIONS
        case "addDeduction":
          return await this.handleWithTransaction(
            this.addDeduction,
            // @ts-ignore
            params,
          );

        case "updateDeduction":
          return await this.handleWithTransaction(
            this.updateDeduction,
            // @ts-ignore
            params,
          );

        case "removeDeduction":
          return await this.handleWithTransaction(
            this.removeDeduction,
            // @ts-ignore
            params,
          );

        case "getPayrollDeductions":
          // @ts-ignore
          return await this.getPayrollDeductions(params.payrollRecordId);

        // ⚙️ VALIDATION & UTILITY OPERATIONS
        case "validatePayrollRecordData":
          return await this.validatePayrollRecordData(params);

        case "checkDuplicatePayrollRecord":
          return await this.checkDuplicatePayrollRecord(params);

        case "getPayrollRecordStatuses":
          // @ts-ignore
          return await this.getPayrollRecordStatuses();

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("PayrollRecordHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("PayrollRecordHandler error:", error);
      }
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }

  /**
   * Wrap critical operations in a database transaction
   * @param {(arg0: any, arg1: import("typeorm").QueryRunner) => any} handler
   * @param {any} params
   */
  async handleWithTransaction(handler, params) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await handler(params, queryRunner);

      if (result.status) {
        await queryRunner.commitTransaction();
      } else {
        await queryRunner.rollbackTransaction();
      }

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

// Register IPC handler
const payrollRecordHandler = new PayrollRecordHandler();

ipcMain.handle(
  "payroll-record",
  withErrorHandling(
    // @ts-ignore
    payrollRecordHandler.handleRequest.bind(payrollRecordHandler),
    "IPC:payroll-record",
  ),
);

module.exports = { PayrollRecordHandler, payrollRecordHandler };
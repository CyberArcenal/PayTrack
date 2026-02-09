// ===================== payroll-period.ipc.js =====================
// src/ipc/handlers/payroll-period.ipc.js - Payroll Period Management Handler
// @ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");
const { withErrorHandling } = require("../../../middlewares/errorHandler");

class PayrollPeriodHandler {
  constructor() {
    // Initialize all handlers
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 BASIC PAYROLL PERIOD OPERATIONS
    this.getAllPayrollPeriods = this.importHandler("./get/all.ipc");
    this.getPayrollPeriodById = this.importHandler("./get/by_id.ipc");
    this.getPayrollPeriodsByDate = this.importHandler("./get/by_date.ipc");
    this.getPayrollPeriodsByDateRange = this.importHandler("./get/by_date_range.ipc");
    this.getPayrollPeriodsByStatus = this.importHandler("./get/by_status.ipc");
    this.getCurrentPayrollPeriod = this.importHandler("./get/current.ipc");
    this.getPayrollPeriodSummary = this.importHandler("./get/summary.ipc");

    // ✏️ WRITE OPERATIONS
    this.createPayrollPeriod = this.importHandler("./create.ipc.js");
    this.updatePayrollPeriod = this.importHandler("./update/update.ipc.js");
    this.deletePayrollPeriod = this.importHandler("./delete/delete.ipc.js");
    this.openPayrollPeriod = this.importHandler("./open_period.ipc.js");
    this.lockPayrollPeriod = this.importHandler("./lock_period.ipc.js");
    this.closePayrollPeriod = this.importHandler("./close_period.ipc.js");
    this.updatePeriodDates = this.importHandler("./update_dates.ipc.js");
    this.updatePeriodTotals = this.importHandler("./update_totals.ipc.js");

    // 📊 BASIC REPORT HANDLERS
    this.getPayrollPeriodReport = this.importHandler("./get/report.ipc");

    // 📅 PERIOD MANAGEMENT HANDLERS
    this.validatePayrollPeriod = this.importHandler("./management/validate_period.ipc.js");
    this.checkPeriodOverlap = this.importHandler("./management/check_overlap.ipc.js");
    this.calculateWorkingDays = this.importHandler("./calculate_working_days.ipc.js");

    // ⚙️ VALIDATION & UTILITY HANDLERS
    this.validatePayrollPeriodData = this.importHandler("./validation/validate_data.ipc.js");
    this.checkDuplicatePeriod = this.importHandler("./check_duplicate.ipc.js");
    this.generatePeriodName = this.importHandler("./generate_period_name.ipc.js");
    this.validatePeriodDates = this.importHandler("./validation/validate_dates.ipc.js");
  }

  /**
   * @param {string} path
   */
  importHandler(path) {
    try {
      return require(path);
    } catch (error) {
      console.warn(
        `[PayrollPeriodHandler] Failed to load handler: ${path}`,
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
        logger.info(`PayrollPeriodHandler: ${method}`, { params });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📋 BASIC OPERATIONS
        case "getAllPayrollPeriods":
          // @ts-ignore
          return await this.getAllPayrollPeriods(params.filters);

        case "getPayrollPeriodById":
          // @ts-ignore
          return await this.getPayrollPeriodById(params.id);

        case "getPayrollPeriodsByDate":
          return await this.getPayrollPeriodsByDate(
            // @ts-ignore
            params.date,
            // @ts-ignore
            params.filters,
          );

        case "getPayrollPeriodsByDateRange":
          return await this.getPayrollPeriodsByDateRange(
            // @ts-ignore
            params.startDate,
            // @ts-ignore
            params.endDate,
            // @ts-ignore
            params.filters,
          );

        case "getPayrollPeriodsByStatus":
          return await this.getPayrollPeriodsByStatus(
            // @ts-ignore
            params.status,
            // @ts-ignore
            params.filters,
          );

        case "getCurrentPayrollPeriod":
          // @ts-ignore
          return await this.getCurrentPayrollPeriod(params.date);

        case "getPayrollPeriodSummary":
          // @ts-ignore
          return await this.getPayrollPeriodSummary(params.periodId);

        // ✏️ WRITE OPERATIONS (with transactions)
        case "createPayrollPeriod":
          return await this.handleWithTransaction(
            this.createPayrollPeriod,
            // @ts-ignore
            params,
          );

        case "updatePayrollPeriod":
          return await this.handleWithTransaction(
            this.updatePayrollPeriod,
            // @ts-ignore
            params,
          );

        case "deletePayrollPeriod":
          return await this.handleWithTransaction(
            this.deletePayrollPeriod,
            // @ts-ignore
            params,
          );

        case "openPayrollPeriod":
          return await this.handleWithTransaction(
            this.openPayrollPeriod,
            // @ts-ignore
            params,
          );

        case "lockPayrollPeriod":
          return await this.handleWithTransaction(
            this.lockPayrollPeriod,
            // @ts-ignore
            params,
          );

        case "closePayrollPeriod":
          return await this.handleWithTransaction(
            this.closePayrollPeriod,
            // @ts-ignore
            params,
          );

        case "updatePeriodDates":
          return await this.handleWithTransaction(
            this.updatePeriodDates,
            // @ts-ignore
            params,
          );

        case "updatePeriodTotals":
          return await this.handleWithTransaction(
            this.updatePeriodTotals,
            // @ts-ignore
            params,
          );

        // 📊 REPORT OPERATIONS
        case "getPayrollPeriodReport":
          return await this.getPayrollPeriodReport(
            // @ts-ignore
            params.periodId,
            // @ts-ignore
            params.reportType,
          );

        // 📅 PERIOD MANAGEMENT OPERATIONS
        case "validatePayrollPeriod":
          return await this.validatePayrollPeriod(
            // @ts-ignore
            params.periodId,
            // @ts-ignore
            params.validationType,
          );

        case "checkPeriodOverlap":
          return await this.checkPeriodOverlap(
            // @ts-ignore
            params.startDate,
            // @ts-ignore
            params.endDate,
            // @ts-ignore
            params.excludePeriodId,
          );

        case "calculateWorkingDays":
          return await this.calculateWorkingDays(
            // @ts-ignore
            params.startDate,
            // @ts-ignore
            params.endDate,
            // @ts-ignore
            params.excludeHolidays,
          );

        // ⚙️ VALIDATION & UTILITY OPERATIONS
        case "validatePayrollPeriodData":
          return await this.validatePayrollPeriodData(params);

        case "checkDuplicatePeriod":
          return await this.checkDuplicatePeriod(params);

        case "generatePeriodName":
          return await this.generatePeriodName(
            // @ts-ignore
            params.periodType,
            // @ts-ignore
            params.startDate,
            // @ts-ignore
            params.endDate,
          );

        case "validatePeriodDates":
          return await this.validatePeriodDates(
            // @ts-ignore
            params.startDate,
            // @ts-ignore
            params.endDate,
            // @ts-ignore
            params.payDate,
          );

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("PayrollPeriodHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("PayrollPeriodHandler error:", error);
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
const payrollPeriodHandler = new PayrollPeriodHandler();

ipcMain.handle(
  "payroll-period",
  withErrorHandling(
    // @ts-ignore
    payrollPeriodHandler.handleRequest.bind(payrollPeriodHandler),
    "IPC:payroll-period",
  ),
);

module.exports = { PayrollPeriodHandler, payrollPeriodHandler };
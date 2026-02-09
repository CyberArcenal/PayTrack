// ===================== deduction.ipc.js =====================
// src/ipc/handlers/deduction.ipc.js - Deduction Management Handler
// @ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");
const { withErrorHandling } = require("../../../middlewares/errorHandler");

class DeductionHandler {
  constructor() {
    // Initialize all handlers
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 BASIC DEDUCTION OPERATIONS
    this.getAllDeductions = this.importHandler("./get/all.ipc");
    this.getDeductionById = this.importHandler("./get/by_id.ipc");
    this.getDeductionsByPayrollRecord = this.importHandler("./get/by_payroll_record.ipc");
    this.getDeductionsByType = this.importHandler("./get/by_type.ipc");
    this.getRecurringDeductions = this.importHandler("./get/recurring.ipc");

    // ✏️ WRITE OPERATIONS
    this.createDeduction = this.importHandler("./create.ipc.js");
    this.updateDeduction = this.importHandler("./update/update.ipc.js");
    this.deleteDeduction = this.importHandler("./delete/delete.ipc.js");
    this.updateDeductionAmount = this.importHandler("./update_amount.ipc.js");

    // ⚙️ VALIDATION & UTILITY HANDLERS
    this.validateDeductionData = this.importHandler("./validation/validate_data.ipc.js");
    this.checkDuplicateDeduction = this.importHandler("./check_duplicate.ipc.js");
    this.getDeductionTypes = this.importHandler("./get_types.ipc.js");
  }

  /**
   * @param {string} path
   */
  importHandler(path) {
    try {
      return require(path);
    } catch (error) {
      console.warn(
        `[DeductionHandler] Failed to load handler: ${path}`,
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
        logger.info(`DeductionHandler: ${method}`, { params });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📋 BASIC OPERATIONS
        case "getAllDeductions":
          // @ts-ignore
          return await this.getAllDeductions(params.filters);

        case "getDeductionById":
          // @ts-ignore
          return await this.getDeductionById(params.id);

        case "getDeductionsByPayrollRecord":
          return await this.getDeductionsByPayrollRecord(
            // @ts-ignore
            params.payrollRecordId,
            // @ts-ignore
            params.filters,
          );

        case "getDeductionsByType":
          return await this.getDeductionsByType(
            // @ts-ignore
            params.type,
            // @ts-ignore
            params.filters,
          );

        case "getRecurringDeductions":
          // @ts-ignore
          return await this.getRecurringDeductions(params.filters);

        // ✏️ WRITE OPERATIONS (with transactions)
        case "createDeduction":
          return await this.handleWithTransaction(
            this.createDeduction,
            // @ts-ignore
            params,
          );

        case "updateDeduction":
          return await this.handleWithTransaction(
            this.updateDeduction,
            // @ts-ignore
            params,
          );

        case "deleteDeduction":
          return await this.handleWithTransaction(
            this.deleteDeduction,
            // @ts-ignore
            params,
          );

        case "updateDeductionAmount":
          return await this.handleWithTransaction(
            this.updateDeductionAmount,
            // @ts-ignore
            params,
          );

        // ⚙️ VALIDATION & UTILITY OPERATIONS
        case "validateDeductionData":
          return await this.validateDeductionData(params);

        case "checkDuplicateDeduction":
          return await this.checkDuplicateDeduction(params);

        case "getDeductionTypes":
          // @ts-ignore
          return await this.getDeductionTypes(params.category);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("DeductionHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("DeductionHandler error:", error);
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
const deductionHandler = new DeductionHandler();

ipcMain.handle(
  "deduction",
  withErrorHandling(
    // @ts-ignore
    deductionHandler.handleRequest.bind(deductionHandler),
    "IPC:deduction",
  ),
);

module.exports = { DeductionHandler, deductionHandler };
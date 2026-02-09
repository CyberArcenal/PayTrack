// ===================== overtime.ipc.js =====================
// src/ipc/handlers/overtime.ipc.js - Overtime Management Handler
// @ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");
const { withErrorHandling } = require("../../../middlewares/errorHandler");

class OvertimeHandler {
  constructor() {
    // Initialize all handlers
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 BASIC OVERTIME OPERATIONS
    this.getAllOvertimeLogs = this.importHandler("./get/all.ipc");
    this.getOvertimeLogById = this.importHandler("./get/by_id.ipc");
    this.getOvertimeLogsByEmployee = this.importHandler("./get/by_employee.ipc");
    this.getOvertimeLogsByDate = this.importHandler("./get/by_date.ipc");
    this.getOvertimeLogsByDateRange = this.importHandler("./get/by_date_range.ipc");
    this.getOvertimeLogsByStatus = this.importHandler("./get/by_status.ipc");
    this.getPendingOvertimeLogs = this.importHandler("./get/pending.ipc");
    this.getApprovedOvertimeLogs = this.importHandler("./get/approved.ipc");
    this.getRejectedOvertimeLogs = this.importHandler("./get/rejected.ipc");

    // ✏️ WRITE OPERATIONS
    this.createOvertimeLog = this.importHandler("./create.ipc.js");
    this.updateOvertimeLog = this.importHandler("./update/update.ipc.js");
    this.deleteOvertimeLog = this.importHandler("./delete/delete.ipc.js");
    this.approveOvertime = this.importHandler("./approve.ipc.js");
    this.rejectOvertime = this.importHandler("./reject.ipc.js");
    this.updateOvertimeHours = this.importHandler("./update_hours.ipc.js");
    this.updateOvertimeRate = this.importHandler("./update_rate.ipc.js");
    this.recalculateOvertimeAmount = this.importHandler("./recalculate_amount.ipc.js");

    // 📊 BASIC REPORTS
    this.getOvertimeReport = this.importHandler("./get/report.ipc");
    this.getDailyOvertimeReport = this.importHandler("./get/daily_report.ipc");
    this.getMonthlyOvertimeReport = this.importHandler("./get/monthly_report.ipc");

    // ⏰ OVERTIME CALCULATION HANDLERS
    this.calculateOvertimeHours = this.importHandler("./calculate/hours.ipc.js");
    this.calculateOvertimeAmount = this.importHandler("./calculate/amount.ipc.js");
    this.checkOvertimeOverlap = this.importHandler("./validation/check_overlap.ipc.js");

    // ⚙️ UTILITY HANDLERS
    this.validateOvertimeData = this.importHandler("./validation/validate_data.ipc.js");
    this.checkDuplicateOvertime = this.importHandler("./check_duplicate.ipc.js");
    this.getOvertimeTypes = this.importHandler("./get_types.ipc.js");
    this.getOvertimeStatuses = this.importHandler("./get_statuses.ipc.js");
  }

  /**
   * @param {string} path
   */
  importHandler(path) {
    try {
      return require(path);
    } catch (error) {
      console.warn(
        `[OvertimeHandler] Failed to load handler: ${path}`,
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
        logger.info(`OvertimeHandler: ${method}`, { params });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📋 BASIC OPERATIONS
        case "getAllOvertimeLogs":
          // @ts-ignore
          return await this.getAllOvertimeLogs(params.filters);

        case "getOvertimeLogById":
          // @ts-ignore
          return await this.getOvertimeLogById(params.id);

        case "getOvertimeLogsByEmployee":
          return await this.getOvertimeLogsByEmployee(
            // @ts-ignore
            params.employeeId,
            // @ts-ignore
            params.dateRange,
          );

        case "getOvertimeLogsByDate":
          return await this.getOvertimeLogsByDate(
            // @ts-ignore
            params.date,
            // @ts-ignore
            params.filters,
          );

        case "getOvertimeLogsByDateRange":
          return await this.getOvertimeLogsByDateRange(
            // @ts-ignore
            params.startDate,
            // @ts-ignore
            params.endDate,
            // @ts-ignore
            params.filters,
          );

        case "getOvertimeLogsByStatus":
          return await this.getOvertimeLogsByStatus(
            // @ts-ignore
            params.status,
            // @ts-ignore
            params.filters,
          );

        case "getPendingOvertimeLogs":
          // @ts-ignore
          return await this.getPendingOvertimeLogs(params.filters);

        case "getApprovedOvertimeLogs":
          return await this.getApprovedOvertimeLogs(
            // @ts-ignore
            params.dateRange,
            // @ts-ignore
            params.filters,
          );

        case "getRejectedOvertimeLogs":
          return await this.getRejectedOvertimeLogs(
            // @ts-ignore
            params.dateRange,
            // @ts-ignore
            params.filters,
          );

        // ✏️ WRITE OPERATIONS (with transactions)
        case "createOvertimeLog":
          return await this.handleWithTransaction(
            this.createOvertimeLog,
            // @ts-ignore
            params,
          );

        case "updateOvertimeLog":
          return await this.handleWithTransaction(
            this.updateOvertimeLog,
            // @ts-ignore
            params,
          );

        case "deleteOvertimeLog":
          return await this.handleWithTransaction(
            this.deleteOvertimeLog,
            // @ts-ignore
            params,
          );

        case "approveOvertime":
          return await this.handleWithTransaction(
            this.approveOvertime,
            // @ts-ignore
            params,
          );

        case "rejectOvertime":
          return await this.handleWithTransaction(
            this.rejectOvertime,
            // @ts-ignore
            params,
          );

        case "updateOvertimeHours":
          return await this.handleWithTransaction(
            this.updateOvertimeHours,
            // @ts-ignore
            params,
          );

        case "updateOvertimeRate":
          return await this.handleWithTransaction(
            this.updateOvertimeRate,
            // @ts-ignore
            params,
          );

        case "recalculateOvertimeAmount":
          return await this.handleWithTransaction(
            this.recalculateOvertimeAmount,
            // @ts-ignore
            params,
          );

        // 📊 REPORT OPERATIONS
        case "getOvertimeReport":
          return await this.getOvertimeReport(
            // @ts-ignore
            params.dateRange,
            // @ts-ignore
            params.filters,
          );

        case "getDailyOvertimeReport":
          return await this.getDailyOvertimeReport(
            // @ts-ignore
            params.date,
            // @ts-ignore
            params.filters,
          );

        case "getMonthlyOvertimeReport":
          return await this.getMonthlyOvertimeReport(
            // @ts-ignore
            params.year,
            // @ts-ignore
            params.month,
            // @ts-ignore
            params.filters,
          );

        // ⏰ OVERTIME CALCULATION OPERATIONS
        case "calculateOvertimeHours":
          return await this.calculateOvertimeHours(
            // @ts-ignore
            params.startTime,
            // @ts-ignore
            params.endTime,
            // @ts-ignore
            params.breakHours,
          );

        case "calculateOvertimeAmount":
          return await this.calculateOvertimeAmount(
            // @ts-ignore
            params.hours,
            // @ts-ignore
            params.hourlyRate,
            // @ts-ignore
            params.overtimeRate,
            // @ts-ignore
            params.type,
          );

        case "checkOvertimeOverlap":
          return await this.checkOvertimeOverlap(
            // @ts-ignore
            params.employeeId,
            // @ts-ignore
            params.date,
            // @ts-ignore
            params.startTime,
            // @ts-ignore
            params.endTime,
            // @ts-ignore
            params.excludeId,
          );

        // ⚙️ VALIDATION & UTILITY OPERATIONS
        case "validateOvertimeData":
          return await this.validateOvertimeData(params);

        case "checkDuplicateOvertime":
          return await this.checkDuplicateOvertime(params);

        case "getOvertimeTypes":
          // @ts-ignore
          return await this.getOvertimeTypes(params.category);

        case "getOvertimeStatuses":
          // @ts-ignore
          return await this.getOvertimeStatuses();

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("OvertimeHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("OvertimeHandler error:", error);
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
const overtimeHandler = new OvertimeHandler();

ipcMain.handle(
  "overtime",
  withErrorHandling(
    // @ts-ignore
    overtimeHandler.handleRequest.bind(overtimeHandler),
    "IPC:overtime",
  ),
);

module.exports = { OvertimeHandler, overtimeHandler };
// src/main/ipc/payrollPeriod/index.ipc.js - Payroll Period Management Handler
// @ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../utils/logger");
const { withErrorHandling } = require("../../../middlewares/errorHandler");

class PayrollPeriodHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getAllPayrollPeriods = this.importHandler("./get/all.ipc");
    this.getPayrollPeriodById = this.importHandler("./get/by_id.ipc");
    this.getCurrentPayrollPeriod = this.importHandler("./get/current.ipc");
    this.getPayrollPeriodByDate = this.importHandler("./get/by_date.ipc");
    this.getPayrollPeriodStats = this.importHandler("./get/stats.ipc");

    // ✏️ WRITE OPERATION HANDLERS
    this.createPayrollPeriod = this.importHandler("./create.ipc");
    this.updatePayrollPeriod = this.importHandler("./update.ipc");
    this.deletePayrollPeriod = this.importHandler("./delete.ipc");
    this.openPayrollPeriod = this.importHandler("./open.ipc");
    this.closePayrollPeriod = this.importHandler("./close.ipc");
    this.lockPayrollPeriod = this.importHandler("./lock.ipc");

    // 📄 REPORT HANDLERS
    this.exportPayrollPeriodsToCSV = this.importHandler("./export_csv.ipc");
  }

  // @ts-ignore
  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      // @ts-ignore
      console.warn(`[PayrollPeriodHandler] Failed to load handler: ${path}`, error.message);
      return async () => ({
        status: false,
        message: `Handler not implemented: ${path}`,
        data: null,
      });
    }
  }

  // @ts-ignore
  async handleRequest(event, payload) {
    try {
      const { method, params = {} } = payload;
      // @ts-ignore
      logger.info(`PayrollPeriodHandler: ${method}`, { params });

      switch (method) {
        case "getAllPayrollPeriods":
          return await this.getAllPayrollPeriods(params);
        case "getPayrollPeriodById":
          return await this.getPayrollPeriodById(params);
        case "getCurrentPayrollPeriod":
          return await this.getCurrentPayrollPeriod(params);
        case "getPayrollPeriodByDate":
          return await this.getPayrollPeriodByDate(params);
        case "getPayrollPeriodStats":
          return await this.getPayrollPeriodStats(params);
        case "createPayrollPeriod":
          return await this.createPayrollPeriod(params);
        case "updatePayrollPeriod":
          return await this.updatePayrollPeriod(params);
        case "deletePayrollPeriod":
          return await this.deletePayrollPeriod(params);
        case "openPayrollPeriod":
          return await this.openPayrollPeriod(params);
        case "closePayrollPeriod":
          return await this.closePayrollPeriod(params);
        case "lockPayrollPeriod":
          return await this.lockPayrollPeriod(params);
        case "exportPayrollPeriodsToCSV":
          return await this.exportPayrollPeriodsToCSV(params);
        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      // @ts-ignore
      logger.error("PayrollPeriodHandler error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }

  // @ts-ignore
  async logActivity(userId, action, description, qr = null) {
    try {
      const { AuditLog } = require("../../../entities/AuditLog");
      const { AppDataSource } = require("../../db/datasource");
      // @ts-ignore
      const repo = qr ? qr.manager.getRepository(AuditLog) : AppDataSource.getRepository(AuditLog);
      const log = repo.create({
        user: userId,
        action,
        description,
        entity: "PayrollPeriod",
        timestamp: new Date(),
      });
      await repo.save(log);
    } catch (error) {
      // @ts-ignore
      logger.warn("Failed to log payroll period activity:", error);
    }
  }
}

const payrollPeriodHandler = new PayrollPeriodHandler();
ipcMain.handle(
  "payrollPeriod",
  withErrorHandling(payrollPeriodHandler.handleRequest.bind(payrollPeriodHandler), "IPC:payrollPeriod")
);

module.exports = { PayrollPeriodHandler, payrollPeriodHandler };
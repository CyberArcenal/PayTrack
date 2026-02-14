// src/main/ipc/deduction/index.ipc.js - Deduction Management Handler
// @ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../utils/logger");
const { withErrorHandling } = require("../../../middlewares/errorHandler");

class DeductionHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getAllDeductions = this.importHandler("./get/all.ipc");
    this.getDeductionById = this.importHandler("./get/by_id.ipc");
    this.getDeductionsByPayroll = this.importHandler("./get/by_payroll.ipc");
    this.getDeductionsByType = this.importHandler("./get/by_type.ipc");
    this.getDeductionStats = this.importHandler("./get/stats.ipc");
    this.searchDeductions = this.importHandler("./search.ipc");

    // ✏️ WRITE OPERATION HANDLERS
    this.createDeduction = this.importHandler("./create.ipc");
    this.updateDeduction = this.importHandler("./update.ipc");
    this.deleteDeduction = this.importHandler("./delete.ipc");
    this.bulkCreateDeductions = this.importHandler("./bulk_create.ipc");
    this.bulkUpdateDeductions = this.importHandler("./bulk_update.ipc");

    // 📄 REPORT HANDLERS
    this.exportDeductionsToCSV = this.importHandler("./export_csv.ipc");
    this.generateDeductionReport = this.importHandler("./generate_report.ipc");
  }

  /**
   * @param {string} path
   */
  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      console.warn(
        `[DeductionHandler] Failed to load handler: ${path}`,
        // @ts-ignore
        error.message,
      );
      return async () => ({
        status: false,
        message: `Handler not implemented: ${path}`,
        data: null,
      });
    }
  }

  /** @param {Electron.IpcMainInvokeEvent} event @param {{ method: any; params: {}; }} payload */
  // @ts-ignore
  async handleRequest(event, payload) {
    try {
      const { method, params = {} } = payload;
      // @ts-ignore
      logger.info(`DeductionHandler: ${method}`, { params });

      switch (method) {
        // 📋 READ-ONLY
        case "getAllDeductions":
          return await this.getAllDeductions(params);
        case "getDeductionById":
          return await this.getDeductionById(params);
        case "getDeductionsByPayroll":
          return await this.getDeductionsByPayroll(params);
        case "getDeductionsByType":
          return await this.getDeductionsByType(params);
        case "getDeductionStats":
          return await this.getDeductionStats(params);
        case "searchDeductions":
          return await this.searchDeductions(params);

        // ✏️ WRITE
        case "createDeduction":
          return await this.createDeduction(params);
        case "updateDeduction":
          return await this.updateDeduction(params);
        case "deleteDeduction":
          return await this.deleteDeduction(params);
        case "bulkCreateDeductions":
          return await this.bulkCreateDeductions(params);
        case "bulkUpdateDeductions":
          return await this.bulkUpdateDeductions(params);

        // 📄 REPORT
        case "exportDeductionsToCSV":
          return await this.exportDeductionsToCSV(params);
        case "generateDeductionReport":
          return await this.generateDeductionReport(params);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      // @ts-ignore
      logger.error("DeductionHandler error:", error);
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }

  /**
   * Optional activity logger (gamit ang AuditLog entity)
   * @param {number|string} userId
   * @param {string} action
   * @param {string} description
   * @param {import("typeorm").QueryRunner} [qr]
   */
  // @ts-ignore
  async logActivity(userId, action, description, qr = null) {
    try {
      const { AuditLog } = require("../../../entities/AuditLog");
      const { AppDataSource } = require("../../db/datasource");
      const repo = qr
        ? qr.manager.getRepository(AuditLog)
        : AppDataSource.getRepository(AuditLog);
      // @ts-ignore
      const log = repo.create({
        user: userId,
        action,
        description,
        entity: "Deduction",
        timestamp: new Date(),
      });
      await repo.save(log);
    } catch (error) {
      // @ts-ignore
      logger.warn("Failed to log deduction activity:", error);
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

// src/main/ipc/overtime/index.ipc.js - Overtime Log Management Handler
// @ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../utils/logger");
const { withErrorHandling } = require("../../../middlewares/errorHandler");

class OvertimeHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getAllOvertime = this.importHandler("./get/all.ipc");
    this.getOvertimeById = this.importHandler("./get/by_id.ipc");
    this.getOvertimeByEmployee = this.importHandler("./get/by_employee.ipc");
    this.getOvertimeByPayroll = this.importHandler("./get/by_payroll.ipc");
    this.getOvertimeByDate = this.importHandler("./get/by_date.ipc");
    this.getOvertimeStats = this.importHandler("./get/stats.ipc");
    this.searchOvertime = this.importHandler("./search.ipc");

    // ✏️ WRITE OPERATION HANDLERS
    this.createOvertime = this.importHandler("./create.ipc");
    this.updateOvertime = this.importHandler("./update.ipc");
    this.deleteOvertime = this.importHandler("./delete.ipc");
    this.bulkCreateOvertime = this.importHandler("./bulk_create.ipc");
    this.bulkUpdateOvertime = this.importHandler("./bulk_update.ipc");
    this.approveOvertime = this.importHandler("./approve.ipc");
    this.rejectOvertime = this.importHandler("./reject.ipc");

    // 📄 REPORT HANDLERS
    this.exportOvertimeToCSV = this.importHandler("./export_csv.ipc");
    this.generateOvertimeReport = this.importHandler("./generate_report.ipc");
  }

  // @ts-ignore
  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      // @ts-ignore
      console.warn(`[OvertimeHandler] Failed to load handler: ${path}`, error.message);
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
      logger.info(`OvertimeHandler: ${method}`, { params });

      switch (method) {
        // 📋 READ-ONLY
        case "getAllOvertime":
          return await this.getAllOvertime(params);
        case "getOvertimeById":
          return await this.getOvertimeById(params);
        case "getOvertimeByEmployee":
          return await this.getOvertimeByEmployee(params);
        case "getOvertimeByPayroll":
          return await this.getOvertimeByPayroll(params);
        case "getOvertimeByDate":
          return await this.getOvertimeByDate(params);
        case "getOvertimeStats":
          return await this.getOvertimeStats(params);
        case "searchOvertime":
          return await this.searchOvertime(params);

        // ✏️ WRITE
        case "createOvertime":
          return await this.createOvertime(params);
        case "updateOvertime":
          return await this.updateOvertime(params);
        case "deleteOvertime":
          return await this.deleteOvertime(params);
        case "bulkCreateOvertime":
          return await this.bulkCreateOvertime(params);
        case "bulkUpdateOvertime":
          return await this.bulkUpdateOvertime(params);
        case "approveOvertime":
          return await this.approveOvertime(params);
        case "rejectOvertime":
          return await this.rejectOvertime(params);

        // 📄 REPORT
        case "exportOvertimeToCSV":
          return await this.exportOvertimeToCSV(params);
        case "generateOvertimeReport":
          return await this.generateOvertimeReport(params);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      // @ts-ignore
      logger.error("OvertimeHandler error:", error);
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
        entity: "OvertimeLog",
        timestamp: new Date(),
      });
      await repo.save(log);
    } catch (error) {
      // @ts-ignore
      logger.warn("Failed to log overtime activity:", error);
    }
  }
}

const overtimeHandler = new OvertimeHandler();
ipcMain.handle(
  "overtime",
  withErrorHandling(overtimeHandler.handleRequest.bind(overtimeHandler), "IPC:overtime")
);

module.exports = { OvertimeHandler, overtimeHandler };
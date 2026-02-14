// src/main/ipc/attendance/index.ipc.js - Attendance Log Management Handler
// @ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../utils/logger");
const { withErrorHandling } = require("../../../middlewares/errorHandler");

class AttendanceHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getAllAttendance = this.importHandler("./get/all.ipc");
    this.getAttendanceById = this.importHandler("./get/by_id.ipc");
    this.getAttendanceByEmployee = this.importHandler("./get/by_employee.ipc");
    this.getAttendanceByDate = this.importHandler("./get/by_date.ipc");
    this.getAttendanceSummary = this.importHandler("./get/summary.ipc");
    this.getAttendanceStats = this.importHandler("./get/stats.ipc");
    this.searchAttendance = this.importHandler("./search.ipc");
    this.getAttendanceForPayroll = this.importHandler("./get/for_payroll.ipc");

    // ✏️ WRITE OPERATION HANDLERS
    this.createAttendance = this.importHandler("./create.ipc");
    this.updateAttendance = this.importHandler("./update.ipc");
    this.deleteAttendance = this.importHandler("./delete.ipc");
    this.markAttendanceAsProcessed = this.importHandler(
      "./mark_as_processed.ipc",
    );
    this.bulkCreateAttendance = this.importHandler("./bulk_create.ipc");

    // 📄 REPORT HANDLERS
    this.exportAttendanceToCSV = this.importHandler("./export_csv.ipc");
    this.generateAttendanceReport = this.importHandler("./generate_report.ipc");
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
        `[AttendanceHandler] Failed to load handler: ${path}`,
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
      logger.info(`AttendanceHandler: ${method}`, { params });

      switch (method) {
        // 📋 READ-ONLY
        case "getAllAttendance":
          return await this.getAllAttendance(params);
        case "getAttendanceById":
          return await this.getAttendanceById(params);
        case "getAttendanceByEmployee":
          return await this.getAttendanceByEmployee(params);
        case "getAttendanceByDate":
          return await this.getAttendanceByDate(params);
        case "getAttendanceSummary":
          return await this.getAttendanceSummary(params);
        case "getAttendanceStats":
          return await this.getAttendanceStats(params);
        case "searchAttendance":
          return await this.searchAttendance(params);
        case "getAttendanceForPayroll":
          return await this.getAttendanceForPayroll(params);

        // ✏️ WRITE
        case "createAttendance":
          return await this.createAttendance(params);
        case "updateAttendance":
          return await this.updateAttendance(params);
        case "deleteAttendance":
          return await this.deleteAttendance(params);
        case "markAttendanceAsProcessed":
          return await this.markAttendanceAsProcessed(params);
        case "bulkCreateAttendance":
          return await this.bulkCreateAttendance(params);

        // 📄 REPORT
        case "exportAttendanceToCSV":
          return await this.exportAttendanceToCSV(params);
        case "generateAttendanceReport":
          return await this.generateAttendanceReport(params);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      // @ts-ignore
      logger.error("AttendanceHandler error:", error);
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
        entity: "AttendanceLog",
        timestamp: new Date(),
      });
      await repo.save(log);
    } catch (error) {
      // @ts-ignore
      logger.warn("Failed to log attendance activity:", error);
    }
  }
}

// Register IPC handler
const attendanceHandler = new AttendanceHandler();
ipcMain.handle(
  "attendance",
  withErrorHandling(
    // @ts-ignore
    attendanceHandler.handleRequest.bind(attendanceHandler),
    "IPC:attendance",
  ),
);

module.exports = { AttendanceHandler, attendanceHandler };

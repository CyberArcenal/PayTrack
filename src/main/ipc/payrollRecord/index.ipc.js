// src/main/ipc/payrollRecord/index.ipc.js - Payroll Record Management Handler
// @ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../utils/logger");
const { withErrorHandling } = require("../../../middlewares/errorHandler");

class PayrollRecordHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getAllPayrollRecords = this.importHandler("./get/all.ipc");
    this.getPayrollRecordById = this.importHandler("./get/by_id.ipc");
    this.getPayrollRecordsByEmployee = this.importHandler("./get/by_employee.ipc");
    this.getPayrollRecordsByPeriod = this.importHandler("./get/by_period.ipc");
    this.getPayrollRecordsByStatus = this.importHandler("./get/by_status.ipc");
    this.getPayrollRecordStats = this.importHandler("./get/stats.ipc");
    this.searchPayrollRecords = this.importHandler("./search.ipc");

    // ✏️ WRITE OPERATION HANDLERS
    this.createPayrollRecord = this.importHandler("./create.ipc");
    this.updatePayrollRecord = this.importHandler("./update.ipc");
    this.deletePayrollRecord = this.importHandler("./delete.ipc");
    this.bulkCreatePayrollRecords = this.importHandler("./bulk_create.ipc");
    this.bulkUpdatePayrollRecords = this.importHandler("./bulk_update.ipc");
    this.computePayroll = this.importHandler("./compute.ipc");
    this.markAsPaid = this.importHandler("./mark_as_paid.ipc");
    this.cancelPayrollRecord = this.importHandler("./cancel.ipc");

    // 📄 REPORT HANDLERS
    this.exportPayrollRecordsToCSV = this.importHandler("./export_csv.ipc");
    this.generatePayrollReport = this.importHandler("./generate_report.ipc");
  }

  // @ts-ignore
  importHandler(path) {
    try {
      const fullPath = require.resolve(`./${path}`, { paths: [__dirname] });
      return require(fullPath);
    } catch (error) {
      // @ts-ignore
      console.warn(`[PayrollRecordHandler] Failed to load handler: ${path}`, error.message);
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
      logger.info(`PayrollRecordHandler: ${method}`, { params });

      switch (method) {
        case "getAllPayrollRecords":
          return await this.getAllPayrollRecords(params);
        case "getPayrollRecordById":
          return await this.getPayrollRecordById(params);
        case "getPayrollRecordsByEmployee":
          return await this.getPayrollRecordsByEmployee(params);
        case "getPayrollRecordsByPeriod":
          return await this.getPayrollRecordsByPeriod(params);
        case "getPayrollRecordsByStatus":
          return await this.getPayrollRecordsByStatus(params);
        case "getPayrollRecordStats":
          return await this.getPayrollRecordStats(params);
        case "searchPayrollRecords":
          return await this.searchPayrollRecords(params);
        case "createPayrollRecord":
          return await this.createPayrollRecord(params);
        case "updatePayrollRecord":
          return await this.updatePayrollRecord(params);
        case "deletePayrollRecord":
          return await this.deletePayrollRecord(params);
        case "bulkCreatePayrollRecords":
          return await this.bulkCreatePayrollRecords(params);
        case "bulkUpdatePayrollRecords":
          return await this.bulkUpdatePayrollRecords(params);
        case "computePayroll":
          return await this.computePayroll(params);
        case "markAsPaid":
          return await this.markAsPaid(params);
        case "cancelPayrollRecord":
          return await this.cancelPayrollRecord(params);
        case "exportPayrollRecordsToCSV":
          return await this.exportPayrollRecordsToCSV(params);
        case "generatePayrollReport":
          return await this.generatePayrollReport(params);
        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      // @ts-ignore
      logger.error("PayrollRecordHandler error:", error);
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
        entity: "PayrollRecord",
        timestamp: new Date(),
      });
      await repo.save(log);
    } catch (error) {
      // @ts-ignore
      logger.warn("Failed to log payroll record activity:", error);
    }
  }
}

const payrollRecordHandler = new PayrollRecordHandler();
ipcMain.handle(
  "payrollRecord",
  withErrorHandling(payrollRecordHandler.handleRequest.bind(payrollRecordHandler), "IPC:payrollRecord")
);

module.exports = { PayrollRecordHandler, payrollRecordHandler };
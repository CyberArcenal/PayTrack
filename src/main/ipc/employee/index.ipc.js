// src/main/ipc/employee/index.ipc.js - Employee Management Handler
// @ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../utils/logger");
const { withErrorHandling } = require("../../../middlewares/errorHandler");

class EmployeeHandler {
  constructor() {
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getAllEmployees = this.importHandler("./get/all.ipc");
    this.getEmployeeById = this.importHandler("./get/by_id.ipc");
    this.getEmployeeByNumber = this.importHandler("./get/by_number.ipc");
    this.getEmployeesByDepartment = this.importHandler(
      "./get/by_department.ipc",
    );
    this.getEmployeesByStatus = this.importHandler("./get/by_status.ipc");
    this.getEmployeeStats = this.importHandler("./get/stats.ipc");
    this.searchEmployees = this.importHandler("./search.ipc");

    // ✏️ WRITE OPERATION HANDLERS
    this.createEmployee = this.importHandler("./create.ipc");
    this.updateEmployee = this.importHandler("./update.ipc");
    this.deleteEmployee = this.importHandler("./delete.ipc");
    this.bulkCreateEmployees = this.importHandler("./bulk_create.ipc");
    this.bulkUpdateEmployees = this.importHandler("./bulk_update.ipc");
    this.updateEmployeeStatus = this.importHandler("./update_status.ipc");
    this.terminateEmployee = this.importHandler("./terminate.ipc");

    // 📄 REPORT HANDLERS
    this.exportEmployeesToCSV = this.importHandler("./export_csv.ipc");
    this.generateEmployeeReport = this.importHandler("./generate_report.ipc");
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
        `[EmployeeHandler] Failed to load handler: ${path}`,
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
      logger.info(`EmployeeHandler: ${method}`, { params });

      switch (method) {
        // 📋 READ-ONLY
        case "getAllEmployees":
          return await this.getAllEmployees(params);
        case "getEmployeeById":
          return await this.getEmployeeById(params);
        case "getEmployeeByNumber":
          return await this.getEmployeeByNumber(params);
        case "getEmployeesByDepartment":
          return await this.getEmployeesByDepartment(params);
        case "getEmployeesByStatus":
          return await this.getEmployeesByStatus(params);
        case "getEmployeeStats":
          return await this.getEmployeeStats(params);
        case "searchEmployees":
          return await this.searchEmployees(params);

        // ✏️ WRITE
        case "createEmployee":
          return await this.createEmployee(params);
        case "updateEmployee":
          return await this.updateEmployee(params);
        case "deleteEmployee":
          return await this.deleteEmployee(params);
        case "bulkCreateEmployees":
          return await this.bulkCreateEmployees(params);
        case "bulkUpdateEmployees":
          return await this.bulkUpdateEmployees(params);
        case "updateEmployeeStatus":
          return await this.updateEmployeeStatus(params);
        case "terminateEmployee":
          return await this.terminateEmployee(params);

        // 📄 REPORT
        case "exportEmployeesToCSV":
          return await this.exportEmployeesToCSV(params);
        case "generateEmployeeReport":
          return await this.generateEmployeeReport(params);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      // @ts-ignore
      logger.error("EmployeeHandler error:", error);
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
        entity: "Employee",
        timestamp: new Date(),
      });
      await repo.save(log);
    } catch (error) {
      // @ts-ignore
      logger.warn("Failed to log employee activity:", error);
    }
  }
}

// Register IPC handler
const employeeHandler = new EmployeeHandler();
ipcMain.handle(
  "employee",
  withErrorHandling(
    // @ts-ignore
    employeeHandler.handleRequest.bind(employeeHandler),
    "IPC:employee",
  ),
);

module.exports = { EmployeeHandler, employeeHandler };

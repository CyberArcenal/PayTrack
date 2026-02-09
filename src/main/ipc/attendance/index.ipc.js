// index.ipc.js placeholder
// attendance.ipc.js - Attendance Management Handler
//@ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");
const { withErrorHandling } = require("../../../middlewares/errorHandler");

class AttendanceHandler {
  constructor() {
    // Initialize all handlers
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 READ-ONLY HANDLERS
    this.getAllAttendanceLogs = this.importHandler("./get/all.ipc");
    this.getAttendanceLogById = this.importHandler("./get/by_id.ipc");
    this.getAttendanceLogsByEmployee = this.importHandler("./get/by_employee.ipc");
    this.getAttendanceLogsByDate = this.importHandler("./get/by_date.ipc");
    this.getAttendanceLogsByDateRange = this.importHandler("./get/by_date_range.ipc");
    this.getAttendanceLogsByStatus = this.importHandler("./get/by_status.ipc");
    this.getAttendanceLogsBySource = this.importHandler("./get/by_source.ipc");
    this.getTodaysAttendance = this.importHandler("./get/today.ipc");
    this.getAttendanceSummary = this.importHandler("./get/summary.ipc");
    this.getLateEmployees = this.importHandler("./get/late.ipc");
    this.getAbsentEmployees = this.importHandler("./get/absent.ipc");
    this.getOvertimeLogs = this.importHandler("./get/overtime.ipc");

    // 📊 REPORT HANDLERS
    this.getAttendanceReport = this.importHandler("./get/report.ipc");
    this.getDailyAttendanceReport = this.importHandler("./get/daily_report.ipc");
    this.getMonthlyAttendanceReport = this.importHandler("./get/monthly_report.ipc");
    this.getEmployeeAttendanceSummary = this.importHandler("./get/employee_summary.ipc");

    // ✏️ WRITE OPERATION HANDLERS (with transactions)
    this.createAttendanceLog = this.importHandler("./create.ipc.js");
    this.updateAttendanceLog = this.importHandler("./update/update.ipc.js");
    this.deleteAttendanceLog = this.importHandler("./delete/delete.ipc.js");
    this.bulkClockIn = this.importHandler("./bulk_clock_in.ipc.js");
    this.bulkClockOut = this.importHandler("./bulk_clock_out.ipc.js");
    this.updateAttendanceStatus = this.importHandler("./update_status.ipc.js");
    this.updateHoursWorked = this.importHandler("./update_hours_worked.ipc.js");
    this.addAttendanceNote = this.importHandler("./add_note.ipc.js");
    this.approveOvertime = this.importHandler("./approve_overtime.ipc.js");

    // 🔄 BATCH OPERATIONS
    this.bulkCreateAttendanceLogs = this.importHandler("./bulk_create.ipc.js");
    this.importAttendanceFromCSV = this.importHandler("./import_csv.ipc.js");
    this.exportAttendanceToCSV = this.importHandler("./export_csv.ipc.js");
    this.syncAttendanceFromDevice = this.importHandler("./sync_device.ipc.js");

    // ⚙️ VALIDATION & UTILITY HANDLERS
    this.validateAttendanceData = this.importHandler("./validation/validate_data.ipc.js");
    this.checkDuplicateAttendance = this.importHandler("./check_duplicate.ipc.js");
    this.calculateHoursWorked = this.importHandler("./calculate_hours.ipc.js");
    this.getEmployeeSchedule = this.importHandler("./get_schedule.ipc.js");
  }

  /**
   * @param {string} path
   */
  importHandler(path) {
    try {
      return require(path);
    } catch (error) {
      console.warn(
        `[AttendanceHandler] Failed to load handler: ${path}`,
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
        logger.info(`AttendanceHandler: ${method}`, { params });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📋 READ-ONLY OPERATIONS
        case "getAllAttendanceLogs":
          // @ts-ignore
          return await this.getAllAttendanceLogs(params.filters);

        case "getAttendanceLogById":
          // @ts-ignore
          return await this.getAttendanceLogById(params.id);

        case "getAttendanceLogsByEmployee":
          return await this.getAttendanceLogsByEmployee(
            // @ts-ignore
            params.employeeId,
            // @ts-ignore
            params.dateRange,
          );

        case "getAttendanceLogsByDate":
          return await this.getAttendanceLogsByDate(
            // @ts-ignore
            params.date,
            // @ts-ignore
            params.filters,
          );

        case "getAttendanceLogsByDateRange":
          return await this.getAttendanceLogsByDateRange(
            // @ts-ignore
            params.startDate,
            // @ts-ignore
            params.endDate,
            // @ts-ignore
            params.filters,
          );

        case "getAttendanceLogsByStatus":
          return await this.getAttendanceLogsByStatus(
            // @ts-ignore
            params.status,
            // @ts-ignore
            params.filters,
          );

        case "getAttendanceLogsBySource":
          return await this.getAttendanceLogsBySource(
            // @ts-ignore
            params.source,
            // @ts-ignore
            params.filters,
          );

        case "getTodaysAttendance":
          // @ts-ignore
          return await this.getTodaysAttendance(params.filters);

        case "getAttendanceSummary":
          return await this.getAttendanceSummary(
            // @ts-ignore
            params.dateRange,
            // @ts-ignore
            params.employeeId,
          );

        case "getLateEmployees":
          return await this.getLateEmployees(
            // @ts-ignore
            params.date,
            // @ts-ignore
            params.filters,
          );

        case "getAbsentEmployees":
          return await this.getAbsentEmployees(
            // @ts-ignore
            params.date,
            // @ts-ignore
            params.filters,
          );

        case "getOvertimeLogs":
          return await this.getOvertimeLogs(
            // @ts-ignore
            params.dateRange,
            // @ts-ignore
            params.filters,
          );

        // 📊 REPORT OPERATIONS
        case "getAttendanceReport":
          return await this.getAttendanceReport(
            // @ts-ignore
            params.dateRange,
            // @ts-ignore
            params.filters,
          );

        case "getDailyAttendanceReport":
          return await this.getDailyAttendanceReport(
            // @ts-ignore
            params.date,
            // @ts-ignore
            params.filters,
          );

        case "getMonthlyAttendanceReport":
          return await this.getMonthlyAttendanceReport(
            // @ts-ignore
            params.year,
            // @ts-ignore
            params.month,
            // @ts-ignore
            params.filters,
          );

        case "getEmployeeAttendanceSummary":
          return await this.getEmployeeAttendanceSummary(
            // @ts-ignore
            params.employeeId,
            // @ts-ignore
            params.dateRange,
          );

        // ✏️ WRITE OPERATIONS (with transactions)
        case "createAttendanceLog":
          return await this.handleWithTransaction(
            this.createAttendanceLog,
            // @ts-ignore
            params,
          );

        case "updateAttendanceLog":
          return await this.handleWithTransaction(
            this.updateAttendanceLog,
            // @ts-ignore
            params,
          );

        case "deleteAttendanceLog":
          return await this.handleWithTransaction(
            this.deleteAttendanceLog,
            // @ts-ignore
            params,
          );

        case "bulkClockIn":
          return await this.handleWithTransaction(
            this.bulkClockIn,
            // @ts-ignore
            params,
          );

        case "bulkClockOut":
          return await this.handleWithTransaction(
            this.bulkClockOut,
            // @ts-ignore
            params,
          );

        case "updateAttendanceStatus":
          return await this.handleWithTransaction(
            this.updateAttendanceStatus,
            // @ts-ignore
            params,
          );

        case "updateHoursWorked":
          return await this.handleWithTransaction(
            this.updateHoursWorked,
            // @ts-ignore
            params,
          );

        case "addAttendanceNote":
          return await this.handleWithTransaction(
            this.addAttendanceNote,
            // @ts-ignore
            params,
          );

        case "approveOvertime":
          return await this.handleWithTransaction(
            this.approveOvertime,
            // @ts-ignore
            params,
          );

        // 🔄 BATCH OPERATIONS
        case "bulkCreateAttendanceLogs":
          return await this.handleWithTransaction(
            this.bulkCreateAttendanceLogs,
            // @ts-ignore
            params,
          );

        case "importAttendanceFromCSV":
          return await this.handleWithTransaction(
            this.importAttendanceFromCSV,
            // @ts-ignore
            params,
          );

        case "exportAttendanceToCSV":
          return await this.exportAttendanceToCSV(params);

        case "syncAttendanceFromDevice":
          return await this.handleWithTransaction(
            this.syncAttendanceFromDevice,
            // @ts-ignore
            params,
          );

        // ⚙️ VALIDATION & UTILITY OPERATIONS
        case "validateAttendanceData":
          return await this.validateAttendanceData(params);

        case "checkDuplicateAttendance":
          return await this.checkDuplicateAttendance(params);

        case "calculateHoursWorked":
          return await this.calculateHoursWorked(params);

        case "getEmployeeSchedule":
          return await this.getEmployeeSchedule(params);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("AttendanceHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("AttendanceHandler error:", error);
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
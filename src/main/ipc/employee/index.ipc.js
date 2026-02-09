// ===================== employee.ipc.js =====================
// src/ipc/handlers/employee.ipc.js - Employee Management Handler
// @ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");
const { withErrorHandling } = require("../../../middlewares/errorHandler");

class EmployeeHandler {
  constructor() {
    // Initialize all handlers
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📋 BASIC EMPLOYEE OPERATIONS
    this.getAllEmployees = this.importHandler("./get/all.ipc");
    this.getEmployeeById = this.importHandler("./get/by_id.ipc");
    this.getEmployeeByNumber = this.importHandler("./get/by_number.ipc");
    this.getEmployeesByDepartment = this.importHandler("./get/by_department.ipc");
    this.getEmployeesByPosition = this.importHandler("./get/by_position.ipc");
    this.getEmployeesByStatus = this.importHandler("./get/by_status.ipc");
    this.getEmployeesByEmploymentType = this.importHandler("./get/by_employment_type.ipc");
    this.getActiveEmployees = this.importHandler("./get/active.ipc");
    this.getInactiveEmployees = this.importHandler("./get/inactive.ipc");
    this.searchEmployees = this.importHandler("./search.ipc");
    this.getEmployeeCount = this.importHandler("./get/count.ipc");

    // ✏️ WRITE OPERATIONS
    this.createEmployee = this.importHandler("./create.ipc.js");
    this.updateEmployee = this.importHandler("./update/update.ipc.js");
    this.deleteEmployee = this.importHandler("./delete/delete.ipc.js");
    this.updateEmployeeStatus = this.importHandler("./update_status.ipc.js");
    this.updateEmployeeSalary = this.importHandler("./update_salary.ipc.js");
    this.updateEmployeeDepartment = this.importHandler("./update_department.ipc.js");
    this.updateEmployeePosition = this.importHandler("./update_position.ipc.js");
    this.updateEmployeeBankInfo = this.importHandler("./update_bank_info.ipc.js");
    this.updateEmployeeGovernmentIds = this.importHandler("./update_govt_ids.ipc.js");

    // 💰 PAYROLL RELATED HANDLERS
    this.calculateEmployeeRates = this.importHandler("./payroll/calculate_rates.ipc.js");
    this.updateEmployeePayrollInfo = this.importHandler("./payroll/update_payroll_info.ipc.js");
    this.applySalaryIncrease = this.importHandler("./payroll/apply_increase.ipc.js");

    // 📊 REPORT HANDLERS (Basic)
    this.getEmployeeMasterlist = this.importHandler("./get/masterlist.ipc");
    this.getEmployeeDirectory = this.importHandler("./get/directory.ipc");
    this.getDepartmentHeadcount = this.importHandler("./get/department_headcount.ipc");
    this.getEmployeeSalaryReport = this.importHandler("./get/salary_report.ipc");
    this.getEmployeeBirthdayReport = this.importHandler("./get/birthday_report.ipc");

    // ⚙️ UTILITY HANDLERS
    this.validateEmployeeData = this.importHandler("./validation/validate_data.ipc.js");
    this.checkDuplicateEmployee = this.importHandler("./check_duplicate.ipc.js");
    this.generateEmployeeNumber = this.importHandler("./generate_employee_number.ipc.js");
    this.validateGovernmentNumbers = this.importHandler("./validation/validate_govt_numbers.ipc.js");
    this.calculateServiceTenure = this.importHandler("./calculate_tenure.ipc.js");
    this.getEmployeeAge = this.importHandler("./calculate_age.ipc.js");
  }

  /**
   * @param {string} path
   */
  importHandler(path) {
    try {
      return require(path);
    } catch (error) {
      console.warn(
        `[EmployeeHandler] Failed to load handler: ${path}`,
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
        logger.info(`EmployeeHandler: ${method}`, { params });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📋 BASIC OPERATIONS
        case "getAllEmployees":
          // @ts-ignore
          return await this.getAllEmployees(params.filters);

        case "getEmployeeById":
          // @ts-ignore
          return await this.getEmployeeById(params.id);

        case "getEmployeeByNumber":
          // @ts-ignore
          return await this.getEmployeeByNumber(params.employeeNumber);

        case "getEmployeesByDepartment":
          return await this.getEmployeesByDepartment(
            // @ts-ignore
            params.department,
            // @ts-ignore
            params.filters,
          );

        case "getEmployeesByPosition":
          return await this.getEmployeesByPosition(
            // @ts-ignore
            params.position,
            // @ts-ignore
            params.filters,
          );

        case "getEmployeesByStatus":
          return await this.getEmployeesByStatus(
            // @ts-ignore
            params.status,
            // @ts-ignore
            params.filters,
          );

        case "getEmployeesByEmploymentType":
          return await this.getEmployeesByEmploymentType(
            // @ts-ignore
            params.employmentType,
            // @ts-ignore
            params.filters,
          );

        case "getActiveEmployees":
          // @ts-ignore
          return await this.getActiveEmployees(params.filters);

        case "getInactiveEmployees":
          // @ts-ignore
          return await this.getInactiveEmployees(params.filters);

        case "searchEmployees":
          return await this.searchEmployees(
            // @ts-ignore
            params.query,
            // @ts-ignore
            params.filters,
          );

        case "getEmployeeCount":
          // @ts-ignore
          return await this.getEmployeeCount(params.filters);

        // ✏️ WRITE OPERATIONS (with transactions)
        case "createEmployee":
          return await this.handleWithTransaction(
            this.createEmployee,
            // @ts-ignore
            params,
          );

        case "updateEmployee":
          return await this.handleWithTransaction(
            this.updateEmployee,
            // @ts-ignore
            params,
          );

        case "deleteEmployee":
          return await this.handleWithTransaction(
            this.deleteEmployee,
            // @ts-ignore
            params,
          );

        case "updateEmployeeStatus":
          return await this.handleWithTransaction(
            this.updateEmployeeStatus,
            // @ts-ignore
            params,
          );

        case "updateEmployeeSalary":
          return await this.handleWithTransaction(
            this.updateEmployeeSalary,
            // @ts-ignore
            params,
          );

        case "updateEmployeeDepartment":
          return await this.handleWithTransaction(
            this.updateEmployeeDepartment,
            // @ts-ignore
            params,
          );

        case "updateEmployeePosition":
          return await this.handleWithTransaction(
            this.updateEmployeePosition,
            // @ts-ignore
            params,
          );

        case "updateEmployeeBankInfo":
          return await this.handleWithTransaction(
            this.updateEmployeeBankInfo,
            // @ts-ignore
            params,
          );

        case "updateEmployeeGovernmentIds":
          return await this.handleWithTransaction(
            this.updateEmployeeGovernmentIds,
            // @ts-ignore
            params,
          );

        // 💰 PAYROLL & COMPENSATION OPERATIONS
        case "calculateEmployeeRates":
          return await this.calculateEmployeeRates(
            // @ts-ignore
            params.employeeId,
            // @ts-ignore
            params.basePay,
          );

        case "updateEmployeePayrollInfo":
          return await this.handleWithTransaction(
            this.updateEmployeePayrollInfo,
            // @ts-ignore
            params,
          );

        case "applySalaryIncrease":
          return await this.handleWithTransaction(
            this.applySalaryIncrease,
            // @ts-ignore
            params,
          );

        // 📊 REPORT OPERATIONS
        case "getEmployeeMasterlist":
          // @ts-ignore
          return await this.getEmployeeMasterlist(params.filters);

        case "getEmployeeDirectory":
          // @ts-ignore
          return await this.getEmployeeDirectory(params.filters);

        case "getDepartmentHeadcount":
          // @ts-ignore
          return await this.getDepartmentHeadcount(params.date);

        case "getEmployeeSalaryReport":
          return await this.getEmployeeSalaryReport(
            // @ts-ignore
            params.department,
            // @ts-ignore
            params.minSalary,
            // @ts-ignore
            params.maxSalary,
          );

        case "getEmployeeBirthdayReport":
          return await this.getEmployeeBirthdayReport(
            // @ts-ignore
            params.month,
            // @ts-ignore
            params.year,
          );

        // ⚙️ VALIDATION & UTILITY OPERATIONS
        case "validateEmployeeData":
          return await this.validateEmployeeData(params);

        case "checkDuplicateEmployee":
          return await this.checkDuplicateEmployee(params);

        case "generateEmployeeNumber":
          // @ts-ignore
          return await this.generateEmployeeNumber(params.prefix);

        case "validateGovernmentNumbers":
          return await this.validateGovernmentNumbers(
            // @ts-ignore
            params.sss,
            // @ts-ignore
            params.philhealth,
            // @ts-ignore
            params.pagibig,
            // @ts-ignore
            params.tin,
          );

        case "calculateServiceTenure":
          return await this.calculateServiceTenure(
            // @ts-ignore
            params.employeeId,
            // @ts-ignore
            params.asOfDate,
          );

        case "getEmployeeAge":
          // @ts-ignore
          return await this.getEmployeeAge(params.employeeId);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("EmployeeHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("EmployeeHandler error:", error);
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
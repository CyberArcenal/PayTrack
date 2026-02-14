// src/services/EmployeeService.js
//@ts-check
const { AppDataSource } = require("../main/db/datasource");
const { saveDb, updateDb, removeDb } = require("../utils/dbUtils/dbActions");
const auditLogger = require("../utils/auditLogger");
const { validateEmployeeData, generateEmployeeNumber } = require("../utils/employeeUtils");

class EmployeeService {
  constructor() {
    this.employeeRepository = null;
    this.attendanceRepository = null;
    this.payrollRecordRepository = null;
    this.overtimeLogRepository = null;
  }

  async initialize() {
    const Employee = require("../entities/Employee");
    const AttendanceLog = require("../entities/AttendanceLog");
    const PayrollRecord = require("../entities/PayrollRecord");
    const OvertimeLog = require("../entities/OvertimeLog");
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.employeeRepository = AppDataSource.getRepository(Employee);
    this.attendanceRepository = AppDataSource.getRepository(AttendanceLog);
    this.payrollRecordRepository = AppDataSource.getRepository(PayrollRecord);
    this.overtimeLogRepository = AppDataSource.getRepository(OvertimeLog);
    console.log("EmployeeService initialized");
  }

  async getRepositories() {
    if (!this.employeeRepository) {
      await this.initialize();
    }
    return {
      employee: this.employeeRepository,
      attendance: this.attendanceRepository,
      payrollRecord: this.payrollRecordRepository,
      overtimeLog: this.overtimeLogRepository,
    };
  }

  /**
   * Create a new employee
   * @param {Object} data - Employee data
   * @param {string} user - User performing the action
   */
  async create(data, user = "system") {
    const { employee: employeeRepo } = await this.getRepositories();

    try {
      // Validate input
      // @ts-ignore
      const validation = await validateEmployeeData(data, employeeRepo);
      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }

      // Generate employee number if not provided
      // @ts-ignore
      if (!data.employeeNumber) {
        // @ts-ignore
        data.employeeNumber = await generateEmployeeNumber(employeeRepo);
      }

      // Compute daily and hourly rates if basePay is provided and rates not explicitly given
      // @ts-ignore
      let dailyRate = data.dailyRate;
      // @ts-ignore
      let hourlyRate = data.hourlyRate;
      if (
        // @ts-ignore
        data.basePay &&
        (!dailyRate || dailyRate === 0) &&
        // @ts-ignore
        data.workingDaysPerPeriod
      ) {
        // Assuming basePay is per pay period; we need working days per period to compute daily rate.
        // But we don't have workingDaysPerPeriod in the entity. Maybe we compute based on default 22 days?
        // For simplicity, we'll just set dailyRate and hourlyRate as provided, or leave as default.
        // This can be enhanced later.
      }

      // Create employee
      // @ts-ignore
      const employee = employeeRepo.create({
        ...data,
        // Ensure default values if not provided
        // @ts-ignore
        status: data.status || "active",
        // @ts-ignore
        employmentType: data.employmentType || "regular",
        // @ts-ignore
        paymentMethod: data.paymentMethod || "bank",
        // @ts-ignore
        overtimeRate: data.overtimeRate || 1.25,
      });

      // @ts-ignore
      const saved = await saveDb(employeeRepo, employee);

      // Audit log
      await auditLogger.logCreate("Employee", saved.id, saved, user);

      console.log(
        `Employee created: ID ${saved.id} (${saved.firstName} ${saved.lastName})`,
      );
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to create employee:", error.message);
      throw error;
    }
  }

  /**
   * Update an existing employee
   * @param {number} id - Employee ID
   * @param {Object} data - Updated data
   * @param {string} user - User performing the action
   */
  async update(id, data, user = "system") {
    const { employee: employeeRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const existing = await employeeRepo.findOne({ where: { id } });
      if (!existing) {
        throw new Error(`Employee with ID ${id} not found`);
      }

      const oldData = { ...existing };

      // Validate updated data (including unique constraints)
      const validation = await validateEmployeeData(
        { ...existing, ...data },
        // @ts-ignore
        employeeRepo,
        id,
      );
      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }

      // Update fields
      Object.assign(existing, data);

      // @ts-ignore
      const saved = await updateDb(employeeRepo, existing);

      await auditLogger.logUpdate("Employee", id, oldData, saved, user);

      console.log(`Employee updated: ID ${id}`);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to update employee:", error.message);
      throw error;
    }
  }

  /**
   * Delete an employee (cascade handled by database relations)
   * @param {number} id - Employee ID
   * @param {string} user - User performing the action
   */
  async delete(id, user = "system") {
    const { employee: employeeRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const existing = await employeeRepo.findOne({ where: { id } });
      if (!existing) {
        throw new Error(`Employee with ID ${id} not found`);
      }

      const oldData = { ...existing };
      // @ts-ignore
      await removeDb(employeeRepo, existing);

      await auditLogger.logDelete("Employee", id, oldData, user);

      console.log(`Employee deleted: ID ${id}`);
      return { success: true, message: "Employee deleted" };
    } catch (error) {
      // @ts-ignore
      console.error("Failed to delete employee:", error.message);
      throw error;
    }
  }

  /**
   * Find employee by ID
   * @param {number} id
   */
  async findById(id) {
    const { employee: employeeRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const employee = await employeeRepo.findOne({ where: { id } });
      if (!employee) {
        throw new Error(`Employee with ID ${id} not found`);
      }
      // @ts-ignore
      await auditLogger.logView("Employee", id, "system");
      return employee;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to find employee:", error.message);
      throw error;
    }
  }

  /**
   * Find all employees with filters
   * @param {Object} options - { status, department, employmentType, search, page, limit }
   */
  async findAll(options = {}) {
    const { employee: employeeRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const query = employeeRepo.createQueryBuilder("employee");

      // @ts-ignore
      if (options.status) {
        // @ts-ignore
        query.andWhere("employee.status = :status", { status: options.status });
      }

      // @ts-ignore
      if (options.department) {
        query.andWhere("employee.department = :department", {
          // @ts-ignore
          department: options.department,
        });
      }

      // @ts-ignore
      if (options.employmentType) {
        query.andWhere("employee.employmentType = :employmentType", {
          // @ts-ignore
          employmentType: options.employmentType,
        });
      }

      // @ts-ignore
      if (options.search) {
        query.andWhere(
          "(employee.firstName LIKE :search OR employee.lastName LIKE :search OR employee.middleName LIKE :search OR employee.employeeNumber LIKE :search OR employee.email LIKE :search)",
          // @ts-ignore
          { search: `%${options.search}%` },
        );
      }

      query
        .orderBy("employee.lastName", "ASC")
        .addOrderBy("employee.firstName", "ASC");

      // @ts-ignore
      if (options.page && options.limit) {
        // @ts-ignore
        const skip = (options.page - 1) * options.limit;
        // @ts-ignore
        query.skip(skip).take(options.limit);
      }

      const employees = await query.getMany();
      await auditLogger.logView("Employee", null, "system");
      return employees;
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      throw error;
    }
  }

  /**
   * Get employee summary (counts by status, department, etc.)
   */
  async getSummary() {
    const { employee: employeeRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const total = await employeeRepo.count();

      // @ts-ignore
      const statusCounts = await employeeRepo
        .createQueryBuilder("employee")
        .select("employee.status", "status")
        .addSelect("COUNT(*)", "count")
        .groupBy("employee.status")
        .getRawMany();

      // @ts-ignore
      const departmentCounts = await employeeRepo
        .createQueryBuilder("employee")
        .select("employee.department", "department")
        .addSelect("COUNT(*)", "count")
        .groupBy("employee.department")
        .getRawMany();

      // @ts-ignore
      const employmentTypeCounts = await employeeRepo
        .createQueryBuilder("employee")
        .select("employee.employmentType", "employmentType")
        .addSelect("COUNT(*)", "count")
        .groupBy("employee.employmentType")
        .getRawMany();

      return {
        total,
        statusCounts,
        departmentCounts,
        employmentTypeCounts,
      };
    } catch (error) {
      console.error("Failed to get employee summary:", error);
      throw error;
    }
  }

  /**
   * Get employee's attendance records
   * @param {number} employeeId
   * @param {Object} options - { startDate, endDate, limit }
   */
  async getAttendance(employeeId, options = {}) {
    const { attendance: attendanceRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const query = attendanceRepo
        .createQueryBuilder("attendance")
        .where("attendance.employeeId = :employeeId", { employeeId })
        .orderBy("attendance.timestamp", "DESC");

      // @ts-ignore
      if (options.startDate) {
        query.andWhere("attendance.timestamp >= :startDate", {
          // @ts-ignore
          startDate: options.startDate,
        });
      }
      // @ts-ignore
      if (options.endDate) {
        query.andWhere("attendance.timestamp <= :endDate", {
          // @ts-ignore
          endDate: options.endDate,
        });
      }
      // @ts-ignore
      if (options.limit) {
        // @ts-ignore
        query.take(options.limit);
      }

      return await query.getMany();
    } catch (error) {
      console.error("Failed to get employee attendance:", error);
      throw error;
    }
  }

  /**
   * Get employee's payroll records
   * @param {number} employeeId
   * @param {Object} options - { startDate, endDate, limit }
   */
  async getPayrollRecords(employeeId, options = {}) {
    const { payrollRecord: payrollRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const query = payrollRepo
        .createQueryBuilder("payroll")
        .leftJoinAndSelect("payroll.period", "period")
        .where("payroll.employeeId = :employeeId", { employeeId })
        .orderBy("period.endDate", "DESC");

      // @ts-ignore
      if (options.startDate) {
        query.andWhere("period.endDate >= :startDate", {
          // @ts-ignore
          startDate: options.startDate,
        });
      }
      // @ts-ignore
      if (options.endDate) {
        query.andWhere("period.endDate <= :endDate", {
          // @ts-ignore
          endDate: options.endDate,
        });
      }
      // @ts-ignore
      if (options.limit) {
        // @ts-ignore
        query.take(options.limit);
      }

      return await query.getMany();
    } catch (error) {
      console.error("Failed to get employee payroll records:", error);
      throw error;
    }
  }

  /**
   * Get employee's overtime logs
   * @param {number} employeeId
   * @param {Object} options - { startDate, endDate, status, limit }
   */
  async getOvertimeLogs(employeeId, options = {}) {
    const { overtimeLog: overtimeRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const query = overtimeRepo
        .createQueryBuilder("overtime")
        .where("overtime.employeeId = :employeeId", { employeeId })
        .orderBy("overtime.date", "DESC");

      // @ts-ignore
      if (options.startDate) {
        query.andWhere("overtime.date >= :startDate", {
          // @ts-ignore
          startDate: options.startDate,
        });
      }
      // @ts-ignore
      if (options.endDate) {
        query.andWhere("overtime.date <= :endDate", {
          // @ts-ignore
          endDate: options.endDate,
        });
      }
      // @ts-ignore
      if (options.status) {
        query.andWhere("overtime.approvalStatus = :status", {
          // @ts-ignore
          status: options.status,
        });
      }
      // @ts-ignore
      if (options.limit) {
        // @ts-ignore
        query.take(options.limit);
      }

      return await query.getMany();
    } catch (error) {
      console.error("Failed to get employee overtime logs:", error);
      throw error;
    }
  }

  /**
   * Change employee status (activate/deactivate/terminate)
   * @param {number} id
   * @param {string} newStatus - active, inactive, terminated, on-leave
   * @param {string} user
   */
  async changeStatus(id, newStatus, user = "system") {
    const { employee: employeeRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const existing = await employeeRepo.findOne({ where: { id } });
      if (!existing) {
        throw new Error(`Employee with ID ${id} not found`);
      }

      const oldData = { ...existing };
      existing.status = newStatus;

      // @ts-ignore
      const saved = await updateDb(employeeRepo, existing);
      await auditLogger.logUpdate("Employee", id, oldData, saved, user);

      console.log(`Employee ${id} status changed to ${newStatus}`);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to change employee status:", error.message);
      throw error;
    }
  }
}

// Singleton instance
const employeeService = new EmployeeService();
module.exports = employeeService;

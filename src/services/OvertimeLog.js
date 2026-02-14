// src/services/OvertimeLogService.js
//@ts-check
const { AppDataSource } = require("../main/db/datasource");
const { saveDb, updateDb, removeDb } = require("../utils/dbUtils/dbActions");
const auditLogger = require("../utils/auditLogger");
const OvertimeLog = require("../entities/OvertimeLog");
const Employee = require("../entities/Employee");
const PayrollRecord = require("../entities/PayrollRecord");
const {
  validateOvertimeData,
  calculateOvertimeAmount,
} = require("../utils/overtimeUtils");

class OvertimeLogService {
  constructor() {
    this.overtimeRepository = null;
    this.employeeRepository = null;
    this.payrollRecordRepository = null;
  }

  async initialize() {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.overtimeRepository = AppDataSource.getRepository(OvertimeLog);
    this.employeeRepository = AppDataSource.getRepository(Employee);
    this.payrollRecordRepository = AppDataSource.getRepository(PayrollRecord);
    console.log("OvertimeLogService initialized");
  }

  async getRepositories() {
    if (!this.overtimeRepository) {
      await this.initialize();
    }
    return {
      overtime: this.overtimeRepository,
      employee: this.employeeRepository,
      payrollRecord: this.payrollRecordRepository,
    };
  }

  /**
   * Create a new overtime log
   * @param {Object} data - Overtime data
   * @param {string} user - User performing the action
   */
  async create(data, user = "system") {
    const { overtime: overtimeRepo, employee: employeeRepo } =
      await this.getRepositories();

    try {
      // Validate input
      // @ts-ignore
      const validation = await validateOvertimeData(data, employeeRepo);
      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }

      const {
        // @ts-ignore
        employeeId,
        // @ts-ignore
        date,
        // @ts-ignore
        startTime,
        // @ts-ignore
        endTime,
        // @ts-ignore
        type,
        // @ts-ignore
        rate,
        // @ts-ignore
        approvedBy,
        // @ts-ignore
        note,
      } = data;

      // Check employee exists
      // @ts-ignore
      const employee = await employeeRepo.findOne({
        where: { id: employeeId },
      });
      if (!employee) {
        throw new Error(`Employee with ID ${employeeId} not found`);
      }

      // Calculate hours
      const hours = this.calculateHours(startTime, endTime, date);

      // Calculate amount (if hourlyRate available from employee)
      const amount = await calculateOvertimeAmount(employee, hours, rate);

      // Create overtime log
      // @ts-ignore
      const overtime = overtimeRepo.create({
        employeeId,
        date,
        startTime,
        endTime,
        hours,
        rate: rate || employee.overtimeRate || 1.25,
        amount,
        type: type || "regular",
        approvedBy,
        approvalStatus: "pending",
        note,
        employee,
      });

      // @ts-ignore
      const saved = await saveDb(overtimeRepo, overtime);

      // Audit log
      await auditLogger.logCreate("OvertimeLog", saved.id, saved, user);

      console.log(
        `Overtime log created: ID ${saved.id} for employee ${employeeId}`,
      );
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to create overtime log:", error.message);
      throw error;
    }
  }

  /**
   * Update an existing overtime log
   * @param {number} id - Overtime log ID
   * @param {Object} data - Updated data
   * @param {string} user - User performing the action
   */
  async update(id, data, user = "system") {
    const { overtime: overtimeRepo, employee: employeeRepo } =
      await this.getRepositories();

    try {
      // @ts-ignore
      const existing = await overtimeRepo.findOne({
        where: { id },
        relations: ["employee"],
      });
      if (!existing) {
        throw new Error(`Overtime log with ID ${id} not found`);
      }

      // If already processed (linked to payroll), prevent update unless forced? For now, allow.
      // You might add a check: if (existing.payrollRecordId) throw new Error("Cannot update overtime linked to payroll");

      const oldData = { ...existing };

      // If changing employeeId, validate new employee
      // @ts-ignore
      if (data.employeeId && data.employeeId !== existing.employeeId) {
        // @ts-ignore
        const newEmployee = await employeeRepo.findOne({
          // @ts-ignore
          where: { id: data.employeeId },
        });
        if (!newEmployee) {
          // @ts-ignore
          throw new Error(`Employee with ID ${data.employeeId} not found`);
        }
        // @ts-ignore
        existing.employee = newEmployee;
        // @ts-ignore
        existing.employeeId = data.employeeId;
      }

      // Update fields
      // @ts-ignore
      if (data.date) existing.date = data.date;
      // @ts-ignore
      if (data.startTime) existing.startTime = data.startTime;
      // @ts-ignore
      if (data.endTime) existing.endTime = data.endTime;
      // @ts-ignore
      if (data.type) existing.type = data.type;
      // @ts-ignore
      if (data.rate !== undefined) existing.rate = data.rate;
      // @ts-ignore
      if (data.approvedBy !== undefined) existing.approvedBy = data.approvedBy;
      // @ts-ignore
      if (data.approvalStatus) existing.approvalStatus = data.approvalStatus;
      // @ts-ignore
      if (data.note !== undefined) existing.note = data.note;

      // Recalculate hours if times or date changed
      // @ts-ignore
      if (data.date || data.startTime || data.endTime) {
        existing.hours = this.calculateHours(
          // @ts-ignore
          existing.startTime,
          existing.endTime,
          existing.date,
        );
      }

      // Recalculate amount if hours, rate, or employee changed
      if (
        // @ts-ignore
        data.employeeId ||
        // @ts-ignore
        data.rate !== undefined ||
        // @ts-ignore
        data.date ||
        // @ts-ignore
        data.startTime ||
        // @ts-ignore
        data.endTime
      ) {
        existing.amount = await calculateOvertimeAmount(
          // @ts-ignore
          existing.employee,
          // @ts-ignore
          existing.hours,
          existing.rate,
        );
      }

      // @ts-ignore
      const saved = await updateDb(overtimeRepo, existing);

      await auditLogger.logUpdate("OvertimeLog", id, oldData, saved, user);

      console.log(`Overtime log updated: ID ${id}`);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to update overtime log:", error.message);
      throw error;
    }
  }

  /**
   * Delete an overtime log
   * @param {number} id - Overtime log ID
   * @param {string} user - User performing the action
   */
  async delete(id, user = "system") {
    const { overtime: overtimeRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const existing = await overtimeRepo.findOne({ where: { id } });
      if (!existing) {
        throw new Error(`Overtime log with ID ${id} not found`);
      }

      const oldData = { ...existing };
      // @ts-ignore
      await removeDb(overtimeRepo, existing);

      await auditLogger.logDelete("OvertimeLog", id, oldData, user);

      console.log(`Overtime log deleted: ID ${id}`);
      return { success: true, message: "Overtime log deleted" };
    } catch (error) {
      // @ts-ignore
      console.error("Failed to delete overtime log:", error.message);
      throw error;
    }
  }

  /**
   * Find overtime log by ID
   * @param {number} id
   */
  async findById(id) {
    const { overtime: overtimeRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const overtime = await overtimeRepo.findOne({
        where: { id },
        relations: ["employee", "payrollRecord"],
      });
      if (!overtime) {
        throw new Error(`Overtime log with ID ${id} not found`);
      }
      // @ts-ignore
      await auditLogger.logView("OvertimeLog", id, "system");
      return overtime;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to find overtime log:", error.message);
      throw error;
    }
  }

  /**
   * Find all overtime logs with filters
   * @param {Object} options - { employeeId, startDate, endDate, type, approvalStatus, payrollRecordId, page, limit }
   */
  async findAll(options = {}) {
    const { overtime: overtimeRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const query = overtimeRepo
        .createQueryBuilder("overtime")
        .leftJoinAndSelect("overtime.employee", "employee")
        .leftJoinAndSelect("overtime.payrollRecord", "payrollRecord");

      // @ts-ignore
      if (options.employeeId) {
        query.andWhere("overtime.employeeId = :employeeId", {
          // @ts-ignore
          employeeId: options.employeeId,
        });
      }

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
      if (options.type) {
        // @ts-ignore
        query.andWhere("overtime.type = :type", { type: options.type });
      }

      // @ts-ignore
      if (options.approvalStatus) {
        query.andWhere("overtime.approvalStatus = :approvalStatus", {
          // @ts-ignore
          approvalStatus: options.approvalStatus,
        });
      }

      // @ts-ignore
      if (options.payrollRecordId) {
        query.andWhere("overtime.payrollRecordId = :payrollRecordId", {
          // @ts-ignore
          payrollRecordId: options.payrollRecordId,
        });
      }

      query
        .orderBy("overtime.date", "DESC")
        .addOrderBy("overtime.createdAt", "DESC");

      // @ts-ignore
      if (options.page && options.limit) {
        // @ts-ignore
        const skip = (options.page - 1) * options.limit;
        // @ts-ignore
        query.skip(skip).take(options.limit);
      }

      const overtimeLogs = await query.getMany();
      await auditLogger.logView("OvertimeLog", null, "system");
      return overtimeLogs;
    } catch (error) {
      console.error("Failed to fetch overtime logs:", error);
      throw error;
    }
  }

  /**
   * Approve an overtime log
   * @param {number} id - Overtime log ID
   * @param {string} approver - Approver name/ID
   * @param {string} user - User performing the action
   */
  async approve(id, approver, user = "system") {
    const { overtime: overtimeRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const existing = await overtimeRepo.findOne({ where: { id } });
      if (!existing) {
        throw new Error(`Overtime log with ID ${id} not found`);
      }
      if (existing.approvalStatus !== "pending") {
        throw new Error(`Overtime log is already ${existing.approvalStatus}`);
      }

      const oldData = { ...existing };
      existing.approvalStatus = "approved";
      existing.approvedBy = approver;

      // @ts-ignore
      const saved = await updateDb(overtimeRepo, existing);
      await auditLogger.logUpdate("OvertimeLog", id, oldData, saved, user);

      console.log(`Overtime log approved: ID ${id}`);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to approve overtime log:", error.message);
      throw error;
    }
  }

  /**
   * Reject an overtime log
   * @param {number} id - Overtime log ID
   * @param {string} reason - Rejection reason
   * @param {string} user - User performing the action
   */
  async reject(id, reason, user = "system") {
    const { overtime: overtimeRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const existing = await overtimeRepo.findOne({ where: { id } });
      if (!existing) {
        throw new Error(`Overtime log with ID ${id} not found`);
      }
      if (existing.approvalStatus !== "pending") {
        throw new Error(`Overtime log is already ${existing.approvalStatus}`);
      }

      const oldData = { ...existing };
      existing.approvalStatus = "rejected";
      existing.note = existing.note
        ? `${existing.note}\nRejection reason: ${reason}`
        : `Rejection reason: ${reason}`;

      // @ts-ignore
      const saved = await updateDb(overtimeRepo, existing);
      await auditLogger.logUpdate("OvertimeLog", id, oldData, saved, user);

      console.log(`Overtime log rejected: ID ${id}`);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to reject overtime log:", error.message);
      throw error;
    }
  }

  /**
   * Mark overtime logs as processed for a payroll record
   * @param {number[]} overtimeIds
   * @param {number} payrollRecordId
   * @param {string} user
   */
  async markAsProcessed(overtimeIds, payrollRecordId, user = "system") {
    const { overtime: overtimeRepo, payrollRecord: payrollRepo } =
      await this.getRepositories();

    try {
      // @ts-ignore
      const payrollRecord = await payrollRepo.findOne({
        where: { id: payrollRecordId },
      });
      if (!payrollRecord) {
        throw new Error(`Payroll record with ID ${payrollRecordId} not found`);
      }

      // @ts-ignore
      const overtimeLogs = await overtimeRepo
        .createQueryBuilder("overtime")
        .where("overtime.id IN (:...ids)", { ids: overtimeIds })
        .getMany();

      if (overtimeLogs.length !== overtimeIds.length) {
        throw new Error("Some overtime IDs not found");
      }

      // Update each overtime with payrollRecordId
      for (const ot of overtimeLogs) {
        ot.payrollRecordId = payrollRecordId;
        // @ts-ignore
        ot.payrollRecord = payrollRecord;
      }

      const saved = [];
      for (const ot of overtimeLogs) {
        // @ts-ignore
        const updated = await updateDb(overtimeRepo, ot);
        saved.push(updated);
      }

      await auditLogger.logUpdate(
        "OvertimeLog",
        overtimeIds,
        { payrollRecordId },
        saved,
        user,
      );

      console.log(
        `Marked ${overtimeIds.length} overtime logs as processed for payroll ${payrollRecordId}`,
      );
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to mark overtime as processed:", error.message);
      throw error;
    }
  }

  /**
   * Get summary statistics for overtime logs
   * @param {Object} options - Filters: employeeId, startDate, endDate
   */
  async getSummary(options = {}) {
    const { overtime: overtimeRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const query = overtimeRepo.createQueryBuilder("overtime");

      // @ts-ignore
      if (options.employeeId) {
        query.andWhere("overtime.employeeId = :employeeId", {
          // @ts-ignore
          employeeId: options.employeeId,
        });
      }
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

      const result = await query
        .select([
          "COUNT(*) as totalLogs",
          "SUM(overtime.hours) as totalHours",
          "SUM(overtime.amount) as totalAmount",
          "AVG(overtime.hours) as averageHours",
        ])
        .getRawOne();

      const statusCounts = await query
        .clone()
        .select("overtime.approvalStatus as status, COUNT(*) as count")
        .groupBy("overtime.approvalStatus")
        .getRawMany();

      return {
        totalLogs: parseInt(result.totalLogs) || 0,
        totalHours: parseFloat(result.totalHours) || 0,
        totalAmount: parseFloat(result.totalAmount) || 0,
        averageHours: parseFloat(result.averageHours) || 0,
        statusCounts,
      };
    } catch (error) {
      console.error("Failed to get overtime summary:", error);
      throw error;
    }
  }

  /**
   * Calculate hours between start and end time
   * @param {string} startTime - HH:MM:SS
   * @param {string} endTime - HH:MM:SS
   * @param {string} date - YYYY-MM-DD (for potential date crossing)
   * @returns {number} Hours
   */
  calculateHours(startTime, endTime, date) {
    // Assume both times are on the same date, unless endTime is less than startTime (crosses midnight)
    const start = new Date(`${date}T${startTime}`);
    let end = new Date(`${date}T${endTime}`);
    if (end < start) {
      // End time is next day
      end.setDate(end.getDate() + 1);
    }
    // @ts-ignore
    const diffMs = end - start;
    const hours = diffMs / (1000 * 60 * 60);
    return parseFloat(hours.toFixed(2));
  }
}

// Singleton instance
const overtimeLogService = new OvertimeLogService();
module.exports = overtimeLogService;

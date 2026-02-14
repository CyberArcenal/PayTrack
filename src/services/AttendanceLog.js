// src/services/AttendanceLogService.js
const { AppDataSource } = require("../main/db/datasource");
const { saveDb, updateDb, removeDb } = require("../utils/dbUtils/dbActions");
const {
  validateAttendanceData,
  calculateHoursWorked,
  calculateOvertime,
} = require("../utils/attendanceUtils");
const auditLogger = require("../utils/auditLogger");

class AttendanceLogService {
  constructor() {
    this.attendanceRepository = null;
    this.employeeRepository = null;
    this.payrollRecordRepository = null;
  }

  async initialize() {
    const AttendanceLog = require("../entities/AttendanceLog");
    const Employee = require("../entities/Employee");
    const PayrollRecord = require("../entities/PayrollRecord");
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.attendanceRepository = AppDataSource.getRepository(AttendanceLog);
    this.employeeRepository = AppDataSource.getRepository(Employee);
    this.payrollRecordRepository = AppDataSource.getRepository(PayrollRecord);
    console.log("AttendanceLogService initialized");
  }

  async getRepositories() {
    if (!this.attendanceRepository) {
      await this.initialize();
    }
    return {
      attendance: this.attendanceRepository,
      employee: this.employeeRepository,
      payrollRecord: this.payrollRecordRepository,
    };
  }

  /**
   * Create a new attendance log
   * @param {Object} data - Attendance data
   * @param {string} user - User performing the action
   */
  async create(data, user = "system") {
    const { attendance: attendanceRepo, employee: employeeRepo } =
      await this.getRepositories();

    try {
      // Validate input
      const validation = await validateAttendanceData(data);
      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }

      const { employeeId, timestamp, source, status, note } = data;

      // Check employee exists
      const employee = await employeeRepo.findOne({
        where: { id: employeeId },
      });
      if (!employee) {
        throw new Error(`Employee with ID ${employeeId} not found`);
      }

      // Prevent duplicate for same employee on same day (date part of timestamp)
      const startOfDay = new Date(timestamp);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(timestamp);
      endOfDay.setHours(23, 59, 59, 999);

      const existing = await attendanceRepo
        .createQueryBuilder("attendance")
        .where("attendance.employeeId = :employeeId", { employeeId })
        .andWhere("attendance.timestamp BETWEEN :start AND :end", {
          start: startOfDay,
          end: endOfDay,
        })
        .getOne();

      if (existing) {
        throw new Error(
          `Attendance already exists for employee ${employeeId} on ${timestamp.toISOString().split("T")[0]}`,
        );
      }

      // Calculate hours worked and overtime (based on status and possibly time)
      let hoursWorked = 8.0; // default
      let overtimeHours = 0.0;
      let lateMinutes = 0;

      if (status === "present" || status === "late") {
        hoursWorked = data.hoursWorked || 8.0;
        overtimeHours = data.overtimeHours || 0.0;
        lateMinutes = data.lateMinutes || 0;
      } else if (status === "half-day") {
        hoursWorked = data.hoursWorked || 4.0;
      } else if (status === "absent") {
        hoursWorked = 0.0;
      }

      // Create attendance record
      const attendance = attendanceRepo.create({
        employeeId,
        timestamp,
        source: source || "manual",
        status,
        hoursWorked,
        overtimeHours,
        lateMinutes,
        note,
        employee,
      });

      // Use saveDb to trigger subscribers
      const saved = await saveDb(attendanceRepo, attendance);

      // Audit log (subscriber might also log, but we keep explicit for consistency)
      await auditLogger.logCreate("AttendanceLog", saved.id, saved, user);

      console.log(
        `Attendance log created: ID ${saved.id} for employee ${employeeId}`,
      );
      return saved;
    } catch (error) {
      console.error("Failed to create attendance log:", error.message);
      throw error;
    }
  }

  /**
   * Update an existing attendance log
   * @param {number} id - Attendance log ID
   * @param {Object} data - Updated data
   * @param {string} user - User performing the action
   */
  async update(id, data, user = "system") {
    const { attendance: attendanceRepo, employee: employeeRepo } =
      await this.getRepositories();

    try {
      const existing = await attendanceRepo.findOne({
        where: { id },
        relations: ["employee"],
      });
      if (!existing) {
        throw new Error(`Attendance log with ID ${id} not found`);
      }

      const oldData = { ...existing };

      // If changing employeeId, validate new employee
      if (data.employeeId && data.employeeId !== existing.employeeId) {
        const newEmployee = await employeeRepo.findOne({
          where: { id: data.employeeId },
        });
        if (!newEmployee) {
          throw new Error(`Employee with ID ${data.employeeId} not found`);
        }
        existing.employee = newEmployee;
        existing.employeeId = data.employeeId;
      }

      // Update fields
      if (data.timestamp) existing.timestamp = data.timestamp;
      if (data.source) existing.source = data.source;
      if (data.status) existing.status = data.status;
      if (data.note !== undefined) existing.note = data.note;

      // Recalculate hours if status changed or hours provided
      if (
        data.status ||
        data.hoursWorked !== undefined ||
        data.overtimeHours !== undefined ||
        data.lateMinutes !== undefined
      ) {
        if (existing.status === "present" || existing.status === "late") {
          existing.hoursWorked =
            data.hoursWorked !== undefined
              ? data.hoursWorked
              : existing.hoursWorked;
          existing.overtimeHours =
            data.overtimeHours !== undefined
              ? data.overtimeHours
              : existing.overtimeHours;
          existing.lateMinutes =
            data.lateMinutes !== undefined
              ? data.lateMinutes
              : existing.lateMinutes;
        } else if (existing.status === "half-day") {
          existing.hoursWorked =
            data.hoursWorked !== undefined ? data.hoursWorked : 4.0;
          existing.overtimeHours = 0;
          existing.lateMinutes = 0;
        } else if (existing.status === "absent") {
          existing.hoursWorked = 0;
          existing.overtimeHours = 0;
          existing.lateMinutes = 0;
        }
      }

      // Use updateDb to trigger subscribers (it fetches old entity internally)
      const saved = await updateDb(attendanceRepo, existing);

      // Audit log
      await auditLogger.logUpdate("AttendanceLog", id, oldData, saved, user);

      console.log(`Attendance log updated: ID ${id}`);
      return saved;
    } catch (error) {
      console.error("Failed to update attendance log:", error.message);
      throw error;
    }
  }

  /**
   * Delete an attendance log
   * @param {number} id - Attendance log ID
   * @param {string} user - User performing the action
   */
  async delete(id, user = "system") {
    const { attendance: attendanceRepo } = await this.getRepositories();

    try {
      const existing = await attendanceRepo.findOne({ where: { id } });
      if (!existing) {
        throw new Error(`Attendance log with ID ${id} not found`);
      }

      const oldData = { ...existing };
      // Use removeDb to trigger subscribers
      await removeDb(attendanceRepo, existing);

      // Audit log
      await auditLogger.logDelete("AttendanceLog", id, oldData, user);

      console.log(`Attendance log deleted: ID ${id}`);
      return { success: true, message: "Attendance log deleted" };
    } catch (error) {
      console.error("Failed to delete attendance log:", error.message);
      throw error;
    }
  }

  /**
   * Find attendance log by ID
   * @param {number} id
   */
  async findById(id) {
    const { attendance: attendanceRepo } = await this.getRepositories();

    try {
      const attendance = await attendanceRepo.findOne({
        where: { id },
        relations: ["employee", "payrollRecord"],
      });
      if (!attendance) {
        throw new Error(`Attendance log with ID ${id} not found`);
      }
      await auditLogger.logView("AttendanceLog", id, "system");
      return attendance;
    } catch (error) {
      console.error("Failed to find attendance log:", error.message);
      throw error;
    }
  }

  /**
   * Find all attendance logs with filters
   * @param {Object} options - { employeeId, startDate, endDate, status, source, page, limit }
   */
  async findAll(options = {}) {
    const { attendance: attendanceRepo } = await this.getRepositories();

    try {
      const query = attendanceRepo
        .createQueryBuilder("attendance")
        .leftJoinAndSelect("attendance.employee", "employee")
        .leftJoinAndSelect("attendance.payrollRecord", "payrollRecord");

      if (options.employeeId) {
        query.andWhere("attendance.employeeId = :employeeId", {
          employeeId: options.employeeId,
        });
      }

      if (options.startDate) {
        const start = new Date(options.startDate);
        start.setHours(0, 0, 0, 0);
        query.andWhere("attendance.timestamp >= :start", { start });
      }

      if (options.endDate) {
        const end = new Date(options.endDate);
        end.setHours(23, 59, 59, 999);
        query.andWhere("attendance.timestamp <= :end", { end });
      }

      if (options.status) {
        query.andWhere("attendance.status = :status", {
          status: options.status,
        });
      }

      if (options.source) {
        query.andWhere("attendance.source = :source", {
          source: options.source,
        });
      }

      query.orderBy("attendance.timestamp", "DESC");

      if (options.page && options.limit) {
        const skip = (options.page - 1) * options.limit;
        query.skip(skip).take(options.limit);
      }

      const attendances = await query.getMany();
      await auditLogger.logView("AttendanceLog", null, "system");
      return attendances;
    } catch (error) {
      console.error("Failed to fetch attendance logs:", error);
      throw error;
    }
  }

  /**
   * Get attendance summary for an employee within a date range
   * @param {number} employeeId
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate - YYYY-MM-DD
   * @returns {Object} Summary statistics
   */
  async getSummary(employeeId, startDate, endDate) {
    const { attendance: attendanceRepo } = await this.getRepositories();

    try {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const logs = await attendanceRepo
        .createQueryBuilder("attendance")
        .where("attendance.employeeId = :employeeId", { employeeId })
        .andWhere("attendance.timestamp BETWEEN :start AND :end", {
          start,
          end,
        })
        .getMany();

      const summary = {
        totalDays: logs.length,
        present: 0,
        absent: 0,
        late: 0,
        halfDay: 0,
        totalHoursWorked: 0,
        totalOvertimeHours: 0,
        totalLateMinutes: 0,
      };

      logs.forEach((log) => {
        summary.totalHoursWorked += parseFloat(log.hoursWorked) || 0;
        summary.totalOvertimeHours += parseFloat(log.overtimeHours) || 0;
        summary.totalLateMinutes += log.lateMinutes || 0;

        switch (log.status) {
          case "present":
            summary.present++;
            break;
          case "absent":
            summary.absent++;
            break;
          case "late":
            summary.late++;
            break;
          case "half-day":
            summary.halfDay++;
            break;
        }
      });

      return summary;
    } catch (error) {
      console.error("Failed to get attendance summary:", error);
      throw error;
    }
  }

  /**
   * Mark attendance logs as processed for a payroll record
   * @param {number[]} attendanceIds
   * @param {number} payrollRecordId
   * @param {string} user
   */
  async markAsProcessed(attendanceIds, payrollRecordId, user = "system") {
    const { attendance: attendanceRepo, payrollRecord: payrollRepo } =
      await this.getRepositories();

    try {
      const payrollRecord = await payrollRepo.findOne({
        where: { id: payrollRecordId },
      });
      if (!payrollRecord) {
        throw new Error(`Payroll record with ID ${payrollRecordId} not found`);
      }

      const attendances = await attendanceRepo
        .createQueryBuilder("attendance")
        .where("attendance.id IN (:...ids)", { ids: attendanceIds })
        .getMany();

      if (attendances.length !== attendanceIds.length) {
        throw new Error("Some attendance IDs not found");
      }

      // Update each attendance with payrollRecordId
      for (const att of attendances) {
        att.payrollRecordId = payrollRecordId;
        att.payrollRecord = payrollRecord;
      }

      // Use saveDb for each or bulk? For simplicity, loop with updateDb
      const saved = [];
      for (const att of attendances) {
        const updated = await updateDb(attendanceRepo, att);
        saved.push(updated);
      }

      // Audit log for each (or bulk)
      await auditLogger.logUpdate(
        "AttendanceLog",
        attendanceIds,
        { payrollRecordId },
        saved,
        user,
      );

      console.log(
        `Marked ${attendanceIds.length} attendance logs as processed for payroll ${payrollRecordId}`,
      );
      return saved;
    } catch (error) {
      console.error("Failed to mark attendance as processed:", error.message);
      throw error;
    }
  }
}

// Singleton instance
const attendanceLogService = new AttendanceLogService();
module.exports = attendanceLogService;

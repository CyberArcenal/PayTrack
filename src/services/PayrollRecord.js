// src/services/PayrollRecordService.js
//@ts-check
const { AppDataSource } = require("../main/db/datasource");
const { saveDb, updateDb, removeDb } = require("../utils/dbUtils/dbActions");

const auditLogger = require("../utils/auditLogger");
const PayrollRecord = require("../entities/PayrollRecord");
const Employee = require("../entities/Employee");
const PayrollPeriod = require("../entities/PayrollPeriod");
const AttendanceLog = require("../entities/AttendanceLog");
const OvertimeLog = require("../entities/OvertimeLog");
const Deduction = require("../entities/Deduction");
const {
  validatePayrollRecordData,
  calculateGrossPay,
  calculateDeductionsTotal,
  calculateNetPay,
} = require("../utils/payrollRecordUtils");
const payrollPeriodService = require("./PayrollPeriod");

class PayrollRecordService {
  constructor() {
    this.payrollRepository = null;
    this.employeeRepository = null;
    this.periodRepository = null;
    this.attendanceRepository = null;
    this.overtimeRepository = null;
    this.deductionRepository = null;
  }

  async initialize() {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.payrollRepository = AppDataSource.getRepository(PayrollRecord);
    this.employeeRepository = AppDataSource.getRepository(Employee);
    this.periodRepository = AppDataSource.getRepository(PayrollPeriod);
    this.attendanceRepository = AppDataSource.getRepository(AttendanceLog);
    this.overtimeRepository = AppDataSource.getRepository(OvertimeLog);
    this.deductionRepository = AppDataSource.getRepository(Deduction);
    console.log("PayrollRecordService initialized");
  }

  async getRepositories() {
    if (!this.payrollRepository) {
      await this.initialize();
    }
    return {
      payroll: this.payrollRepository,
      employee: this.employeeRepository,
      period: this.periodRepository,
      attendance: this.attendanceRepository,
      overtime: this.overtimeRepository,
      deduction: this.deductionRepository,
    };
  }

  /**
   * Create a new payroll record (manually, without auto-computation)
   * Usually you'd use compute() instead, but we keep this for flexibility.
   * @param {Object} data - Payroll record data
   * @param {string} user - User performing the action
   */
  async create(data, user = "system") {
    const {
      payroll: payrollRepo,
      employee: employeeRepo,
      period: periodRepo,
    } = await this.getRepositories();

    try {
      // Validate input
      const validation = await validatePayrollRecordData(data, {
        employeeRepo,
        periodRepo,
        payrollRepo,
      });
      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }

      // @ts-ignore
      const { employeeId, periodId } = data;

      // Check for existing record to avoid duplicate
      // @ts-ignore
      const existing = await payrollRepo.findOne({
        where: { employeeId, periodId },
      });
      if (existing) {
        throw new Error(
          `Payroll record already exists for employee ${employeeId} in period ${periodId}`,
        );
      }

      // Create record
      // @ts-ignore
      const record = payrollRepo.create({
        ...data,
        // @ts-ignore
        paymentStatus: data.paymentStatus || "unpaid",
        // @ts-ignore
        computedAt: data.computedAt || new Date(),
      });

      // @ts-ignore
      const saved = await saveDb(payrollRepo, record);

      // Audit log
      await auditLogger.logCreate("PayrollRecord", saved.id, saved, user);

      console.log(
        `Payroll record created: ID ${saved.id} for employee ${employeeId} in period ${periodId}`,
      );
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to create payroll record:", error.message);
      throw error;
    }
  }

  /**
   * Compute payroll for an employee in a given period based on attendance, overtime, etc.
   * @param {number} employeeId
   * @param {number} periodId
   * @param {string} user
   * @returns {Promise<Object>} The created/updated payroll record
   */
  async compute(employeeId, periodId, user = "system") {
    const {
      payroll: payrollRepo,
      employee: employeeRepo,
      period: periodRepo,
      attendance: attendanceRepo,
      overtime: overtimeRepo,
      // @ts-ignore
      deduction: deductionRepo,
    } = await this.getRepositories();

    try {
      // Validate employee and period exist
      // @ts-ignore
      const employee = await employeeRepo.findOne({
        where: { id: employeeId },
      });
      if (!employee) throw new Error(`Employee ${employeeId} not found`);

      // @ts-ignore
      const period = await periodRepo.findOne({ where: { id: periodId } });
      if (!period) throw new Error(`Period ${periodId} not found`);

      // Get attendance logs within period (date range)
      // @ts-ignore
      const start = new Date(period.startDate);
      start.setHours(0, 0, 0, 0);
      // @ts-ignore
      const end = new Date(period.endDate);
      end.setHours(23, 59, 59, 999);

      // @ts-ignore
      const attendances = await attendanceRepo
        .createQueryBuilder("attendance")
        .where("attendance.employeeId = :employeeId", { employeeId })
        .andWhere("attendance.timestamp BETWEEN :start AND :end", {
          start,
          end,
        })
        .getMany();

      // Summarize attendance
      let daysPresent = 0,
        daysAbsent = 0,
        daysLate = 0,
        daysHalfDay = 0;
      let totalHoursWorked = 0,
        totalOvertimeHours = 0,
        totalLateMinutes = 0;

      attendances.forEach((a) => {
        // @ts-ignore
        totalHoursWorked += parseFloat(a.hoursWorked) || 0;
        // @ts-ignore
        totalOvertimeHours += parseFloat(a.overtimeHours) || 0;
        // @ts-ignore
        totalLateMinutes += a.lateMinutes || 0;

        switch (a.status) {
          case "present":
            daysPresent++;
            break;
          case "absent":
            daysAbsent++;
            break;
          case "late":
            daysLate++;
            break;
          case "half-day":
            daysHalfDay++;
            break;
        }
      });

      // Get overtime logs that are approved and not yet linked to a payroll record
      // @ts-ignore
      const overtimeLogs = await overtimeRepo
        .createQueryBuilder("overtime")
        .where("overtime.employeeId = :employeeId", { employeeId })
        .andWhere("overtime.date BETWEEN :start AND :end", {
          start: period.startDate,
          end: period.endDate,
        })
        .andWhere("overtime.approvalStatus = 'approved'")
        .andWhere("overtime.payrollRecordId IS NULL")
        .getMany();

      // Calculate overtime totals
      let overtimeHours = 0,
        overtimePay = 0;
      overtimeLogs.forEach((ot) => {
        // @ts-ignore
        overtimeHours += parseFloat(ot.hours) || 0;
        // @ts-ignore
        overtimePay += parseFloat(ot.amount) || 0;
      });

      // Basic pay: daysPresent * dailyRate (or could be based on hours)
      // We'll assume dailyRate is set, and daysPresent includes full days only.
      // For half-days, we could add 0.5 day. For simplicity, treat half-day as 0.5 day.
      const effectiveDays = daysPresent + daysHalfDay * 0.5;
      // @ts-ignore
      const basicPay = effectiveDays * parseFloat(employee.dailyRate || 0);

      // For now, other earnings are zero; can be extended.
      const holidayPay = 0,
        nightDiffPay = 0,
        allowance = 0,
        bonus = 0;
      const grossPay = calculateGrossPay(
        basicPay,
        overtimePay,
        holidayPay,
        nightDiffPay,
        allowance,
        bonus,
      );

      // Get deductions (if any) – maybe from deduction table linked to employee? But Deduction is linked to payroll record.
      // For new compute, we'll fetch recurring deductions that should be applied.
      // This is a simplification: you might have a separate employee-level deductions table.
      // We'll just set totals to zero for now, and later allow adding deductions via separate methods.
      const sssDeduction = 0,
        philhealthDeduction = 0,
        pagibigDeduction = 0,
        taxDeduction = 0,
        loanDeduction = 0,
        advanceDeduction = 0,
        otherDeductions = 0;
      const deductionsTotal = calculateDeductionsTotal(
        sssDeduction,
        philhealthDeduction,
        pagibigDeduction,
        taxDeduction,
        loanDeduction,
        advanceDeduction,
        otherDeductions,
      );

      const netPay = calculateNetPay(grossPay, deductionsTotal);

      // Check if record already exists; if so, update it, else create new.
      // @ts-ignore
      let record = await payrollRepo.findOne({
        where: { employeeId, periodId },
      });
      const isNew = !record;
      if (isNew) {
        // @ts-ignore
        record = payrollRepo.create({
          employeeId,
          periodId,
          daysPresent,
          daysAbsent,
          daysLate,
          daysHalfDay,
          basicPay,
          overtimeHours,
          overtimePay,
          holidayPay,
          nightDiffPay,
          allowance,
          bonus,
          grossPay,
          sssDeduction,
          philhealthDeduction,
          pagibigDeduction,
          taxDeduction,
          loanDeduction,
          advanceDeduction,
          otherDeductions,
          deductionsTotal,
          netPay,
          computedAt: new Date(),
          paymentStatus: "unpaid",
        });
      } else {
        // Update existing record
        // @ts-ignore
        Object.assign(record, {
          daysPresent,
          daysAbsent,
          daysLate,
          daysHalfDay,
          basicPay,
          overtimeHours,
          overtimePay,
          holidayPay,
          nightDiffPay,
          allowance,
          bonus,
          grossPay,
          sssDeduction,
          philhealthDeduction,
          pagibigDeduction,
          taxDeduction,
          loanDeduction,
          advanceDeduction,
          otherDeductions,
          deductionsTotal,
          netPay,
          computedAt: new Date(),
        });
      }

      const saved = isNew
        // @ts-ignore
        ? await saveDb(payrollRepo, record)
        // @ts-ignore
        : await updateDb(payrollRepo, record);

      // Link overtime logs to this payroll record
      if (overtimeLogs.length > 0) {
        for (const ot of overtimeLogs) {
          ot.payrollRecordId = saved.id;
          // @ts-ignore
          await updateDb(overtimeRepo, ot);
        }
      }

      // Link attendance logs? We can add payrollRecordId to attendance as well if needed.
      // (AttendanceLog has payrollRecordId field, so we could update them too.)
      if (attendances.length > 0) {
        for (const att of attendances) {
          // @ts-ignore
          if (!att.payrollRecordId) {
            // @ts-ignore
            att.payrollRecordId = saved.id;
            // @ts-ignore
            await updateDb(attendanceRepo, att);
          }
        }
      }

      // Audit log
      if (isNew) {
        await auditLogger.logCreate("PayrollRecord", saved.id, saved, user);
      } else {
        await auditLogger.logUpdate("PayrollRecord", saved.id, {}, saved, user); // previous data not captured here, but you could fetch old before update
      }

      console.log(
        `Payroll computed for employee ${employeeId} in period ${periodId}: ID ${saved.id}`,
      );
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to compute payroll:", error.message);
      throw error;
    }
  }

  /**
   * Batch compute payroll for all employees in a period
   * @param {number} periodId
   * @param {string} user
   */
  async computeBatch(periodId, user = "system") {
    const { employee: employeeRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const employees = await employeeRepo.find({
        where: { status: "active" },
      });
      const results = [];
      for (const emp of employees) {
        try {
          // @ts-ignore
          const record = await this.compute(emp.id, periodId, user);
          results.push(record);
        } catch (err) {
          console.error(
            `Failed to compute for employee ${emp.id}:`,
            // @ts-ignore
            err.message,
          );
          // Continue with others
        }
      }
      // After batch, refresh period totals
      // @ts-ignore
      const { period: periodRepo } = await this.getRepositories();
      await payrollPeriodService.refreshTotals(periodId, user);

      return results;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to compute batch payroll:", error.message);
      throw error;
    }
  }

  /**
   * Update an existing payroll record (manual adjustments)
   * @param {number} id
   * @param {Object} data
   * @param {string} user
   */
  async update(id, data, user = "system") {
    const {
      payroll: payrollRepo,
      employee: employeeRepo,
      period: periodRepo,
    } = await this.getRepositories();

    try {
      // @ts-ignore
      const existing = await payrollRepo.findOne({
        where: { id },
        relations: ["employee", "period"],
      });
      if (!existing) {
        throw new Error(`Payroll record with ID ${id} not found`);
      }
      if (existing.paymentStatus === "paid") {
        throw new Error("Cannot update a paid payroll record");
      }

      const oldData = { ...existing };

      // Validate updated data (e.g., ensure employee/period exist if changed)
      // @ts-ignore
      if (data.employeeId || data.periodId) {
        const validation = await validatePayrollRecordData(
          { ...existing, ...data },
          { employeeRepo, periodRepo, payrollRepo, excludeId: id },
        );
        if (!validation.valid) {
          throw new Error(validation.errors.join(", "));
        }
      }

      // Update fields
      Object.assign(existing, data);

      // Recalculate gross/net if earnings/deductions changed
      if (
        // @ts-ignore
        data.basicPay !== undefined ||
        // @ts-ignore
        data.overtimePay !== undefined ||
        // @ts-ignore
        data.holidayPay !== undefined ||
        // @ts-ignore
        data.nightDiffPay !== undefined ||
        // @ts-ignore
        data.allowance !== undefined ||
        // @ts-ignore
        data.bonus !== undefined
      ) {
        existing.grossPay = calculateGrossPay(
          existing.basicPay,
          existing.overtimePay,
          existing.holidayPay,
          existing.nightDiffPay,
          existing.allowance,
          existing.bonus,
        );
      }
      if (
        // @ts-ignore
        data.sssDeduction !== undefined ||
        // @ts-ignore
        data.philhealthDeduction !== undefined ||
        // @ts-ignore
        data.pagibigDeduction !== undefined ||
        // @ts-ignore
        data.taxDeduction !== undefined ||
        // @ts-ignore
        data.loanDeduction !== undefined ||
        // @ts-ignore
        data.advanceDeduction !== undefined ||
        // @ts-ignore
        data.otherDeductions !== undefined
      ) {
        existing.deductionsTotal = calculateDeductionsTotal(
          existing.sssDeduction,
          existing.philhealthDeduction,
          existing.pagibigDeduction,
          existing.taxDeduction,
          existing.loanDeduction,
          existing.advanceDeduction,
          existing.otherDeductions,
        );
        existing.netPay = calculateNetPay(
          existing.grossPay,
          existing.deductionsTotal,
        );
      }

      // @ts-ignore
      const saved = await updateDb(payrollRepo, existing);

      await auditLogger.logUpdate("PayrollRecord", id, oldData, saved, user);

      console.log(`Payroll record updated: ID ${id}`);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to update payroll record:", error.message);
      throw error;
    }
  }

  /**
   * Delete a payroll record (only if unpaid and not processed)
   * @param {number} id
   * @param {string} user
   */
  async delete(id, user = "system") {
    const { payroll: payrollRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const existing = await payrollRepo.findOne({ where: { id } });
      if (!existing) {
        throw new Error(`Payroll record with ID ${id} not found`);
      }
      if (existing.paymentStatus === "paid") {
        throw new Error("Cannot delete a paid payroll record");
      }

      // Optionally unlink attendance/overtime logs? The relation is set null on delete (SET NULL).
      // We'll just delete the record.

      const oldData = { ...existing };
      // @ts-ignore
      await removeDb(payrollRepo, existing);

      await auditLogger.logDelete("PayrollRecord", id, oldData, user);

      console.log(`Payroll record deleted: ID ${id}`);
      return { success: true, message: "Payroll record deleted" };
    } catch (error) {
      // @ts-ignore
      console.error("Failed to delete payroll record:", error.message);
      throw error;
    }
  }

  /**
   * Find payroll record by ID
   * @param {number} id
   */
  async findById(id) {
    const { payroll: payrollRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const record = await payrollRepo.findOne({
        where: { id },
        relations: [
          "employee",
          "period",
          "deductions",
          "overtimeLogs",
          "attendanceLogs",
        ],
      });
      if (!record) {
        throw new Error(`Payroll record with ID ${id} not found`);
      }
      // @ts-ignore
      await auditLogger.logView("PayrollRecord", id, "system");
      return record;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to find payroll record:", error.message);
      throw error;
    }
  }

  /**
   * Find all payroll records with filters
   * @param {Object} options - { employeeId, periodId, paymentStatus, startDate, endDate, page, limit }
   */
  async findAll(options = {}) {
    const { payroll: payrollRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const query = payrollRepo
        .createQueryBuilder("payroll")
        .leftJoinAndSelect("payroll.employee", "employee")
        .leftJoinAndSelect("payroll.period", "period");

      // @ts-ignore
      if (options.employeeId) {
        query.andWhere("payroll.employeeId = :employeeId", {
          // @ts-ignore
          employeeId: options.employeeId,
        });
      }
      // @ts-ignore
      if (options.periodId) {
        query.andWhere("payroll.periodId = :periodId", {
          // @ts-ignore
          periodId: options.periodId,
        });
      }
      // @ts-ignore
      if (options.paymentStatus) {
        query.andWhere("payroll.paymentStatus = :paymentStatus", {
          // @ts-ignore
          paymentStatus: options.paymentStatus,
        });
      }
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

      query.orderBy("period.endDate", "DESC");

      // @ts-ignore
      if (options.page && options.limit) {
        // @ts-ignore
        const skip = (options.page - 1) * options.limit;
        // @ts-ignore
        query.skip(skip).take(options.limit);
      }

      const records = await query.getMany();
      await auditLogger.logView("PayrollRecord", null, "system");
      return records;
    } catch (error) {
      console.error("Failed to fetch payroll records:", error);
      throw error;
    }
  }

  /**
   * Mark a payroll record as paid
   * @param {number} id
   * @param {Object} paymentData - { paymentMethod, paymentReference, paidAt }
   * @param {string} user
   */
  async markAsPaid(id, paymentData = {}, user = "system") {
    const { payroll: payrollRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const existing = await payrollRepo.findOne({ where: { id } });
      if (!existing) {
        throw new Error(`Payroll record with ID ${id} not found`);
      }
      if (existing.paymentStatus === "paid") {
        throw new Error("Payroll record is already paid");
      }

      const oldData = { ...existing };
      existing.paymentStatus = "paid";
      // @ts-ignore
      existing.paidAt = paymentData.paidAt || new Date();
      // @ts-ignore
      if (paymentData.paymentMethod)
        // @ts-ignore
        existing.paymentMethod = paymentData.paymentMethod;
      // @ts-ignore
      if (paymentData.paymentReference)
        // @ts-ignore
        existing.paymentReference = paymentData.paymentReference;

      // @ts-ignore
      const saved = await updateDb(payrollRepo, existing);

      await auditLogger.logUpdate("PayrollRecord", id, oldData, saved, user);

      console.log(`Payroll record marked as paid: ID ${id}`);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to mark payroll as paid:", error.message);
      throw error;
    }
  }

  /**
   * Add a deduction to this payroll record (creates a Deduction entry)
   * @param {number} payrollRecordId
   * @param {Object} deductionData - { type, code, description, amount, percentage, isRecurring, appliedDate, note }
   * @param {string} user
   */
  async addDeduction(payrollRecordId, deductionData, user = "system") {
    const { payroll: payrollRepo, deduction: deductionRepo } =
      await this.getRepositories();

    try {
      // @ts-ignore
      const payroll = await payrollRepo.findOne({
        where: { id: payrollRecordId },
      });
      if (!payroll) {
        throw new Error(`Payroll record with ID ${payrollRecordId} not found`);
      }
      if (payroll.paymentStatus === "paid") {
        throw new Error("Cannot add deduction to a paid payroll record");
      }

      // Create deduction linked to payroll
      // @ts-ignore
      const deduction = deductionRepo.create({
        ...deductionData,
        payrollRecordId,
      });
      // @ts-ignore
      const savedDeduction = await saveDb(deductionRepo, deduction);

      // Update payroll totals
      const oldData = { ...payroll };
      // Recalculate deductionsTotal and netPay
      // We'll use the same calculation functions; need to sum all deductions including this new one.
      // @ts-ignore
      const allDeductions = await deductionRepo.find({
        where: { payrollRecordId },
      });
      const sss = allDeductions
        .filter((d) => d.type === "sss")
        // @ts-ignore
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const philhealth = allDeductions
        .filter((d) => d.type === "philhealth")
        // @ts-ignore
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const pagibig = allDeductions
        .filter((d) => d.type === "pag-ibig")
        // @ts-ignore
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const tax = allDeductions
        .filter((d) => d.type === "tax")
        // @ts-ignore
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const loan = allDeductions
        .filter((d) => d.type === "loan")
        // @ts-ignore
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const advance = allDeductions
        .filter((d) => d.type === "advance")
        // @ts-ignore
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const other = allDeductions
        .filter((d) => d.type === "other")
        // @ts-ignore
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);

      payroll.sssDeduction = sss;
      payroll.philhealthDeduction = philhealth;
      payroll.pagibigDeduction = pagibig;
      payroll.taxDeduction = tax;
      payroll.loanDeduction = loan;
      payroll.advanceDeduction = advance;
      payroll.otherDeductions = other;

      payroll.deductionsTotal = calculateDeductionsTotal(
        sss,
        philhealth,
        pagibig,
        tax,
        loan,
        advance,
        other,
      );
      payroll.netPay = calculateNetPay(
        payroll.grossPay,
        payroll.deductionsTotal,
      );

      // @ts-ignore
      const updatedPayroll = await updateDb(payrollRepo, payroll);

      await auditLogger.logUpdate(
        "PayrollRecord",
        payrollRecordId,
        oldData,
        updatedPayroll,
        user,
      );

      return { deduction: savedDeduction, payroll: updatedPayroll };
    } catch (error) {
      console.error(
        "Failed to add deduction to payroll record:",
        // @ts-ignore
        error.message,
      );
      throw error;
    }
  }

  /**
   * Remove a deduction from payroll (deletes deduction entry and recalculates totals)
   * @param {number} deductionId
   * @param {string} user
   */
  async removeDeduction(deductionId, user = "system") {
    const { deduction: deductionRepo, payroll: payrollRepo } =
      await this.getRepositories();

    try {
      // @ts-ignore
      const deduction = await deductionRepo.findOne({
        where: { id: deductionId },
        relations: ["payrollRecord"],
      });
      if (!deduction) {
        throw new Error(`Deduction with ID ${deductionId} not found`);
      }
      // @ts-ignore
      const payroll = deduction.payrollRecord;
      if (!payroll) {
        throw new Error("Deduction is not linked to a payroll record");
      }
      if (payroll.paymentStatus === "paid") {
        throw new Error("Cannot remove deduction from a paid payroll record");
      }

      const oldPayrollData = { ...payroll };
      // @ts-ignore
      await removeDb(deductionRepo, deduction);

      // Recalculate payroll totals
      // @ts-ignore
      const allDeductions = await deductionRepo.find({
        where: { payrollRecordId: payroll.id },
      });
      const sss = allDeductions
        .filter((d) => d.type === "sss")
        // @ts-ignore
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const philhealth = allDeductions
        .filter((d) => d.type === "philhealth")
        // @ts-ignore
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const pagibig = allDeductions
        .filter((d) => d.type === "pag-ibig")
        // @ts-ignore
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const tax = allDeductions
        .filter((d) => d.type === "tax")
        // @ts-ignore
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const loan = allDeductions
        .filter((d) => d.type === "loan")
        // @ts-ignore
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const advance = allDeductions
        .filter((d) => d.type === "advance")
        // @ts-ignore
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);
      const other = allDeductions
        .filter((d) => d.type === "other")
        // @ts-ignore
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);

      payroll.sssDeduction = sss;
      payroll.philhealthDeduction = philhealth;
      payroll.pagibigDeduction = pagibig;
      payroll.taxDeduction = tax;
      payroll.loanDeduction = loan;
      payroll.advanceDeduction = advance;
      payroll.otherDeductions = other;

      payroll.deductionsTotal = calculateDeductionsTotal(
        sss,
        philhealth,
        pagibig,
        tax,
        loan,
        advance,
        other,
      );
      payroll.netPay = calculateNetPay(
        payroll.grossPay,
        payroll.deductionsTotal,
      );

      // @ts-ignore
      const updatedPayroll = await updateDb(payrollRepo, payroll);

      await auditLogger.logUpdate(
        "PayrollRecord",
        payroll.id,
        oldPayrollData,
        updatedPayroll,
        user,
      );

      return updatedPayroll;
    } catch (error) {
      console.error(
        "Failed to remove deduction from payroll record:",
        // @ts-ignore
        error.message,
      );
      throw error;
    }
  }

  /**
   * Get summary statistics for payroll records (overall totals)
   * @param {Object} filters - periodId, date range, etc.
   */
  async getSummary(filters = {}) {
    const { payroll: payrollRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const query = payrollRepo.createQueryBuilder("payroll");

      // @ts-ignore
      if (filters.periodId) {
        query.andWhere("payroll.periodId = :periodId", {
          // @ts-ignore
          periodId: filters.periodId,
        });
      }
      // @ts-ignore
      if (filters.startDate) {
        query.andWhere("payroll.computedAt >= :startDate", {
          // @ts-ignore
          startDate: filters.startDate,
        });
      }
      // @ts-ignore
      if (filters.endDate) {
        query.andWhere("payroll.computedAt <= :endDate", {
          // @ts-ignore
          endDate: filters.endDate,
        });
      }

      const result = await query
        .select([
          "SUM(payroll.grossPay) as totalGrossPay",
          "SUM(payroll.deductionsTotal) as totalDeductions",
          "SUM(payroll.netPay) as totalNetPay",
          "COUNT(payroll.id) as totalRecords",
        ])
        .getRawOne();

      const statusCounts = await query
        .clone()
        .select("payroll.paymentStatus as status, COUNT(*) as count")
        .groupBy("payroll.paymentStatus")
        .getRawMany();

      return {
        totalRecords: parseInt(result.totalRecords) || 0,
        totalGrossPay: parseFloat(result.totalGrossPay) || 0,
        totalDeductions: parseFloat(result.totalDeductions) || 0,
        totalNetPay: parseFloat(result.totalNetPay) || 0,
        statusCounts,
      };
    } catch (error) {
      console.error("Failed to get payroll summary:", error);
      throw error;
    }
  }
}

// Singleton instance
const payrollRecordService = new PayrollRecordService();
module.exports = payrollRecordService;

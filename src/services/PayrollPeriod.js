// src/services/PayrollPeriodService.js
//@ts-check
const { AppDataSource } = require("../main/db/datasource");
const { saveDb, updateDb, removeDb } = require("../utils/dbUtils/dbActions");
const auditLogger = require("../utils/auditLogger");
const PayrollPeriod = require("../entities/PayrollPeriod");
const PayrollRecord = require("../entities/PayrollRecord");
const {
  validatePayrollPeriodData,
  generatePeriodName,
} = require("../utils/payrollPeriodUtils");

class PayrollPeriodService {
  constructor() {
    this.periodRepository = null;
    this.payrollRecordRepository = null;
  }

  async initialize() {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.periodRepository = AppDataSource.getRepository(PayrollPeriod);
    this.payrollRecordRepository = AppDataSource.getRepository(PayrollRecord);
    console.log("PayrollPeriodService initialized");
  }

  async getRepositories() {
    if (!this.periodRepository) {
      await this.initialize();
    }
    return {
      period: this.periodRepository,
      payrollRecord: this.payrollRecordRepository,
    };
  }

  /**
   * Create a new payroll period
   * @param {Object} data - Payroll period data
   * @param {string} user - User performing the action
   */
  async create(data, user = "system") {
    const { period: periodRepo } = await this.getRepositories();

    try {
      // Validate input
      // @ts-ignore
      const validation = await validatePayrollPeriodData(data, periodRepo);
      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }

      // Generate name if not provided
      // @ts-ignore
      if (!data.name) {
        // @ts-ignore
        data.name = generatePeriodName(
          // @ts-ignore
          data.startDate,
          // @ts-ignore
          data.endDate,
          // @ts-ignore
          data.periodType,
        );
      }

      // Create period
      // @ts-ignore
      const period = periodRepo.create({
        ...data,
        // @ts-ignore
        status: data.status || "open",
        totalEmployees: 0,
        totalGrossPay: "0.00",
        totalDeductions: "0.00",
        totalNetPay: "0.00",
      });

      // @ts-ignore
      const saved = await saveDb(periodRepo, period);

      // Audit log
      await auditLogger.logCreate("PayrollPeriod", saved.id, saved, user);

      console.log(`Payroll period created: ID ${saved.id} (${saved.name})`);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to create payroll period:", error.message);
      throw error;
    }
  }

  /**
   * Update an existing payroll period
   * @param {number} id - Period ID
   * @param {Object} data - Updated data
   * @param {string} user - User performing the action
   */
  async update(id, data, user = "system") {
    const { period: periodRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const existing = await periodRepo.findOne({ where: { id } });
      if (!existing) {
        throw new Error(`Payroll period with ID ${id} not found`);
      }

      // If period is locked or closed, prevent updates unless forced? We'll check status.
      if (existing.status === "locked" || existing.status === "closed") {
        throw new Error(`Cannot update a ${existing.status} payroll period`);
      }

      const oldData = { ...existing };

      // Validate updated data
      const validation = await validatePayrollPeriodData(
        { ...existing, ...data },
        // @ts-ignore
        periodRepo,
        id,
      );
      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }

      // Update fields
      Object.assign(existing, data);

      // @ts-ignore
      const saved = await updateDb(periodRepo, existing);

      await auditLogger.logUpdate("PayrollPeriod", id, oldData, saved, user);

      console.log(`Payroll period updated: ID ${id}`);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to update payroll period:", error.message);
      throw error;
    }
  }

  /**
   * Delete a payroll period (only if no payroll records linked)
   * @param {number} id - Period ID
   * @param {string} user - User performing the action
   */
  async delete(id, user = "system") {
    const { period: periodRepo, payrollRecord: payrollRepo } =
      await this.getRepositories();

    try {
      // @ts-ignore
      const existing = await periodRepo.findOne({ where: { id } });
      if (!existing) {
        throw new Error(`Payroll period with ID ${id} not found`);
      }

      // Check if there are any payroll records linked to this period
      // @ts-ignore
      const count = await payrollRepo.count({ where: { periodId: id } });
      if (count > 0) {
        throw new Error(
          `Cannot delete period with ${count} existing payroll records`,
        );
      }

      const oldData = { ...existing };
      // @ts-ignore
      await removeDb(periodRepo, existing);

      await auditLogger.logDelete("PayrollPeriod", id, oldData, user);

      console.log(`Payroll period deleted: ID ${id}`);
      return { success: true, message: "Payroll period deleted" };
    } catch (error) {
      // @ts-ignore
      console.error("Failed to delete payroll period:", error.message);
      throw error;
    }
  }

  /**
   * Find payroll period by ID
   * @param {number} id
   */
  async findById(id) {
    const { period: periodRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const period = await periodRepo.findOne({ where: { id } });
      if (!period) {
        throw new Error(`Payroll period with ID ${id} not found`);
      }
      // @ts-ignore
      await auditLogger.logView("PayrollPeriod", id, "system");
      return period;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to find payroll period:", error.message);
      throw error;
    }
  }

  /**
   * Find all payroll periods with filters
   * @param {Object} options - { status, periodType, startDate, endDate, payDate, page, limit }
   */
  async findAll(options = {}) {
    const { period: periodRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const query = periodRepo.createQueryBuilder("period");

      // @ts-ignore
      if (options.status) {
        // @ts-ignore
        query.andWhere("period.status = :status", { status: options.status });
      }

      // @ts-ignore
      if (options.periodType) {
        query.andWhere("period.periodType = :periodType", {
          // @ts-ignore
          periodType: options.periodType,
        });
      }

      // @ts-ignore
      if (options.startDate) {
        query.andWhere("period.startDate >= :startDate", {
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
      if (options.payDate) {
        query.andWhere("period.payDate = :payDate", {
          // @ts-ignore
          payDate: options.payDate,
        });
      }

      query.orderBy("period.startDate", "DESC");

      // @ts-ignore
      if (options.page && options.limit) {
        // @ts-ignore
        const skip = (options.page - 1) * options.limit;
        // @ts-ignore
        query.skip(skip).take(options.limit);
      }

      const periods = await query.getMany();
      await auditLogger.logView("PayrollPeriod", null, "system");
      return periods;
    } catch (error) {
      console.error("Failed to fetch payroll periods:", error);
      throw error;
    }
  }

  /**
   * Get current active/open payroll period (if any)
   */
  async getCurrentPeriod() {
    const { period: periodRepo } = await this.getRepositories();

    try {
      const today = new Date().toISOString().split("T")[0];
      // @ts-ignore
      const period = await periodRepo
        .createQueryBuilder("period")
        .where("period.startDate <= :today", { today })
        .andWhere("period.endDate >= :today", { today })
        .andWhere("period.status IN ('open', 'processing')")
        .orderBy("period.startDate", "DESC")
        .getOne();

      return period;
    } catch (error) {
      console.error("Failed to get current period:", error);
      throw error;
    }
  }

  /**
   * Get the next period (based on last period's end date and period type)
   * This is a helper to suggest next period dates.
   */
  async getNextPeriod(periodType = "semi-monthly") {
    const { period: periodRepo } = await this.getRepositories();

    try {
      // Get the latest period
      // @ts-ignore
      const latest = await periodRepo
        .createQueryBuilder("period")
        .orderBy("period.endDate", "DESC")
        .getOne();

      let startDate, endDate, payDate;

      if (!latest) {
        // No previous period, default to current month's first half
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month, 15);
        payDate = new Date(year, month, 20); // example
      } else {
        // Calculate next based on periodType
        // @ts-ignore
        const lastEnd = new Date(latest.endDate);
        startDate = new Date(lastEnd);
        startDate.setDate(lastEnd.getDate() + 1); // day after endDate

        if (periodType === "weekly") {
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          payDate = new Date(endDate);
          payDate.setDate(endDate.getDate() + 3); // example: pay on Friday
        } else if (periodType === "bi-weekly") {
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 13);
          payDate = new Date(endDate);
          payDate.setDate(endDate.getDate() + 3);
        } else if (periodType === "semi-monthly") {
          // Rough: first half or second half
          const day = startDate.getDate();
          if (day <= 15) {
            endDate = new Date(
              startDate.getFullYear(),
              startDate.getMonth(),
              15,
            );
          } else {
            endDate = new Date(
              startDate.getFullYear(),
              startDate.getMonth() + 1,
              0,
            ); // last day
          }
          payDate = new Date(endDate);
          payDate.setDate(endDate.getDate() + 5); // example
        } else if (periodType === "monthly") {
          endDate = new Date(
            startDate.getFullYear(),
            startDate.getMonth() + 1,
            0,
          );
          payDate = new Date(endDate);
          payDate.setDate(endDate.getDate() + 5);
        }
      }

      return {
        periodType,
        startDate: startDate.toISOString().split("T")[0],
        // @ts-ignore
        endDate: endDate.toISOString().split("T")[0],
        // @ts-ignore
        payDate: payDate.toISOString().split("T")[0],
        // @ts-ignore
        name: generatePeriodName(startDate, endDate, periodType),
        workingDays: 10, // placeholder, could be calculated based on holidays/weekends
      };
    } catch (error) {
      console.error("Failed to get next period:", error);
      throw error;
    }
  }

  /**
   * Lock a period (prevent further changes)
   * @param {number} id
   * @param {string} user
   */
  async lockPeriod(id, user = "system") {
    const { period: periodRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const existing = await periodRepo.findOne({ where: { id } });
      if (!existing) {
        throw new Error(`Payroll period with ID ${id} not found`);
      }
      if (existing.status === "closed") {
        throw new Error("Cannot lock a closed period");
      }
      if (existing.status === "locked") {
        return existing; // already locked
      }

      const oldData = { ...existing };
      existing.status = "locked";
      existing.lockedAt = new Date();

      // @ts-ignore
      const saved = await updateDb(periodRepo, existing);
      await auditLogger.logUpdate("PayrollPeriod", id, oldData, saved, user);

      console.log(`Payroll period locked: ID ${id}`);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to lock period:", error.message);
      throw error;
    }
  }

  /**
   * Unlock a period (if needed)
   * @param {number} id
   * @param {string} user
   */
  async unlockPeriod(id, user = "system") {
    const { period: periodRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const existing = await periodRepo.findOne({ where: { id } });
      if (!existing) {
        throw new Error(`Payroll period with ID ${id} not found`);
      }
      if (existing.status !== "locked") {
        throw new Error(
          `Period is not locked (current status: ${existing.status})`,
        );
      }

      const oldData = { ...existing };
      existing.status = "open";
      existing.lockedAt = null;

      // @ts-ignore
      const saved = await updateDb(periodRepo, existing);
      await auditLogger.logUpdate("PayrollPeriod", id, oldData, saved, user);

      console.log(`Payroll period unlocked: ID ${id}`);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to unlock period:", error.message);
      throw error;
    }
  }

  /**
   * Close a period (finalize, cannot be changed)
   * @param {number} id
   * @param {string} user
   */
  async closePeriod(id, user = "system") {
    const { period: periodRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const existing = await periodRepo.findOne({ where: { id } });
      if (!existing) {
        throw new Error(`Payroll period with ID ${id} not found`);
      }
      if (existing.status === "closed") {
        throw new Error("Period is already closed");
      }

      const oldData = { ...existing };
      existing.status = "closed";
      existing.closedAt = new Date();

      // @ts-ignore
      const saved = await updateDb(periodRepo, existing);
      await auditLogger.logUpdate("PayrollPeriod", id, oldData, saved, user);

      console.log(`Payroll period closed: ID ${id}`);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to close period:", error.message);
      throw error;
    }
  }

  /**
   * Update period totals based on linked payroll records
   * @param {number} id
   * @param {string} user
   */
  async refreshTotals(id, user = "system") {
    const { period: periodRepo, payrollRecord: payrollRepo } =
      await this.getRepositories();

    try {
      // @ts-ignore
      const period = await periodRepo.findOne({ where: { id } });
      if (!period) {
        throw new Error(`Payroll period with ID ${id} not found`);
      }

      // Aggregate totals from payroll records
      // @ts-ignore
      const result = await payrollRepo
        .createQueryBuilder("payroll")
        .select([
          "COUNT(payroll.id) as totalEmployees",
          "SUM(payroll.grossPay) as totalGrossPay",
          "SUM(payroll.deductionsTotal) as totalDeductions",
          "SUM(payroll.netPay) as totalNetPay",
        ])
        .where("payroll.periodId = :periodId", { periodId: id })
        .getRawOne();

      const oldData = { ...period };
      period.totalEmployees = parseInt(result.totalEmployees) || 0;
      period.totalGrossPay = parseFloat(result.totalGrossPay) || 0;
      period.totalDeductions = parseFloat(result.totalDeductions) || 0;
      period.totalNetPay = parseFloat(result.totalNetPay) || 0;

      // @ts-ignore
      const saved = await updateDb(periodRepo, period);
      await auditLogger.logUpdate("PayrollPeriod", id, oldData, saved, user);

      console.log(`Payroll period totals refreshed: ID ${id}`);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to refresh period totals:", error.message);
      throw error;
    }
  }

  /**
   * Get summary statistics across all periods
   */
  async getSummary() {
    const { period: periodRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const totalPeriods = await periodRepo.count();

      // @ts-ignore
      const statusCounts = await periodRepo
        .createQueryBuilder("period")
        .select("period.status", "status")
        .addSelect("COUNT(*)", "count")
        .groupBy("period.status")
        .getRawMany();

      // @ts-ignore
      const totals = await periodRepo
        .createQueryBuilder("period")
        .select([
          "SUM(period.totalGrossPay) as overallGrossPay",
          "SUM(period.totalDeductions) as overallDeductions",
          "SUM(period.totalNetPay) as overallNetPay",
          "SUM(period.totalEmployees) as overallEmployees",
        ])
        .getRawOne();

      return {
        totalPeriods,
        statusCounts,
        overall: {
          grossPay: parseFloat(totals.overallGrossPay) || 0,
          deductions: parseFloat(totals.overallDeductions) || 0,
          netPay: parseFloat(totals.overallNetPay) || 0,
          employees: parseInt(totals.overallEmployees) || 0,
        },
      };
    } catch (error) {
      console.error("Failed to get payroll period summary:", error);
      throw error;
    }
  }
}

// Singleton instance
const payrollPeriodService = new PayrollPeriodService();
module.exports = payrollPeriodService;

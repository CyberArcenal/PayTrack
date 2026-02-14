// src/services/DeductionService.js
//@ts-check
const { AppDataSource } = require("../main/db/datasource");
const { saveDb, updateDb, removeDb } = require("../utils/dbUtils/dbActions");
const auditLogger = require("../utils/auditLogger");

const { validateDeductionData } = require("../utils/deductionUtils");

class DeductionService {
  constructor() {
    this.deductionRepository = null;
    this.payrollRecordRepository = null;
  }

  async initialize() {
    const Deduction = require("../entities/Deduction");
    const PayrollRecord = require("../entities/PayrollRecord");
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.deductionRepository = AppDataSource.getRepository(Deduction);
    this.payrollRecordRepository = AppDataSource.getRepository(PayrollRecord);
    console.log("DeductionService initialized");
  }

  async getRepositories() {
    if (!this.deductionRepository) {
      await this.initialize();
    }
    return {
      deduction: this.deductionRepository,
      payrollRecord: this.payrollRecordRepository,
    };
  }

  /**
   * Create a new deduction
   * @param {Object} data - Deduction data
   * @param {string} user - User performing the action
   */
  async create(data, user = "system") {
    const { deduction: deductionRepo, payrollRecord: payrollRepo } =
      await this.getRepositories();

    try {
      // Validate input
      const validation = await validateDeductionData(data);
      if (!validation.valid) {
        throw new Error(validation.errors.join(", "));
      }

      const {
        // @ts-ignore
        payrollRecordId,
        // @ts-ignore
        type,
        // @ts-ignore
        code,
        // @ts-ignore
        description,
        // @ts-ignore
        amount,
        // @ts-ignore
        percentage,
        // @ts-ignore
        isRecurring,
        // @ts-ignore
        appliedDate,
        // @ts-ignore
        note,
      } = data;

      // Check payroll record exists
      // @ts-ignore
      const payrollRecord = await payrollRepo.findOne({
        where: { id: payrollRecordId },
      });
      if (!payrollRecord) {
        throw new Error(`Payroll record with ID ${payrollRecordId} not found`);
      }

      // Create deduction
      // @ts-ignore
      const deduction = deductionRepo.create({
        payrollRecordId,
        type,
        code,
        description,
        amount,
        percentage,
        isRecurring: isRecurring || false,
        appliedDate: appliedDate || new Date(),
        note,
        payrollRecord,
      });

      // @ts-ignore
      const saved = await saveDb(deductionRepo, deduction);

      // Audit log
      await auditLogger.logCreate("Deduction", saved.id, saved, user);

      console.log(
        `Deduction created: ID ${saved.id} for payroll record ${payrollRecordId}`,
      );
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to create deduction:", error.message);
      throw error;
    }
  }

  /**
   * Update an existing deduction
   * @param {number} id - Deduction ID
   * @param {Object} data - Updated data
   * @param {string} user - User performing the action
   */
  async update(id, data, user = "system") {
    const { deduction: deductionRepo, payrollRecord: payrollRepo } =
      await this.getRepositories();

    try {
      // @ts-ignore
      const existing = await deductionRepo.findOne({
        where: { id },
        relations: ["payrollRecord"],
      });
      if (!existing) {
        throw new Error(`Deduction with ID ${id} not found`);
      }

      const oldData = { ...existing };

      // If changing payrollRecordId, validate new payroll record
      if (
        // @ts-ignore
        data.payrollRecordId &&
        // @ts-ignore
        data.payrollRecordId !== existing.payrollRecordId
      ) {
        // @ts-ignore
        const newPayroll = await payrollRepo.findOne({
          // @ts-ignore
          where: { id: data.payrollRecordId },
        });
        if (!newPayroll) {
          throw new Error(
            // @ts-ignore
            `Payroll record with ID ${data.payrollRecordId} not found`,
          );
        }
        // @ts-ignore
        existing.payrollRecord = newPayroll;
        // @ts-ignore
        existing.payrollRecordId = data.payrollRecordId;
      }

      // Update fields
      // @ts-ignore
      if (data.type) existing.type = data.type;
      // @ts-ignore
      if (data.code !== undefined) existing.code = data.code;
      // @ts-ignore
      if (data.description !== undefined)
        // @ts-ignore
        existing.description = data.description;
      // @ts-ignore
      if (data.amount !== undefined) existing.amount = data.amount;
      // @ts-ignore
      if (data.percentage !== undefined) existing.percentage = data.percentage;
      // @ts-ignore
      if (data.isRecurring !== undefined)
        // @ts-ignore
        existing.isRecurring = data.isRecurring;
      // @ts-ignore
      if (data.appliedDate) existing.appliedDate = data.appliedDate;
      // @ts-ignore
      if (data.note !== undefined) existing.note = data.note;

      // @ts-ignore
      const saved = await updateDb(deductionRepo, existing);

      await auditLogger.logUpdate("Deduction", id, oldData, saved, user);

      console.log(`Deduction updated: ID ${id}`);
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to update deduction:", error.message);
      throw error;
    }
  }

  /**
   * Delete a deduction
   * @param {number} id - Deduction ID
   * @param {string} user - User performing the action
   */
  async delete(id, user = "system") {
    const { deduction: deductionRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const existing = await deductionRepo.findOne({ where: { id } });
      if (!existing) {
        throw new Error(`Deduction with ID ${id} not found`);
      }

      const oldData = { ...existing };
      // @ts-ignore
      await removeDb(deductionRepo, existing);

      await auditLogger.logDelete("Deduction", id, oldData, user);

      console.log(`Deduction deleted: ID ${id}`);
      return { success: true, message: "Deduction deleted" };
    } catch (error) {
      // @ts-ignore
      console.error("Failed to delete deduction:", error.message);
      throw error;
    }
  }

  /**
   * Find deduction by ID
   * @param {number} id
   */
  async findById(id) {
    const { deduction: deductionRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const deduction = await deductionRepo.findOne({
        where: { id },
        relations: ["payrollRecord"],
      });
      if (!deduction) {
        throw new Error(`Deduction with ID ${id} not found`);
      }
      // @ts-ignore
      await auditLogger.logView("Deduction", id, "system");
      return deduction;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to find deduction:", error.message);
      throw error;
    }
  }

  /**
   * Find all deductions with filters
   * @param {Object} options - { payrollRecordId, type, isRecurring, startDate, endDate, page, limit }
   */
  async findAll(options = {}) {
    const { deduction: deductionRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const query = deductionRepo
        .createQueryBuilder("deduction")
        .leftJoinAndSelect("deduction.payrollRecord", "payrollRecord");

      // @ts-ignore
      if (options.payrollRecordId) {
        query.andWhere("deduction.payrollRecordId = :payrollRecordId", {
          // @ts-ignore
          payrollRecordId: options.payrollRecordId,
        });
      }

      // @ts-ignore
      if (options.type) {
        // @ts-ignore
        query.andWhere("deduction.type = :type", { type: options.type });
      }

      // @ts-ignore
      if (options.isRecurring !== undefined) {
        query.andWhere("deduction.isRecurring = :isRecurring", {
          // @ts-ignore
          isRecurring: options.isRecurring,
        });
      }

      // @ts-ignore
      if (options.startDate) {
        query.andWhere("deduction.appliedDate >= :startDate", {
          // @ts-ignore
          startDate: options.startDate,
        });
      }

      // @ts-ignore
      if (options.endDate) {
        query.andWhere("deduction.appliedDate <= :endDate", {
          // @ts-ignore
          endDate: options.endDate,
        });
      }

      query.orderBy("deduction.appliedDate", "DESC");

      // @ts-ignore
      if (options.page && options.limit) {
        // @ts-ignore
        const skip = (options.page - 1) * options.limit;
        // @ts-ignore
        query.skip(skip).take(options.limit);
      }

      const deductions = await query.getMany();
      await auditLogger.logView("Deduction", null, "system");
      return deductions;
    } catch (error) {
      console.error("Failed to fetch deductions:", error);
      throw error;
    }
  }

  /**
   * Get total deductions for a payroll record
   * @param {number} payrollRecordId
   * @returns {Promise<number>} Total amount
   */
  async getTotalByPayroll(payrollRecordId) {
    const { deduction: deductionRepo } = await this.getRepositories();

    try {
      // @ts-ignore
      const result = await deductionRepo
        .createQueryBuilder("deduction")
        .select("SUM(deduction.amount)", "total")
        .where("deduction.payrollRecordId = :payrollRecordId", {
          payrollRecordId,
        })
        .getRawOne();

      return parseFloat(result.total) || 0;
    } catch (error) {
      console.error("Failed to get total deductions:", error);
      throw error;
    }
  }

  /**
   * Bulk create deductions for a payroll record
   * @param {Array<Object>} deductionsData
   * @param {number} payrollRecordId
   * @param {string} user
   */
  async bulkCreate(deductionsData, payrollRecordId, user = "system") {
    const { deduction: deductionRepo, payrollRecord: payrollRepo } =
      await this.getRepositories();

    try {
      // @ts-ignore
      const payrollRecord = await payrollRepo.findOne({
        where: { id: payrollRecordId },
      });
      if (!payrollRecord) {
        throw new Error(`Payroll record with ID ${payrollRecordId} not found`);
      }

      const created = [];
      for (const data of deductionsData) {
        const validation = await validateDeductionData({
          ...data,
          payrollRecordId,
        });
        if (!validation.valid) {
          throw new Error(
            `Invalid deduction data: ${validation.errors.join(", ")}`,
          );
        }

        // @ts-ignore
        const deduction = deductionRepo.create({
          ...data,
          payrollRecordId,
          payrollRecord,
        });
        // @ts-ignore
        const saved = await saveDb(deductionRepo, deduction);
        created.push(saved);
      }

      // Audit log for bulk creation
      await auditLogger.logCreate(
        "Deduction",
        created.map((d) => d.id),
        created,
        user,
      );

      console.log(
        `Bulk created ${created.length} deductions for payroll ${payrollRecordId}`,
      );
      return created;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to bulk create deductions:", error.message);
      throw error;
    }
  }
}

// Singleton instance
const deductionService = new DeductionService();
module.exports = deductionService;

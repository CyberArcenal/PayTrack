// src/services/AuditLogService.js
//@ts-check
const { AppDataSource } = require("../main/db/datasource");
const { validateAuditData } = require("../utils/auditUtils");
// @ts-ignore
const { saveDb, updateDb, removeDb } = require("../utils/dbUtils/dbActions");

class AuditLogService {
  constructor() {
    this.auditRepository = null;
  }

  async initialize() {
    const { AuditLog } = require("../entities/AuditLog");
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    this.auditRepository = AppDataSource.getRepository(AuditLog);
    console.log("AuditLogService initialized");
  }

  async getRepository() {
    if (!this.auditRepository) {
      await this.initialize();
    }
    return this.auditRepository;
  }

  /**
   * Create a new audit log entry
   * @param {Object} data - Audit data (entity, entityId, action, oldData, newData, changes, userId, userType, ipAddress, userAgent)
   * @returns {Promise<Object>} Created audit log
   */
  async log(data) {
    const repo = await this.getRepository();

    try {
      const validation = validateAuditData(data);
      if (!validation.valid) {
        throw new Error(`Invalid audit data: ${validation.errors.join(", ")}`);
      }

      // Ensure JSON fields are stringified if objects are passed
      const logData = {
        ...data,
        // @ts-ignore
        oldData: data.oldData
          // @ts-ignore
          ? typeof data.oldData === "string"
            // @ts-ignore
            ? data.oldData
            // @ts-ignore
            : JSON.stringify(data.oldData)
          : null,
        // @ts-ignore
        newData: data.newData
          // @ts-ignore
          ? typeof data.newData === "string"
            // @ts-ignore
            ? data.newData
            // @ts-ignore
            : JSON.stringify(data.newData)
          : null,
        // @ts-ignore
        changes: data.changes
          // @ts-ignore
          ? typeof data.changes === "string"
            // @ts-ignore
            ? data.changes
            // @ts-ignore
            : JSON.stringify(data.changes)
          : null,
        // @ts-ignore
        timestamp: data.timestamp || new Date(),
      };

      // @ts-ignore
      const entry = repo.create(logData);
      // @ts-ignore
      const saved = await saveDb(repo, entry); // This will trigger any audit subscribers (avoid infinite loop if any)
      return saved;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to create audit log:", error.message);
      throw error;
    }
  }

  /**
   * Convenience method for CREATE actions
   */
  async logCreate(
    // @ts-ignore
    entity,
    // @ts-ignore
    entityId,
    // @ts-ignore
    newData,
    user = "system",
    userType = null,
    ipAddress = null,
    userAgent = null,
  ) {
    return this.log({
      entity,
      entityId: String(entityId),
      action: "CREATE",
      newData: newData,
      userId: typeof user === "number" ? user : null,
      userType: userType,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Convenience method for UPDATE actions
   */
  async logUpdate(
    // @ts-ignore
    entity,
    // @ts-ignore
    entityId,
    // @ts-ignore
    oldData,
    // @ts-ignore
    newData,
    user = "system",
    userType = null,
    ipAddress = null,
    userAgent = null,
    changes = null,
  ) {
    return this.log({
      entity,
      entityId: String(entityId),
      action: "UPDATE",
      oldData,
      newData,
      changes,
      userId: typeof user === "number" ? user : null,
      userType,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Convenience method for DELETE actions
   */
  async logDelete(
    // @ts-ignore
    entity,
    // @ts-ignore
    entityId,
    // @ts-ignore
    oldData,
    user = "system",
    userType = null,
    ipAddress = null,
    userAgent = null,
  ) {
    return this.log({
      entity,
      entityId: String(entityId),
      action: "DELETE",
      oldData,
      userId: typeof user === "number" ? user : null,
      userType,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Convenience method for VIEW actions
   */
  async logView(
    // @ts-ignore
    entity,
    // @ts-ignore
    entityId,
    user = "system",
    userType = null,
    ipAddress = null,
    userAgent = null,
  ) {
    return this.log({
      entity,
      entityId: entityId ? String(entityId) : null,
      action: "VIEW",
      userId: typeof user === "number" ? user : null,
      userType,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Convenience method for EXPORT actions
   */
  async logExport(
    // @ts-ignore
    entity,
    // @ts-ignore
    format,
    // @ts-ignore
    filters,
    user = "system",
    userType = null,
    ipAddress = null,
    userAgent = null,
  ) {
    return this.log({
      entity,
      action: "EXPORT",
      newData: { format, filters },
      userId: typeof user === "number" ? user : null,
      userType,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Find audit log by ID
   * @param {number} id
   */
  async findById(id) {
    const repo = await this.getRepository();
    // @ts-ignore
    const entry = await repo.findOne({ where: { id } });
    if (!entry) {
      throw new Error(`Audit log with ID ${id} not found`);
    }
    return entry;
  }

  /**
   * Find all audit logs with filters
   * @param {Object} options - { entity, entityId, action, userId, startDate, endDate, page, limit }
   */
  async findAll(options = {}) {
    const repo = await this.getRepository();
    // @ts-ignore
    const query = repo.createQueryBuilder("audit");

    // @ts-ignore
    if (options.entity) {
      // @ts-ignore
      query.andWhere("audit.entity = :entity", { entity: options.entity });
    }
    // @ts-ignore
    if (options.entityId) {
      query.andWhere("audit.entityId = :entityId", {
        // @ts-ignore
        entityId: options.entityId,
      });
    }
    // @ts-ignore
    if (options.action) {
      // @ts-ignore
      query.andWhere("audit.action = :action", { action: options.action });
    }
    // @ts-ignore
    if (options.userId) {
      // @ts-ignore
      query.andWhere("audit.userId = :userId", { userId: options.userId });
    }
    // @ts-ignore
    if (options.startDate) {
      query.andWhere("audit.timestamp >= :startDate", {
        // @ts-ignore
        startDate: options.startDate,
      });
    }
    // @ts-ignore
    if (options.endDate) {
      query.andWhere("audit.timestamp <= :endDate", {
        // @ts-ignore
        endDate: options.endDate,
      });
    }

    query.orderBy("audit.timestamp", "DESC");

    // @ts-ignore
    if (options.page && options.limit) {
      // @ts-ignore
      const skip = (options.page - 1) * options.limit;
      // @ts-ignore
      query.skip(skip).take(options.limit);
    }

    return query.getMany();
  }

  /**
   * Get summary statistics
   * @param {Object} filters - { startDate, endDate }
   */
  async getSummary(filters = {}) {
    const repo = await this.getRepository();
    // @ts-ignore
    const query = repo.createQueryBuilder("audit");

    // @ts-ignore
    if (filters.startDate) {
      query.andWhere("audit.timestamp >= :startDate", {
        // @ts-ignore
        startDate: filters.startDate,
      });
    }
    // @ts-ignore
    if (filters.endDate) {
      query.andWhere("audit.timestamp <= :endDate", {
        // @ts-ignore
        endDate: filters.endDate,
      });
    }

    const total = await query.getCount();

    const actionCounts = await query
      .clone()
      .select("audit.action", "action")
      .addSelect("COUNT(*)", "count")
      .groupBy("audit.action")
      .getRawMany();

    const entityCounts = await query
      .clone()
      .select("audit.entity", "entity")
      .addSelect("COUNT(*)", "count")
      .groupBy("audit.entity")
      .getRawMany();

    const userCounts = await query
      .clone()
      .select("audit.userId", "userId")
      .addSelect("COUNT(*)", "count")
      .groupBy("audit.userId")
      .getRawMany();

    return {
      total,
      actionCounts,
      entityCounts,
      userCounts,
    };
  }

  /**
   * Delete old audit logs (admin cleanup)
   * @param {Date} olderThan - Delete logs older than this date
   * @returns {Promise<number>} Number of deleted logs
   */
  // @ts-ignore
  async deleteOlderThan(olderThan, user = "system") {
    const repo = await this.getRepository();
    // @ts-ignore
    const result = await repo
      .createQueryBuilder()
      .delete()
      .where("timestamp < :olderThan", { olderThan })
      .execute();
    // Optionally log this deletion? Could cause infinite loop.
    console.log(
      `Deleted ${result.affected} audit logs older than ${olderThan}`,
    );
    return result.affected || 0;
  }
}

// Singleton instance
const auditLogService = new AuditLogService();
module.exports = auditLogService;

// ===================== AuditLog.js =====================
// src/entities/AuditLog.js
// @ts-check
const { EntitySchema } = require("typeorm");

const AuditLog = new EntitySchema({
  name: "AuditLog",
  tableName: "audit_logs",
  columns: {
    id: {
      primary: true,
      type: "integer",
      generated: true,
      comment: "Unique identifier for audit record",
    },
    entity: {
      type: "varchar",
      length: 100,
      nullable: true,
      comment: "Entity name (Employee, Attendance, etc.)",
    },
    entityId: {
      type: "varchar",
      length: 100,
      nullable: false,
      comment: "Entity ID",
    },
    action: {
      type: "varchar",
      length: 50,
      nullable: false,
      comment: "Action performed (CREATE, UPDATE, DELETE, etc.)",
    },
    oldData: {
      type: "text",
      nullable: true,
      comment: "Previous data before change (JSON format)",
    },
    newData: {
      type: "text",
      nullable: true,
      comment: "New data after change (JSON format)",
    },
    changes: {
      type: "text",
      nullable: true,
      comment: "Summary of changes",
    },
    userId: {
      type: "integer",
      nullable: true,
      comment: "User who performed the action",
    },
    userType: {
      type: "varchar",
      length: 50,
      nullable: true,
      comment: "Type of user (admin, employee, system)",
    },
    ipAddress: {
      type: "varchar",
      length: 45,
      nullable: true,
      comment: "IP address of the user",
    },
    userAgent: {
      type: "text",
      nullable: true,
      comment: "User agent/browser information",
    },
    timestamp: {
      type: "datetime",
      createDate: true,
      comment: "When the action occurred",
    },
  },
  indices: [
    {
      name: "idx_audit_entity",
      columns: ["entity", "entityId"],
      unique: false,
    },
    {
      name: "idx_audit_action",
      columns: ["action"],
      unique: false,
    },
    {
      name: "idx_audit_timestamp",
      columns: ["timestamp"],
      unique: false,
    },
    {
      name: "idx_audit_user",
      columns: ["userId"],
      unique: false,
    },
  ],
});

module.exports = AuditLog;

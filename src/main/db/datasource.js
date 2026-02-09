// src/main/db/datasource.js
//@ts-check
const fs = require("fs");
const path = require("path");
const { DataSource } = require("typeorm");
const { getDatabaseConfig } = require("./database");

// Import EntitySchema constants
const AttendanceLogSchema = require("../../entities/AttendanceLog");
const AuditLogSchema = require("../../entities/AuditLog");
const DeductionSchema = require("../../entities/Deduction");
const EmployeeSchema = require("../../entities/Employee");
const OvertimeLogSchema = require("../../entities/OvertimeLog");
const PayrollPeriodSchema = require("../../entities/PayrollPeriod");
const PayrollRecordSchema = require("../../entities/PayrollRecord");

const config = getDatabaseConfig();

const entities = [
  AttendanceLogSchema,
  AuditLogSchema,
  DeductionSchema,
  EmployeeSchema,
  OvertimeLogSchema,
  PayrollPeriodSchema,
  PayrollRecordSchema
];

/**
 * Normalize subscribers:
 * - If database.js returned glob strings, keep them (TypeORM can accept globs).
 * - If database.js returned file paths (absolute), require them and pass classes/constructors.
 * @param {string[]} subscribersConfig
 */
function resolveSubscribers(subscribersConfig) {
  if (!subscribersConfig) return [];

  const resolved = [];

  for (const item of subscribersConfig) {
    if (!item) continue;

    // If item contains glob chars, keep as-is for TypeORM to resolve
    if (typeof item === "string" && (item.includes("*") || item.includes("?"))) {
      resolved.push(item);
      continue;
    }

    // If it's a string path and file exists, require it
    if (typeof item === "string") {
      try {
        const abs = path.isAbsolute(item) ? item : path.resolve(process.cwd(), item);
        if (fs.existsSync(abs)) {
          const required = require(abs);
          if (required) resolved.push(required);
          continue;
        }
      } catch (err) {
        // @ts-ignore
        console.warn("[PayTrack][DataSource] Could not require subscriber path:", item, err.message);
      }
    }

    // If it's already a function/class/object, push directly
    if (typeof item === "function" || typeof item === "object") {
      resolved.push(item);
    }
  }

  return resolved;
}

const subscribers = resolveSubscribers(config.subscribers);

const dataSourceOptions = {
  ...config,
  entities,
  subscribers,
  migrations: Array.isArray(config.migrations) ? config.migrations : [config.migrations]
};

// @ts-ignore
const AppDataSource = new DataSource(dataSourceOptions);

module.exports = { AppDataSource };

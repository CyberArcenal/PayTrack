// src/main/db/datasource.js
//@ts-check
const fs = require("fs");
const path = require("path");
const { DataSource } = require("typeorm");
const { getDatabaseConfig } = require("./database");

// Import Entity constants
const AttendanceLog = require("../../entities/AttendanceLog");
const Deduction = require("../../entities/Deduction");
const Employee = require("../../entities/Employee");
const OvertimeLog = require("../../entities/OvertimeLog");
const PayrollPeriod = require("../../entities/PayrollPeriod");
const PayrollRecord = require("../../entities/PayrollRecord");
const { AuditLog } = require("../../entities/AuditLog");

const config = getDatabaseConfig();

const entities = [
  AttendanceLog,
  AuditLog,
  Deduction,
  Employee,
  OvertimeLog,
  PayrollPeriod,
  PayrollRecord,
];

const dataSourceOptions = {
  ...config,
  entities,
  migrations: Array.isArray(config.migrations)
    ? config.migrations
    : [config.migrations],
};

// @ts-ignore
const AppDataSource = new DataSource(dataSourceOptions);

module.exports = { AppDataSource };

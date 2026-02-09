// src/entities/PayrollPeriod.js
const { EntitySchema } = require("typeorm");

const PayrollPeriodSchema = new EntitySchema({
  name: "PayrollPeriod",
  tableName: "payroll_periods",
  columns: {
    id: {
      primary: true,
      type: "integer",
      generated: true,
      comment: "Unique identifier for payroll period",
    },

    name: {
      type: "varchar",
      length: 100,
      nullable: true,
      comment: "Optional period name (e.g., 'January 2024 1st Half')",
    },

    periodType: {
      type: "varchar",
      length: 20,
      nullable: false,
      default: "semi-monthly",
      comment: "Period type (weekly, bi-weekly, semi-monthly, monthly)",
    },

    startDate: {
      type: "date",
      nullable: false,
      comment: "Period start date (inclusive)",
    },

    endDate: {
      type: "date",
      nullable: false,
      comment: "Period end date (inclusive)",
    },

    payDate: {
      type: "date",
      nullable: false,
      comment: "Actual pay date",
    },

    workingDays: {
      type: "integer",
      nullable: false,
      default: 10,
      comment: "Number of working days in this period",
    },

    status: {
      type: "varchar",
      length: 30,
      nullable: false,
      default: "open",
      comment: "Period status (open, processing, locked, closed)",
    },

    lockedAt: {
      type: "datetime",
      nullable: true,
      comment: "When period was locked for editing",
    },

    closedAt: {
      type: "datetime",
      nullable: true,
      comment: "When period was fully closed",
    },

    totalEmployees: {
      type: "integer",
      nullable: false,
      default: 0,
      comment: "Number of employees processed",
    },

    totalGrossPay: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Total gross pay for period",
    },

    totalDeductions: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Total deductions for period",
    },

    totalNetPay: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Total net pay for period",
    },

    createdAt: {
      type: "datetime",
      createDate: true,
      comment: "Record creation timestamp",
    },

    updatedAt: {
      type: "datetime",
      updateDate: true,
      comment: "Record last update timestamp",
    },
  },

  relations: {
    payrollRecords: {
      type: "one-to-many",
      target: "PayrollRecord",
      inverseSide: "period",
      cascade: false,
    },
  },

  indices: [
    {
      name: "idx_payroll_period_dates",
      columns: ["startDate", "endDate"],
      unique: true,
    },
    {
      name: "idx_payroll_period_status",
      columns: ["status"],
      unique: false,
    },
    {
      name: "idx_payroll_period_paydate",
      columns: ["payDate"],
      unique: false,
    },
  ],
});

module.exports = PayrollPeriodSchema;

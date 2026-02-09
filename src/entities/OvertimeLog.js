// ===================== OvertimeLog.js =====================
// src/entities/OvertimeLog.js
const { EntitySchema } = require("typeorm");

const OvertimeLogSchema = new EntitySchema({
  name: "OvertimeLog",
  tableName: "overtime_logs",
  columns: {
    id: {
      primary: true,
      type: "integer",
      generated: true,
      comment: "Unique identifier for overtime record",
    },
    employeeId: {
      type: "integer",
      nullable: false,
      comment: "Foreign key reference to employee",
    },
    payrollRecordId: {
      type: "integer",
      nullable: true,
      comment: "Foreign key reference to payroll record when processed",
    },
    date: {
      type: "date",
      nullable: false,
      comment: "Date of overtime work",
    },
    startTime: {
      type: "time",
      nullable: false,
      comment: "Overtime start time",
    },
    endTime: {
      type: "time",
      nullable: false,
      comment: "Overtime end time",
    },
    hours: {
      type: "decimal",
      precision: 8,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Total overtime hours",
    },
    rate: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: false,
      default: "1.25",
      comment: "Overtime rate multiplier (1.25, 1.5, 2.0, etc.)",
    },
    amount: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Calculated overtime amount (hours * hourlyRate * rate)",
    },
    type: {
      type: "varchar",
      length: 50,
      nullable: false,
      default: "regular",
      comment: "Overtime type (regular, holiday, special-holiday, rest-day)",
    },
    approvedBy: {
      type: "varchar",
      length: 100,
      nullable: true,
      comment: "Name of approver",
    },
    approvalStatus: {
      type: "varchar",
      length: 20,
      nullable: false,
      default: "pending",
      comment: "Approval status (pending, approved, rejected)",
    },
    note: {
      type: "text",
      nullable: true,
      comment: "Reason or notes for overtime",
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
    employee: {
      type: "many-to-one",
      target: "Employee",
      joinColumn: {
        name: "employeeId",
        referencedColumnName: "id",
      },
      nullable: false,
      onDelete: "CASCADE",
      inverseSide: "overtimeLogs",
    },
    payrollRecord: {
      type: "many-to-one",
      target: "PayrollRecord",
      joinColumn: {
        name: "payrollRecordId",
        referencedColumnName: "id",
      },
      nullable: true,
      onDelete: "SET NULL",
      inverseSide: "overtimeLogs",
    },
  },
  indices: [
    {
      name: "idx_overtime_employee_date",
      columns: ["employeeId", "date"],
      unique: false,
    },
    {
      name: "idx_overtime_payroll",
      columns: ["payrollRecordId"],
      unique: false,
    },
    {
      name: "idx_overtime_status",
      columns: ["approvalStatus"],
      unique: false,
    },
    {
      name: "idx_overtime_date",
      columns: ["date"],
      unique: false,
    },
  ],
});

module.exports = OvertimeLogSchema;

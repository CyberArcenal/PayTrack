// src/entities/PayrollRecord.js
const { EntitySchema } = require("typeorm");

const PayrollRecord = new EntitySchema({
  name: "PayrollRecord",
  tableName: "payroll_records",
  columns: {
    id: {
      primary: true,
      type: "integer",
      generated: true,
      comment: "Unique identifier for payroll record",
    },

    employeeId: {
      type: "integer",
      nullable: false,
      comment: "Foreign key reference to employee",
    },

    periodId: {
      type: "integer",
      nullable: false,
      comment: "Foreign key reference to payroll period",
    },

    daysPresent: {
      type: "integer",
      nullable: false,
      default: 0,
      comment: "Number of days present in this period",
    },

    daysAbsent: {
      type: "integer",
      nullable: false,
      default: 0,
      comment: "Number of days absent in this period",
    },

    daysLate: {
      type: "integer",
      nullable: false,
      default: 0,
      comment: "Number of days late in this period",
    },

    daysHalfDay: {
      type: "integer",
      nullable: false,
      default: 0,
      comment: "Number of half days in this period",
    },

    basicPay: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Basic salary for period (daysPresent * dailyRate)",
    },

    overtimeHours: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Total overtime hours",
    },

    overtimePay: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Total overtime pay",
    },

    holidayPay: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Holiday pay",
    },

    nightDiffPay: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Night differential pay",
    },

    allowance: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Other allowances",
    },

    bonus: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Bonuses/incentives",
    },

    grossPay: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Total earnings before deductions",
    },

    sssDeduction: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "SSS contribution",
    },

    philhealthDeduction: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "PhilHealth contribution",
    },

    pagibigDeduction: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Pag-IBIG contribution",
    },

    taxDeduction: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Withholding tax",
    },

    loanDeduction: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Loan deductions",
    },

    advanceDeduction: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Salary advance deductions",
    },

    otherDeductions: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Other miscellaneous deductions",
    },

    deductionsTotal: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Total of all deductions",
    },

    netPay: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Take-home pay (grossPay - deductionsTotal)",
    },

    computedAt: {
      type: "datetime",
      nullable: true,
      comment: "When payroll was computed",
    },

    paymentStatus: {
      type: "varchar",
      length: 20,
      nullable: false,
      default: "unpaid",
      comment: "Payment status (unpaid, paid, partially-paid, cancelled)",
    },

    paidAt: {
      type: "datetime",
      nullable: true,
      comment: "When payment was made",
    },

    paymentMethod: {
      type: "varchar",
      length: 50,
      nullable: true,
      comment: "Method of payment (cash, check, bank transfer)",
    },

    paymentReference: {
      type: "varchar",
      length: 100,
      nullable: true,
      comment: "Check number or transaction reference",
    },

    remarks: {
      type: "text",
      nullable: true,
      comment: "Additional remarks",
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
      inverseSide: "payrollRecords",
    },

    period: {
      type: "many-to-one",
      target: "PayrollPeriod",
      joinColumn: {
        name: "periodId",
        referencedColumnName: "id",
      },
      nullable: false,
      onDelete: "CASCADE",
      inverseSide: "payrollRecords",
    },

    deductions: {
      type: "one-to-many",
      target: "Deduction",
      inverseSide: "payrollRecord",
      cascade: ["insert", "update"],
    },

    overtimeLogs: {
      type: "one-to-many",
      target: "OvertimeLog",
      inverseSide: "payrollRecord",
      cascade: false,
    },

    attendanceLogs: {
      type: "one-to-many",
      target: "AttendanceLog",
      inverseSide: "payrollRecord",
      cascade: false,
    },
  },

  indices: [
    {
      name: "idx_payroll_employee_period",
      columns: ["employeeId", "periodId"],
      unique: true,
    },
    {
      name: "idx_payroll_period",
      columns: ["periodId"],
      unique: false,
    },
    {
      name: "idx_payroll_payment_status",
      columns: ["paymentStatus"],
      unique: false,
    },
    {
      name: "idx_payroll_computed_at",
      columns: ["computedAt"],
      unique: false,
    },
  ],
});

module.exports = PayrollRecord;

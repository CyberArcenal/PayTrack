// src/entities/Employee.js
const { EntitySchema } = require("typeorm");

const Employee = new EntitySchema({
  name: "Employee",
  tableName: "employees",
  columns: {
    id: {
      primary: true,
      type: "integer",
      generated: true,
      comment: "Unique identifier for employee",
    },

    employeeNumber: {
      type: "varchar",
      length: 50,
      unique: true,
      nullable: false,
      comment: "Employee ID number",
    },

    firstName: {
      type: "varchar",
      length: 100,
      nullable: false,
      comment: "First name",
    },
    middleName: {
      type: "varchar",
      length: 100,
      nullable: true,
      comment: "Middle name",
    },
    lastName: {
      type: "varchar",
      length: 100,
      nullable: false,
      comment: "Last name",
    },

    email: {
      type: "varchar",
      length: 255,
      nullable: true,
      unique: true,
      comment: "Email address",
    },
    phone: {
      type: "varchar",
      length: 20,
      nullable: true,
      comment: "Contact number",
    },
    address: { type: "text", nullable: true, comment: "Complete address" },

    birthDate: { type: "date", nullable: true, comment: "Date of birth" },
    hireDate: {
      type: "date",
      nullable: false,
      default: () => "CURRENT_DATE",
      comment: "Date hired",
    },

    position: {
      type: "varchar",
      length: 100,
      nullable: true,
      comment: "Job position/title",
    },
    department: {
      type: "varchar",
      length: 100,
      nullable: true,
      comment: "Department/team",
    },

    basePay: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Basic salary per pay period",
    },

    dailyRate: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Daily rate (basePay / workingDays)",
    },

    hourlyRate: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: false,
      default: "0.00",
      comment: "Hourly rate (dailyRate / 8)",
    },

    overtimeRate: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: false,
      default: "1.25",
      comment: "Overtime multiplier (1.25 for 125%)",
    },

    paymentMethod: {
      type: "varchar",
      length: 50,
      nullable: false,
      default: "bank",
      comment: "Payment method (bank, cash, check)",
    },

    bankName: {
      type: "varchar",
      length: 100,
      nullable: true,
      comment: "Bank name for direct deposit",
    },
    accountNumber: {
      type: "varchar",
      length: 50,
      nullable: true,
      comment: "Bank account number",
    },

    status: {
      type: "varchar",
      length: 20,
      nullable: false,
      default: "active",
      comment: "Employee status (active, inactive, terminated, on-leave)",
    },

    employmentType: {
      type: "varchar",
      length: 20,
      nullable: false,
      default: "regular",
      comment:
        "Employment type (regular, contractual, part-time, probationary)",
    },

    sssNumber: {
      type: "varchar",
      length: 20,
      nullable: true,
      comment: "SSS number",
    },
    philhealthNumber: {
      type: "varchar",
      length: 20,
      nullable: true,
      comment: "PhilHealth number",
    },
    pagibigNumber: {
      type: "varchar",
      length: 20,
      nullable: true,
      comment: "Pag-IBIG number",
    },
    tinNumber: {
      type: "varchar",
      length: 20,
      nullable: true,
      comment: "Tax Identification Number",
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
    attendanceLogs: {
      type: "one-to-many",
      target: "AttendanceLog",
      inverseSide: "employee",
      cascade: false,
    },
    payrollRecords: {
      type: "one-to-many",
      target: "PayrollRecord",
      inverseSide: "employee",
      cascade: false,
    },
    overtimeLogs: {
      type: "one-to-many",
      target: "OvertimeLog",
      inverseSide: "employee",
      cascade: false,
    },
    // Note: deductions relation removed because Deduction currently links to PayrollRecord.
    // If you want employee-level deductions, add payrollRecordId OR employeeId to Deduction and re-add relation here.
  },

  indices: [
    { name: "idx_employee_number", columns: ["employeeNumber"], unique: true },
    {
      name: "idx_employee_name",
      columns: ["lastName", "firstName"],
      unique: false,
    },
    { name: "idx_employee_status", columns: ["status"], unique: false },
    { name: "idx_employee_department", columns: ["department"], unique: false },
  ],
});

module.exports = Employee;

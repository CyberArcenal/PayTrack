// ===================== AttendanceLog.js =====================
// src/entities/AttendanceLog.js
const { EntitySchema } = require("typeorm");

const AttendanceLogSchema = new EntitySchema({
  name: "AttendanceLog",
  tableName: "attendance_logs",
  columns: {
    id: {
      primary: true,
      type: "integer",
      generated: true,
      comment: "Unique identifier for attendance record",
    },
    employeeId: {
      type: "integer",
      nullable: false,
      comment: "Foreign key reference to employee",
    },
    timestamp: {
      type: "datetime",
      nullable: false,
      default: () => "CURRENT_TIMESTAMP",
      comment: "Date and time of attendance",
    },
    source: {
      type: "varchar",
      length: 50,
      nullable: false,
      default: "manual",
      comment: "Source of attendance (manual, rfid, biometric, etc.)",
    },
    status: {
      type: "varchar",
      length: 30,
      nullable: false,
      default: "present",
      comment: "Attendance status (present, absent, late, half-day, etc.)",
    },
    hoursWorked: {
      type: "decimal",
      precision: 5,
      scale: 2,
      nullable: false,
      default: 8.0,
      comment: "Number of hours worked for this attendance",
    },
    overtimeHours: {
      type: "decimal",
      precision: 5,
      scale: 2,
      nullable: false,
      default: 0.0,
      comment: "Overtime hours for this attendance",
    },
    lateMinutes: {
      type: "integer",
      nullable: false,
      default: 0,
      comment: "Minutes late if status is late",
    },
    note: {
      type: "text",
      nullable: true,
      comment: "Additional notes or remarks",
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
      inverseSide: "attendanceLogs",
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
      comment: "Link to payroll record when processed",
    },
  },
  indices: [
    {
      name: "idx_attendance_employee_timestamp",
      columns: ["employeeId", "timestamp"],
      unique: false,
    },
    {
      name: "idx_attendance_date",
      columns: ["timestamp"],
      unique: false,
    },
    {
      name: "idx_attendance_status",
      columns: ["status"],
      unique: false,
    },
  ],
  uniques: [
    {
      name: "uq_attendance_employee_date",
      columns: ["employeeId", "timestamp"],
      comment: "Prevent duplicate attendance for same employee on same day",
    },
  ],
});

module.exports = AttendanceLogSchema;

/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class InitSchema1771085473913 {
    name = 'InitSchema1771085473913'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "attendance_logs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "employeeId" integer NOT NULL, "timestamp" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "source" varchar(50) NOT NULL DEFAULT ('manual'), "status" varchar(30) NOT NULL DEFAULT ('present'), "hoursWorked" decimal(5,2) NOT NULL DEFAULT (8), "overtimeHours" decimal(5,2) NOT NULL DEFAULT (0), "lateMinutes" integer NOT NULL DEFAULT (0), "note" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "payrollRecordId" integer, CONSTRAINT "uq_attendance_employee_date" UNIQUE ("employeeId", "timestamp"))`);
        await queryRunner.query(`CREATE INDEX "idx_attendance_employee_timestamp" ON "attendance_logs" ("employeeId", "timestamp") `);
        await queryRunner.query(`CREATE INDEX "idx_attendance_date" ON "attendance_logs" ("timestamp") `);
        await queryRunner.query(`CREATE INDEX "idx_attendance_status" ON "attendance_logs" ("status") `);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "action" varchar NOT NULL, "entity" varchar NOT NULL, "entityId" integer, "timestamp" datetime NOT NULL DEFAULT (datetime('now')), "user" varchar)`);
        await queryRunner.query(`CREATE TABLE "deductions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "payrollRecordId" integer NOT NULL, "type" varchar(100) NOT NULL, "code" varchar(50), "description" text, "amount" decimal(15,2) NOT NULL DEFAULT (0), "percentage" decimal(5,2), "isRecurring" boolean NOT NULL DEFAULT (0), "appliedDate" date NOT NULL DEFAULT (CURRENT_DATE), "note" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE INDEX "idx_deduction_payroll" ON "deductions" ("payrollRecordId") `);
        await queryRunner.query(`CREATE INDEX "idx_deduction_type" ON "deductions" ("type") `);
        await queryRunner.query(`CREATE INDEX "idx_deduction_recurring" ON "deductions" ("isRecurring") `);
        await queryRunner.query(`CREATE TABLE "employees" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "employeeNumber" varchar(50) NOT NULL, "firstName" varchar(100) NOT NULL, "middleName" varchar(100), "lastName" varchar(100) NOT NULL, "email" varchar(255), "phone" varchar(20), "address" text, "birthDate" date, "hireDate" date NOT NULL DEFAULT (CURRENT_DATE), "position" varchar(100), "department" varchar(100), "basePay" decimal(15,2) NOT NULL DEFAULT ('0.00'), "dailyRate" decimal(15,2) NOT NULL DEFAULT ('0.00'), "hourlyRate" decimal(10,2) NOT NULL DEFAULT ('0.00'), "overtimeRate" decimal(10,2) NOT NULL DEFAULT ('1.25'), "paymentMethod" varchar(50) NOT NULL DEFAULT ('bank'), "bankName" varchar(100), "accountNumber" varchar(50), "status" varchar(20) NOT NULL DEFAULT ('active'), "employmentType" varchar(20) NOT NULL DEFAULT ('regular'), "sssNumber" varchar(20), "philhealthNumber" varchar(20), "pagibigNumber" varchar(20), "tinNumber" varchar(20), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_1de36734659e4fb0b941bd4b6e4" UNIQUE ("employeeNumber"), CONSTRAINT "UQ_765bc1ac8967533a04c74a9f6af" UNIQUE ("email"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_employee_number" ON "employees" ("employeeNumber") `);
        await queryRunner.query(`CREATE INDEX "idx_employee_name" ON "employees" ("lastName", "firstName") `);
        await queryRunner.query(`CREATE INDEX "idx_employee_status" ON "employees" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_employee_department" ON "employees" ("department") `);
        await queryRunner.query(`CREATE TABLE "overtime_logs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "employeeId" integer NOT NULL, "payrollRecordId" integer, "date" date NOT NULL, "startTime" time NOT NULL, "endTime" time NOT NULL, "hours" decimal(8,2) NOT NULL DEFAULT ('0.00'), "rate" decimal(10,2) NOT NULL DEFAULT ('1.25'), "amount" decimal(15,2) NOT NULL DEFAULT ('0.00'), "type" varchar(50) NOT NULL DEFAULT ('regular'), "approvedBy" varchar(100), "approvalStatus" varchar(20) NOT NULL DEFAULT ('pending'), "note" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE INDEX "idx_overtime_employee_date" ON "overtime_logs" ("employeeId", "date") `);
        await queryRunner.query(`CREATE INDEX "idx_overtime_payroll" ON "overtime_logs" ("payrollRecordId") `);
        await queryRunner.query(`CREATE INDEX "idx_overtime_status" ON "overtime_logs" ("approvalStatus") `);
        await queryRunner.query(`CREATE INDEX "idx_overtime_date" ON "overtime_logs" ("date") `);
        await queryRunner.query(`CREATE TABLE "payroll_periods" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(100), "periodType" varchar(20) NOT NULL DEFAULT ('semi-monthly'), "startDate" date NOT NULL, "endDate" date NOT NULL, "payDate" date NOT NULL, "workingDays" integer NOT NULL DEFAULT (10), "status" varchar(30) NOT NULL DEFAULT ('open'), "lockedAt" datetime, "closedAt" datetime, "totalEmployees" integer NOT NULL DEFAULT (0), "totalGrossPay" decimal(15,2) NOT NULL DEFAULT ('0.00'), "totalDeductions" decimal(15,2) NOT NULL DEFAULT ('0.00'), "totalNetPay" decimal(15,2) NOT NULL DEFAULT ('0.00'), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_payroll_period_dates" ON "payroll_periods" ("startDate", "endDate") `);
        await queryRunner.query(`CREATE INDEX "idx_payroll_period_status" ON "payroll_periods" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_payroll_period_paydate" ON "payroll_periods" ("payDate") `);
        await queryRunner.query(`CREATE TABLE "payroll_records" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "employeeId" integer NOT NULL, "periodId" integer NOT NULL, "daysPresent" integer NOT NULL DEFAULT (0), "daysAbsent" integer NOT NULL DEFAULT (0), "daysLate" integer NOT NULL DEFAULT (0), "daysHalfDay" integer NOT NULL DEFAULT (0), "basicPay" decimal(15,2) NOT NULL DEFAULT ('0.00'), "overtimeHours" decimal(10,2) NOT NULL DEFAULT ('0.00'), "overtimePay" decimal(15,2) NOT NULL DEFAULT ('0.00'), "holidayPay" decimal(15,2) NOT NULL DEFAULT ('0.00'), "nightDiffPay" decimal(15,2) NOT NULL DEFAULT ('0.00'), "allowance" decimal(15,2) NOT NULL DEFAULT ('0.00'), "bonus" decimal(15,2) NOT NULL DEFAULT ('0.00'), "grossPay" decimal(15,2) NOT NULL DEFAULT ('0.00'), "sssDeduction" decimal(15,2) NOT NULL DEFAULT ('0.00'), "philhealthDeduction" decimal(15,2) NOT NULL DEFAULT ('0.00'), "pagibigDeduction" decimal(15,2) NOT NULL DEFAULT ('0.00'), "taxDeduction" decimal(15,2) NOT NULL DEFAULT ('0.00'), "loanDeduction" decimal(15,2) NOT NULL DEFAULT ('0.00'), "advanceDeduction" decimal(15,2) NOT NULL DEFAULT ('0.00'), "otherDeductions" decimal(15,2) NOT NULL DEFAULT ('0.00'), "deductionsTotal" decimal(15,2) NOT NULL DEFAULT ('0.00'), "netPay" decimal(15,2) NOT NULL DEFAULT ('0.00'), "computedAt" datetime, "paymentStatus" varchar(20) NOT NULL DEFAULT ('unpaid'), "paidAt" datetime, "paymentMethod" varchar(50), "paymentReference" varchar(100), "remarks" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_payroll_employee_period" ON "payroll_records" ("employeeId", "periodId") `);
        await queryRunner.query(`CREATE INDEX "idx_payroll_period" ON "payroll_records" ("periodId") `);
        await queryRunner.query(`CREATE INDEX "idx_payroll_payment_status" ON "payroll_records" ("paymentStatus") `);
        await queryRunner.query(`CREATE INDEX "idx_payroll_computed_at" ON "payroll_records" ("computedAt") `);
        await queryRunner.query(`DROP INDEX "idx_attendance_employee_timestamp"`);
        await queryRunner.query(`DROP INDEX "idx_attendance_date"`);
        await queryRunner.query(`DROP INDEX "idx_attendance_status"`);
        await queryRunner.query(`CREATE TABLE "temporary_attendance_logs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "employeeId" integer NOT NULL, "timestamp" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "source" varchar(50) NOT NULL DEFAULT ('manual'), "status" varchar(30) NOT NULL DEFAULT ('present'), "hoursWorked" decimal(5,2) NOT NULL DEFAULT (8), "overtimeHours" decimal(5,2) NOT NULL DEFAULT (0), "lateMinutes" integer NOT NULL DEFAULT (0), "note" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "payrollRecordId" integer, CONSTRAINT "uq_attendance_employee_date" UNIQUE ("employeeId", "timestamp"), CONSTRAINT "FK_b2b56c062efdfda252b5aa50e63" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_d6bd8f5a2aa259e31c314f930da" FOREIGN KEY ("payrollRecordId") REFERENCES "payroll_records" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_attendance_logs"("id", "employeeId", "timestamp", "source", "status", "hoursWorked", "overtimeHours", "lateMinutes", "note", "createdAt", "updatedAt", "payrollRecordId") SELECT "id", "employeeId", "timestamp", "source", "status", "hoursWorked", "overtimeHours", "lateMinutes", "note", "createdAt", "updatedAt", "payrollRecordId" FROM "attendance_logs"`);
        await queryRunner.query(`DROP TABLE "attendance_logs"`);
        await queryRunner.query(`ALTER TABLE "temporary_attendance_logs" RENAME TO "attendance_logs"`);
        await queryRunner.query(`CREATE INDEX "idx_attendance_employee_timestamp" ON "attendance_logs" ("employeeId", "timestamp") `);
        await queryRunner.query(`CREATE INDEX "idx_attendance_date" ON "attendance_logs" ("timestamp") `);
        await queryRunner.query(`CREATE INDEX "idx_attendance_status" ON "attendance_logs" ("status") `);
        await queryRunner.query(`DROP INDEX "idx_deduction_payroll"`);
        await queryRunner.query(`DROP INDEX "idx_deduction_type"`);
        await queryRunner.query(`DROP INDEX "idx_deduction_recurring"`);
        await queryRunner.query(`CREATE TABLE "temporary_deductions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "payrollRecordId" integer NOT NULL, "type" varchar(100) NOT NULL, "code" varchar(50), "description" text, "amount" decimal(15,2) NOT NULL DEFAULT (0), "percentage" decimal(5,2), "isRecurring" boolean NOT NULL DEFAULT (0), "appliedDate" date NOT NULL DEFAULT (CURRENT_DATE), "note" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_0b6c0952a8f25fdcf5fa1d69cf9" FOREIGN KEY ("payrollRecordId") REFERENCES "payroll_records" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_deductions"("id", "payrollRecordId", "type", "code", "description", "amount", "percentage", "isRecurring", "appliedDate", "note", "createdAt", "updatedAt") SELECT "id", "payrollRecordId", "type", "code", "description", "amount", "percentage", "isRecurring", "appliedDate", "note", "createdAt", "updatedAt" FROM "deductions"`);
        await queryRunner.query(`DROP TABLE "deductions"`);
        await queryRunner.query(`ALTER TABLE "temporary_deductions" RENAME TO "deductions"`);
        await queryRunner.query(`CREATE INDEX "idx_deduction_payroll" ON "deductions" ("payrollRecordId") `);
        await queryRunner.query(`CREATE INDEX "idx_deduction_type" ON "deductions" ("type") `);
        await queryRunner.query(`CREATE INDEX "idx_deduction_recurring" ON "deductions" ("isRecurring") `);
        await queryRunner.query(`DROP INDEX "idx_overtime_employee_date"`);
        await queryRunner.query(`DROP INDEX "idx_overtime_payroll"`);
        await queryRunner.query(`DROP INDEX "idx_overtime_status"`);
        await queryRunner.query(`DROP INDEX "idx_overtime_date"`);
        await queryRunner.query(`CREATE TABLE "temporary_overtime_logs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "employeeId" integer NOT NULL, "payrollRecordId" integer, "date" date NOT NULL, "startTime" time NOT NULL, "endTime" time NOT NULL, "hours" decimal(8,2) NOT NULL DEFAULT ('0.00'), "rate" decimal(10,2) NOT NULL DEFAULT ('1.25'), "amount" decimal(15,2) NOT NULL DEFAULT ('0.00'), "type" varchar(50) NOT NULL DEFAULT ('regular'), "approvedBy" varchar(100), "approvalStatus" varchar(20) NOT NULL DEFAULT ('pending'), "note" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_a82b7fbc01ad7a6447124261433" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_bdb03ac3d33736aa8f32136e304" FOREIGN KEY ("payrollRecordId") REFERENCES "payroll_records" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_overtime_logs"("id", "employeeId", "payrollRecordId", "date", "startTime", "endTime", "hours", "rate", "amount", "type", "approvedBy", "approvalStatus", "note", "createdAt", "updatedAt") SELECT "id", "employeeId", "payrollRecordId", "date", "startTime", "endTime", "hours", "rate", "amount", "type", "approvedBy", "approvalStatus", "note", "createdAt", "updatedAt" FROM "overtime_logs"`);
        await queryRunner.query(`DROP TABLE "overtime_logs"`);
        await queryRunner.query(`ALTER TABLE "temporary_overtime_logs" RENAME TO "overtime_logs"`);
        await queryRunner.query(`CREATE INDEX "idx_overtime_employee_date" ON "overtime_logs" ("employeeId", "date") `);
        await queryRunner.query(`CREATE INDEX "idx_overtime_payroll" ON "overtime_logs" ("payrollRecordId") `);
        await queryRunner.query(`CREATE INDEX "idx_overtime_status" ON "overtime_logs" ("approvalStatus") `);
        await queryRunner.query(`CREATE INDEX "idx_overtime_date" ON "overtime_logs" ("date") `);
        await queryRunner.query(`DROP INDEX "idx_payroll_employee_period"`);
        await queryRunner.query(`DROP INDEX "idx_payroll_period"`);
        await queryRunner.query(`DROP INDEX "idx_payroll_payment_status"`);
        await queryRunner.query(`DROP INDEX "idx_payroll_computed_at"`);
        await queryRunner.query(`CREATE TABLE "temporary_payroll_records" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "employeeId" integer NOT NULL, "periodId" integer NOT NULL, "daysPresent" integer NOT NULL DEFAULT (0), "daysAbsent" integer NOT NULL DEFAULT (0), "daysLate" integer NOT NULL DEFAULT (0), "daysHalfDay" integer NOT NULL DEFAULT (0), "basicPay" decimal(15,2) NOT NULL DEFAULT ('0.00'), "overtimeHours" decimal(10,2) NOT NULL DEFAULT ('0.00'), "overtimePay" decimal(15,2) NOT NULL DEFAULT ('0.00'), "holidayPay" decimal(15,2) NOT NULL DEFAULT ('0.00'), "nightDiffPay" decimal(15,2) NOT NULL DEFAULT ('0.00'), "allowance" decimal(15,2) NOT NULL DEFAULT ('0.00'), "bonus" decimal(15,2) NOT NULL DEFAULT ('0.00'), "grossPay" decimal(15,2) NOT NULL DEFAULT ('0.00'), "sssDeduction" decimal(15,2) NOT NULL DEFAULT ('0.00'), "philhealthDeduction" decimal(15,2) NOT NULL DEFAULT ('0.00'), "pagibigDeduction" decimal(15,2) NOT NULL DEFAULT ('0.00'), "taxDeduction" decimal(15,2) NOT NULL DEFAULT ('0.00'), "loanDeduction" decimal(15,2) NOT NULL DEFAULT ('0.00'), "advanceDeduction" decimal(15,2) NOT NULL DEFAULT ('0.00'), "otherDeductions" decimal(15,2) NOT NULL DEFAULT ('0.00'), "deductionsTotal" decimal(15,2) NOT NULL DEFAULT ('0.00'), "netPay" decimal(15,2) NOT NULL DEFAULT ('0.00'), "computedAt" datetime, "paymentStatus" varchar(20) NOT NULL DEFAULT ('unpaid'), "paidAt" datetime, "paymentMethod" varchar(50), "paymentReference" varchar(100), "remarks" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "FK_54ffbfa84af17b62537fa0f2d28" FOREIGN KEY ("employeeId") REFERENCES "employees" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_988f7a0858c8a135f2ea71cc5cc" FOREIGN KEY ("periodId") REFERENCES "payroll_periods" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_payroll_records"("id", "employeeId", "periodId", "daysPresent", "daysAbsent", "daysLate", "daysHalfDay", "basicPay", "overtimeHours", "overtimePay", "holidayPay", "nightDiffPay", "allowance", "bonus", "grossPay", "sssDeduction", "philhealthDeduction", "pagibigDeduction", "taxDeduction", "loanDeduction", "advanceDeduction", "otherDeductions", "deductionsTotal", "netPay", "computedAt", "paymentStatus", "paidAt", "paymentMethod", "paymentReference", "remarks", "createdAt", "updatedAt") SELECT "id", "employeeId", "periodId", "daysPresent", "daysAbsent", "daysLate", "daysHalfDay", "basicPay", "overtimeHours", "overtimePay", "holidayPay", "nightDiffPay", "allowance", "bonus", "grossPay", "sssDeduction", "philhealthDeduction", "pagibigDeduction", "taxDeduction", "loanDeduction", "advanceDeduction", "otherDeductions", "deductionsTotal", "netPay", "computedAt", "paymentStatus", "paidAt", "paymentMethod", "paymentReference", "remarks", "createdAt", "updatedAt" FROM "payroll_records"`);
        await queryRunner.query(`DROP TABLE "payroll_records"`);
        await queryRunner.query(`ALTER TABLE "temporary_payroll_records" RENAME TO "payroll_records"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_payroll_employee_period" ON "payroll_records" ("employeeId", "periodId") `);
        await queryRunner.query(`CREATE INDEX "idx_payroll_period" ON "payroll_records" ("periodId") `);
        await queryRunner.query(`CREATE INDEX "idx_payroll_payment_status" ON "payroll_records" ("paymentStatus") `);
        await queryRunner.query(`CREATE INDEX "idx_payroll_computed_at" ON "payroll_records" ("computedAt") `);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "idx_payroll_computed_at"`);
        await queryRunner.query(`DROP INDEX "idx_payroll_payment_status"`);
        await queryRunner.query(`DROP INDEX "idx_payroll_period"`);
        await queryRunner.query(`DROP INDEX "idx_payroll_employee_period"`);
        await queryRunner.query(`ALTER TABLE "payroll_records" RENAME TO "temporary_payroll_records"`);
        await queryRunner.query(`CREATE TABLE "payroll_records" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "employeeId" integer NOT NULL, "periodId" integer NOT NULL, "daysPresent" integer NOT NULL DEFAULT (0), "daysAbsent" integer NOT NULL DEFAULT (0), "daysLate" integer NOT NULL DEFAULT (0), "daysHalfDay" integer NOT NULL DEFAULT (0), "basicPay" decimal(15,2) NOT NULL DEFAULT ('0.00'), "overtimeHours" decimal(10,2) NOT NULL DEFAULT ('0.00'), "overtimePay" decimal(15,2) NOT NULL DEFAULT ('0.00'), "holidayPay" decimal(15,2) NOT NULL DEFAULT ('0.00'), "nightDiffPay" decimal(15,2) NOT NULL DEFAULT ('0.00'), "allowance" decimal(15,2) NOT NULL DEFAULT ('0.00'), "bonus" decimal(15,2) NOT NULL DEFAULT ('0.00'), "grossPay" decimal(15,2) NOT NULL DEFAULT ('0.00'), "sssDeduction" decimal(15,2) NOT NULL DEFAULT ('0.00'), "philhealthDeduction" decimal(15,2) NOT NULL DEFAULT ('0.00'), "pagibigDeduction" decimal(15,2) NOT NULL DEFAULT ('0.00'), "taxDeduction" decimal(15,2) NOT NULL DEFAULT ('0.00'), "loanDeduction" decimal(15,2) NOT NULL DEFAULT ('0.00'), "advanceDeduction" decimal(15,2) NOT NULL DEFAULT ('0.00'), "otherDeductions" decimal(15,2) NOT NULL DEFAULT ('0.00'), "deductionsTotal" decimal(15,2) NOT NULL DEFAULT ('0.00'), "netPay" decimal(15,2) NOT NULL DEFAULT ('0.00'), "computedAt" datetime, "paymentStatus" varchar(20) NOT NULL DEFAULT ('unpaid'), "paidAt" datetime, "paymentMethod" varchar(50), "paymentReference" varchar(100), "remarks" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "payroll_records"("id", "employeeId", "periodId", "daysPresent", "daysAbsent", "daysLate", "daysHalfDay", "basicPay", "overtimeHours", "overtimePay", "holidayPay", "nightDiffPay", "allowance", "bonus", "grossPay", "sssDeduction", "philhealthDeduction", "pagibigDeduction", "taxDeduction", "loanDeduction", "advanceDeduction", "otherDeductions", "deductionsTotal", "netPay", "computedAt", "paymentStatus", "paidAt", "paymentMethod", "paymentReference", "remarks", "createdAt", "updatedAt") SELECT "id", "employeeId", "periodId", "daysPresent", "daysAbsent", "daysLate", "daysHalfDay", "basicPay", "overtimeHours", "overtimePay", "holidayPay", "nightDiffPay", "allowance", "bonus", "grossPay", "sssDeduction", "philhealthDeduction", "pagibigDeduction", "taxDeduction", "loanDeduction", "advanceDeduction", "otherDeductions", "deductionsTotal", "netPay", "computedAt", "paymentStatus", "paidAt", "paymentMethod", "paymentReference", "remarks", "createdAt", "updatedAt" FROM "temporary_payroll_records"`);
        await queryRunner.query(`DROP TABLE "temporary_payroll_records"`);
        await queryRunner.query(`CREATE INDEX "idx_payroll_computed_at" ON "payroll_records" ("computedAt") `);
        await queryRunner.query(`CREATE INDEX "idx_payroll_payment_status" ON "payroll_records" ("paymentStatus") `);
        await queryRunner.query(`CREATE INDEX "idx_payroll_period" ON "payroll_records" ("periodId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_payroll_employee_period" ON "payroll_records" ("employeeId", "periodId") `);
        await queryRunner.query(`DROP INDEX "idx_overtime_date"`);
        await queryRunner.query(`DROP INDEX "idx_overtime_status"`);
        await queryRunner.query(`DROP INDEX "idx_overtime_payroll"`);
        await queryRunner.query(`DROP INDEX "idx_overtime_employee_date"`);
        await queryRunner.query(`ALTER TABLE "overtime_logs" RENAME TO "temporary_overtime_logs"`);
        await queryRunner.query(`CREATE TABLE "overtime_logs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "employeeId" integer NOT NULL, "payrollRecordId" integer, "date" date NOT NULL, "startTime" time NOT NULL, "endTime" time NOT NULL, "hours" decimal(8,2) NOT NULL DEFAULT ('0.00'), "rate" decimal(10,2) NOT NULL DEFAULT ('1.25'), "amount" decimal(15,2) NOT NULL DEFAULT ('0.00'), "type" varchar(50) NOT NULL DEFAULT ('regular'), "approvedBy" varchar(100), "approvalStatus" varchar(20) NOT NULL DEFAULT ('pending'), "note" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "overtime_logs"("id", "employeeId", "payrollRecordId", "date", "startTime", "endTime", "hours", "rate", "amount", "type", "approvedBy", "approvalStatus", "note", "createdAt", "updatedAt") SELECT "id", "employeeId", "payrollRecordId", "date", "startTime", "endTime", "hours", "rate", "amount", "type", "approvedBy", "approvalStatus", "note", "createdAt", "updatedAt" FROM "temporary_overtime_logs"`);
        await queryRunner.query(`DROP TABLE "temporary_overtime_logs"`);
        await queryRunner.query(`CREATE INDEX "idx_overtime_date" ON "overtime_logs" ("date") `);
        await queryRunner.query(`CREATE INDEX "idx_overtime_status" ON "overtime_logs" ("approvalStatus") `);
        await queryRunner.query(`CREATE INDEX "idx_overtime_payroll" ON "overtime_logs" ("payrollRecordId") `);
        await queryRunner.query(`CREATE INDEX "idx_overtime_employee_date" ON "overtime_logs" ("employeeId", "date") `);
        await queryRunner.query(`DROP INDEX "idx_deduction_recurring"`);
        await queryRunner.query(`DROP INDEX "idx_deduction_type"`);
        await queryRunner.query(`DROP INDEX "idx_deduction_payroll"`);
        await queryRunner.query(`ALTER TABLE "deductions" RENAME TO "temporary_deductions"`);
        await queryRunner.query(`CREATE TABLE "deductions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "payrollRecordId" integer NOT NULL, "type" varchar(100) NOT NULL, "code" varchar(50), "description" text, "amount" decimal(15,2) NOT NULL DEFAULT (0), "percentage" decimal(5,2), "isRecurring" boolean NOT NULL DEFAULT (0), "appliedDate" date NOT NULL DEFAULT (CURRENT_DATE), "note" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`INSERT INTO "deductions"("id", "payrollRecordId", "type", "code", "description", "amount", "percentage", "isRecurring", "appliedDate", "note", "createdAt", "updatedAt") SELECT "id", "payrollRecordId", "type", "code", "description", "amount", "percentage", "isRecurring", "appliedDate", "note", "createdAt", "updatedAt" FROM "temporary_deductions"`);
        await queryRunner.query(`DROP TABLE "temporary_deductions"`);
        await queryRunner.query(`CREATE INDEX "idx_deduction_recurring" ON "deductions" ("isRecurring") `);
        await queryRunner.query(`CREATE INDEX "idx_deduction_type" ON "deductions" ("type") `);
        await queryRunner.query(`CREATE INDEX "idx_deduction_payroll" ON "deductions" ("payrollRecordId") `);
        await queryRunner.query(`DROP INDEX "idx_attendance_status"`);
        await queryRunner.query(`DROP INDEX "idx_attendance_date"`);
        await queryRunner.query(`DROP INDEX "idx_attendance_employee_timestamp"`);
        await queryRunner.query(`ALTER TABLE "attendance_logs" RENAME TO "temporary_attendance_logs"`);
        await queryRunner.query(`CREATE TABLE "attendance_logs" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "employeeId" integer NOT NULL, "timestamp" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "source" varchar(50) NOT NULL DEFAULT ('manual'), "status" varchar(30) NOT NULL DEFAULT ('present'), "hoursWorked" decimal(5,2) NOT NULL DEFAULT (8), "overtimeHours" decimal(5,2) NOT NULL DEFAULT (0), "lateMinutes" integer NOT NULL DEFAULT (0), "note" text, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "payrollRecordId" integer, CONSTRAINT "uq_attendance_employee_date" UNIQUE ("employeeId", "timestamp"))`);
        await queryRunner.query(`INSERT INTO "attendance_logs"("id", "employeeId", "timestamp", "source", "status", "hoursWorked", "overtimeHours", "lateMinutes", "note", "createdAt", "updatedAt", "payrollRecordId") SELECT "id", "employeeId", "timestamp", "source", "status", "hoursWorked", "overtimeHours", "lateMinutes", "note", "createdAt", "updatedAt", "payrollRecordId" FROM "temporary_attendance_logs"`);
        await queryRunner.query(`DROP TABLE "temporary_attendance_logs"`);
        await queryRunner.query(`CREATE INDEX "idx_attendance_status" ON "attendance_logs" ("status") `);
        await queryRunner.query(`CREATE INDEX "idx_attendance_date" ON "attendance_logs" ("timestamp") `);
        await queryRunner.query(`CREATE INDEX "idx_attendance_employee_timestamp" ON "attendance_logs" ("employeeId", "timestamp") `);
        await queryRunner.query(`DROP INDEX "idx_payroll_computed_at"`);
        await queryRunner.query(`DROP INDEX "idx_payroll_payment_status"`);
        await queryRunner.query(`DROP INDEX "idx_payroll_period"`);
        await queryRunner.query(`DROP INDEX "idx_payroll_employee_period"`);
        await queryRunner.query(`DROP TABLE "payroll_records"`);
        await queryRunner.query(`DROP INDEX "idx_payroll_period_paydate"`);
        await queryRunner.query(`DROP INDEX "idx_payroll_period_status"`);
        await queryRunner.query(`DROP INDEX "idx_payroll_period_dates"`);
        await queryRunner.query(`DROP TABLE "payroll_periods"`);
        await queryRunner.query(`DROP INDEX "idx_overtime_date"`);
        await queryRunner.query(`DROP INDEX "idx_overtime_status"`);
        await queryRunner.query(`DROP INDEX "idx_overtime_payroll"`);
        await queryRunner.query(`DROP INDEX "idx_overtime_employee_date"`);
        await queryRunner.query(`DROP TABLE "overtime_logs"`);
        await queryRunner.query(`DROP INDEX "idx_employee_department"`);
        await queryRunner.query(`DROP INDEX "idx_employee_status"`);
        await queryRunner.query(`DROP INDEX "idx_employee_name"`);
        await queryRunner.query(`DROP INDEX "idx_employee_number"`);
        await queryRunner.query(`DROP TABLE "employees"`);
        await queryRunner.query(`DROP INDEX "idx_deduction_recurring"`);
        await queryRunner.query(`DROP INDEX "idx_deduction_type"`);
        await queryRunner.query(`DROP INDEX "idx_deduction_payroll"`);
        await queryRunner.query(`DROP TABLE "deductions"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP INDEX "idx_attendance_status"`);
        await queryRunner.query(`DROP INDEX "idx_attendance_date"`);
        await queryRunner.query(`DROP INDEX "idx_attendance_employee_timestamp"`);
        await queryRunner.query(`DROP TABLE "attendance_logs"`);
    }
}

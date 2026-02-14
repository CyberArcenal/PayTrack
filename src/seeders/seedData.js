// seedData.js
// Run with: node seedData.js [options]
// Example: node seedData.js --employees 20 --periods 6 --attendance --overtime --payroll
//@ts-check
const { DataSource } = require("typeorm");
const { AppDataSource } = require("../main/db/datasource");
const Employee = require("../entities/Employee");
const PayrollPeriod = require("../entities/PayrollPeriod");
const AttendanceLog = require("../entities/AttendanceLog");
const OvertimeLog = require("../entities/OvertimeLog");
const PayrollRecord = require("../entities/PayrollRecord");
const Deduction = require("../entities/Deduction");
const { AuditLog } = require("../entities/AuditLog");

// Import entities (make sure paths are correct relative to this file)

// ========== CONFIGURATION ==========
const DEFAULT_CONFIG = {
  employeeCount: 20,
  periodCount: 6, // number of payroll periods to create
  attendancePerEmployeePerPeriod: 15, // average attendance days per period
  overtimePerEmployeePerPeriod: 3, // average overtime logs per period
  deductionPerPayroll: 4, // average deductions per payroll record
  auditLogCount: 50,
  clearOnly: false,
  skipEmployees: false,
  skipPeriods: false,
  skipAttendance: false,
  skipOvertime: false,
  skipPayroll: false,
  skipDeductions: false,
  skipAudit: false,
};

// ========== RANDOM HELPERS ==========
const random = {
  int: (/** @type {number} */ min, /** @type {number} */ max) => Math.floor(Math.random() * (max - min + 1)) + min,
  float: (/** @type {number} */ min, /** @type {number} */ max, decimals = 2) => +(Math.random() * (max - min) + min).toFixed(decimals),
  date: (/** @type {{ getTime: () => number; }} */ start, /** @type {{ getTime: () => number; }} */ end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())),
  pastDate: (startYear = 2024) => random.date(new Date(startYear, 0, 1), new Date()),
  futureDate: () => random.date(new Date(), new Date(2026, 11, 31)),
  element: (/** @type {string | any[]} */ arr) => arr[Math.floor(Math.random() * arr.length)],
  phone: () => `09${random.int(100000000, 999999999)}`,
  email: (/** @type {string} */ name, /** @type {{ has: (arg0: string) => any; add: (arg0: string) => void; }} */ usedSet) => {
    let base = name.toLowerCase().replace(/\s/g, '');
    let email;
    do {
      email = `${base}${random.int(1, 9999)}@example.com`;
    } while (usedSet.has(email));
    usedSet.add(email);
    return email;
  },
  // Generate a random time string (HH:MM:SS)
  time: () => {
    const h = String(random.int(0, 23)).padStart(2, '0');
    const m = String(random.int(0, 59)).padStart(2, '0');
    const s = String(random.int(0, 59)).padStart(2, '0');
    return `${h}:${m}:${s}`;
  },
  // Generate a random date within a given payroll period
  dateInPeriod: (/** @type {{ startDate: string | number | Date; endDate: string | number | Date; }} */ period) => {
    return random.date(new Date(period.startDate), new Date(period.endDate));
  },
};

// ========== SEEDER CLASS ==========
class PayTrackSeeder {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.dataSource = null;
    this.queryRunner = null;
    this.usedEmails = new Set();
    this.usedEmployeeNumbers = new Set();
  }

  async init() {
    console.log('⏳ Initializing database connection...');
    this.dataSource = await AppDataSource.initialize();
    this.queryRunner = this.dataSource.createQueryRunner();
    console.log('✅ Database connected');
  }

  async destroy() {
    if (this.queryRunner) await this.queryRunner.release();
    if (this.dataSource) await this.dataSource.destroy();
    console.log('🔒 Connection closed');
  }

  async clearData() {
    console.log('🧹 Clearing old data...');
    await this.queryRunner.query('PRAGMA foreign_keys = OFF;');
    try {
      // Order matters: dependent tables first, then parents
      await this.queryRunner.clearTable('deductions');
      await this.queryRunner.clearTable('overtime_logs');
      await this.queryRunner.clearTable('attendance_logs');
      await this.queryRunner.clearTable('payroll_records');
      await this.queryRunner.clearTable('payroll_periods');
      await this.queryRunner.clearTable('audit_logs');
      await this.queryRunner.clearTable('employees');
    } finally {
      await this.queryRunner.query('PRAGMA foreign_keys = ON;');
    }
    console.log('✅ All tables cleared');
  }

  async seedEmployees() {
    console.log(`👤 Seeding ${this.config.employeeCount} employees...`);

    const firstNames = ['Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Rosa', 'Carlo', 'Lisa', 'Mark', 'Sarah', 'Miguel', 'Angela', 'Ricardo', 'Isabella', 'Fernando'];
    const lastNames = ['Dela Cruz', 'Santos', 'Reyes', 'Gonzales', 'Flores', 'Villanueva', 'Cruz', 'Lopez', 'Garcia', 'Martinez', 'Rodriguez', 'Fernandez'];
    const departments = ['HR', 'IT', 'Finance', 'Sales', 'Marketing', 'Operations', 'Administration'];
    const positions = ['Staff', 'Supervisor', 'Manager', 'Team Lead', 'Assistant', 'Clerk', 'Specialist'];
    const paymentMethods = ['bank', 'cash', 'check'];
    const banks = ['BDO', 'BPI', 'Metrobank', 'PNB', 'Security Bank', 'Landbank'];

    const employees = [];
    for (let i = 1; i <= this.config.employeeCount; i++) {
      const firstName = random.element(firstNames);
      const lastName = random.element(lastNames);
      const fullName = `${firstName} ${lastName}`;

      // Generate unique employee number
      let empNumber;
      do {
        empNumber = `EMP${String(random.int(1000, 9999))}`;
      } while (this.usedEmployeeNumbers.has(empNumber));
      this.usedEmployeeNumbers.add(empNumber);

      const basePay = random.float(20000, 60000);
      const dailyRate = basePay / 22; // assuming 22 working days per month
      const hourlyRate = dailyRate / 8;

      employees.push({
        employeeNumber: empNumber,
        firstName,
        middleName: Math.random() > 0.5 ? random.element(['D.', 'M.', 'A.', 'C.', 'R.', null]) : null,
        lastName,
        email: random.email(fullName, this.usedEmails),
        phone: random.phone(),
        address: `${random.int(10, 999)} ${random.element(['Rizal St', 'Mabini St', 'Bonifacio St', 'Luna St'])}, ${random.element(['Manila', 'Quezon City', 'Makati', 'Cebu', 'Davao'])}`,
        birthDate: random.date(new Date(1970, 0, 1), new Date(2000, 11, 31)).toISOString().split('T')[0],
        hireDate: random.date(new Date(2015, 0, 1), new Date()).toISOString().split('T')[0],
        position: random.element(positions),
        department: random.element(departments),
        basePay,
        dailyRate,
        hourlyRate,
        overtimeRate: random.float(1.25, 1.5, 2),
        paymentMethod: random.element(paymentMethods),
        bankName: Math.random() > 0.5 ? random.element(banks) : null,
        accountNumber: Math.random() > 0.5 ? `${random.int(1000000000, 9999999999)}` : null,
        status: random.element(['active', 'active', 'active', 'inactive', 'on-leave']), // mostly active
        employmentType: random.element(['regular', 'regular', 'contractual', 'part-time', 'probationary']),
        sssNumber: `SSS${random.int(100000000, 999999999)}`,
        philhealthNumber: `PH${random.int(100000000, 999999999)}`,
        pagibigNumber: `PAG${random.int(100000000, 999999999)}`,
        tinNumber: `TIN${random.int(100000000, 999999999)}`,
      });
    }

    const repo = this.dataSource.getRepository(Employee);
    const saved = await repo.save(employees);
    console.log(`✅ ${saved.length} employees saved`);
    return saved;
  }

  async seedPayrollPeriods() {
    console.log(`📅 Seeding ${this.config.periodCount} payroll periods...`);

    const periods = [];
    const today = new Date();
    let startYear = 2025;
    let month = 0; // January

    for (let i = 0; i < this.config.periodCount; i++) {
      // Create semi-monthly periods: 1st half (1-15), 2nd half (16-end of month)
      const periodType = 'semi-monthly';
      let startDate, endDate, name;

      if (i % 2 === 0) {
        // 1st half
        startDate = new Date(startYear, month, 1);
        endDate = new Date(startYear, month, 15);
        name = `${startDate.toLocaleString('default', { month: 'long' })} ${startYear} 1st Half`;
      } else {
        // 2nd half
        startDate = new Date(startYear, month, 16);
        endDate = new Date(startYear, month + 1, 0); // last day of month
        name = `${startDate.toLocaleString('default', { month: 'long' })} ${startYear} 2nd Half`;
        month++;
        if (month > 11) {
          month = 0;
          startYear++;
        }
      }

      // Ensure dates are within reasonable range
      if (endDate > today) {
        // If period is in future, set status to 'open'? We'll set some as closed for past periods
        break;
      }

      const workingDays = random.int(10, 13); // approximate working days in half-month
      const status = endDate < today ? 'closed' : (Math.random() > 0.5 ? 'open' : 'processing');

      periods.push({
        name,
        periodType,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        payDate: new Date(endDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // pay 5 days after end
        workingDays,
        status,
        lockedAt: status === 'closed' ? new Date().toISOString() : null,
        closedAt: status === 'closed' ? new Date().toISOString() : null,
        totalEmployees: 0,
        totalGrossPay: 0,
        totalDeductions: 0,
        totalNetPay: 0,
      });
    }

    const repo = this.dataSource.getRepository(PayrollPeriod);
    const saved = await repo.save(periods);
    console.log(`✅ ${saved.length} payroll periods saved`);
    return saved;
  }

  /**
     * @param {any[]} employees
     * @param {any[]} periods
     */
  async seedAttendanceLogs(employees, periods) {
    console.log(`⏰ Seeding attendance logs for each employee in each period...`);

    const logs = [];
    const statuses = ['present', 'present', 'present', 'late', 'absent', 'half-day']; // weighted

    for (const employee of employees) {
      for (const period of periods) {
        // Determine how many days to log (random between 10 and period.workingDays)
        const daysToLog = random.int(10, period.workingDays);
        const datesInPeriod = this.getDatesBetween(period.startDate, period.endDate);
        // Shuffle and take first daysToLog
        const shuffled = datesInPeriod.sort(() => 0.5 - Math.random());
        const selectedDates = shuffled.slice(0, daysToLog);

        for (const dateStr of selectedDates) {
          const status = random.element(statuses);
          const timestamp = new Date(dateStr);
          timestamp.setHours(random.int(8, 10), random.int(0, 59), 0); // random check-in time

          let hoursWorked = 8.0;
          let lateMinutes = 0;
          if (status === 'late') {
            lateMinutes = random.int(5, 120);
            hoursWorked = Math.max(0, 8 - lateMinutes / 60);
          } else if (status === 'half-day') {
            hoursWorked = 4.0;
          } else if (status === 'absent') {
            hoursWorked = 0.0;
            // we can skip inserting absent logs or insert with 0 hours? Typically absent has no log.
            continue; // skip absent entries, they will be inferred in payroll
          }

          logs.push({
            employeeId: employee.id,
            timestamp: timestamp.toISOString(),
            source: random.element(['manual', 'rfid', 'biometric']),
            status,
            hoursWorked,
            overtimeHours: 0, // will be in OvertimeLog
            lateMinutes,
            note: Math.random() > 0.9 ? 'Forgot to scan' : null,
          });
        }
      }
    }

    // Add some random overtime logs later (separate step)

    const repo = this.dataSource.getRepository(AttendanceLog);
    // Save in batches to avoid memory issues
    const batchSize = 500;
    for (let i = 0; i < logs.length; i += batchSize) {
      const batch = logs.slice(i, i + batchSize);
      await repo.save(batch);
      console.log(`   ... saved ${Math.min(i + batchSize, logs.length)} / ${logs.length} attendance logs`);
    }
    console.log(`✅ ${logs.length} attendance logs saved`);
    return logs;
  }

  /**
     * @param {any[]} employees
     * @param {any[]} periods
     */
  async seedOvertimeLogs(employees, periods) {
    console.log(`⏱️ Seeding overtime logs...`);

    const logs = [];
    const types = ['regular', 'regular', 'holiday', 'special-holiday', 'rest-day'];
    const approvalStatuses = ['approved', 'approved', 'pending', 'approved', 'approved', 'rejected'];

    for (const employee of employees) {
      // For each period, add some overtime logs
      for (const period of periods) {
        const overtimeCount = random.int(0, this.config.overtimePerEmployeePerPeriod);
        const datesInPeriod = this.getDatesBetween(period.startDate, period.endDate);
        for (let i = 0; i < overtimeCount; i++) {
          const date = random.element(datesInPeriod);
          const startHour = random.int(17, 20);
          const endHour = startHour + random.int(1, 4);
          const startTime = `${String(startHour).padStart(2, '0')}:00:00`;
          const endTime = `${String(endHour).padStart(2, '0')}:00:00`;
          const hours = endHour - startHour;
          const rate = random.float(1.25, 2.0, 2);
          const amount = employee.hourlyRate * hours * rate;

          logs.push({
            employeeId: employee.id,
            date: date,
            startTime,
            endTime,
            hours,
            rate,
            amount,
            type: random.element(types),
            approvedBy: Math.random() > 0.5 ? 'Manager' : 'Supervisor',
            approvalStatus: random.element(approvalStatuses),
            note: Math.random() > 0.7 ? 'Project deadline' : null,
          });
        }
      }
    }

    const repo = this.dataSource.getRepository(OvertimeLog);
    await repo.save(logs);
    console.log(`✅ ${logs.length} overtime logs saved`);
    return logs;
  }

  /**
     * @param {any[]} employees
     * @param {any[]} periods
     * @param {any[]} attendanceLogs
     * @param {any[]} overtimeLogs
     */
  async seedPayrollRecords(employees, periods, attendanceLogs, overtimeLogs) {
    console.log(`💰 Seeding payroll records...`);

    const records = [];
    const paymentStatuses = ['unpaid', 'paid', 'paid', 'partially-paid'];
    const paymentMethods = ['bank transfer', 'cash', 'check'];

    for (const employee of employees) {
      for (const period of periods) {
        // Gather attendance for this employee and period
        const periodStart = new Date(period.startDate);
        const periodEnd = new Date(period.endDate);
        const empAttendance = attendanceLogs.filter((/** @type {{ employeeId: any; timestamp: string | number | Date; }} */ log) =>
          log.employeeId === employee.id &&
          new Date(log.timestamp) >= periodStart &&
          new Date(log.timestamp) <= periodEnd
        );

        const daysPresent = empAttendance.filter((/** @type {{ status: string; }} */ a) => a.status === 'present').length;
        const daysLate = empAttendance.filter((/** @type {{ status: string; }} */ a) => a.status === 'late').length;
        const daysHalfDay = empAttendance.filter((/** @type {{ status: string; }} */ a) => a.status === 'half-day').length;
        const daysAbsent = period.workingDays - (daysPresent + daysLate + daysHalfDay); // approx

        // Basic pay = dailyRate * (daysPresent + daysHalfDay*0.5)
        const basicPay = employee.dailyRate * (daysPresent + (daysHalfDay * 0.5));

        // Overtime for this period (approved only)
        const empOvertime = overtimeLogs.filter((/** @type {{ employeeId: any; date: string | number | Date; approvalStatus: string; }} */ ot) =>
          ot.employeeId === employee.id &&
          new Date(ot.date) >= periodStart &&
          new Date(ot.date) <= periodEnd &&
          ot.approvalStatus === 'approved'
        );
        const overtimeHours = empOvertime.reduce((/** @type {any} */ sum, /** @type {{ hours: any; }} */ ot) => sum + ot.hours, 0);
        const overtimePay = empOvertime.reduce((/** @type {any} */ sum, /** @type {{ amount: any; }} */ ot) => sum + ot.amount, 0);

        // Other earnings (simplified)
        const holidayPay = 0;
        const nightDiffPay = 0;
        const allowance = employee.basePay * 0.05; // 5% allowance
        const bonus = Math.random() > 0.8 ? random.float(1000, 5000) : 0;

        const grossPay = basicPay + overtimePay + holidayPay + nightDiffPay + allowance + bonus;

        // Deductions will be added later, but we need the record first
        // We'll compute netPay after deductions are added
        // For now, set default deductions to 0
        const sss = 0, philhealth = 0, pagibig = 0, tax = 0, loan = 0, advance = 0, other = 0;
        const deductionsTotal = sss + philhealth + pagibig + tax + loan + advance + other;
        const netPay = grossPay - deductionsTotal;

        const record = {
          employeeId: employee.id,
          periodId: period.id,
          daysPresent,
          daysAbsent,
          daysLate,
          daysHalfDay,
          basicPay,
          overtimeHours,
          overtimePay,
          holidayPay,
          nightDiffPay,
          allowance,
          bonus,
          grossPay,
          sssDeduction: sss,
          philhealthDeduction: philhealth,
          pagibigDeduction: pagibig,
          taxDeduction: tax,
          loanDeduction: loan,
          advanceDeduction: advance,
          otherDeductions: other,
          deductionsTotal,
          netPay,
          computedAt: new Date().toISOString(),
          paymentStatus: random.element(paymentStatuses),
          paidAt: Math.random() > 0.5 ? new Date().toISOString() : null,
          paymentMethod: random.element(paymentMethods),
          paymentReference: `REF${random.int(100000, 999999)}`,
          remarks: null,
        };
        records.push(record);
      }
    }

    const repo = this.dataSource.getRepository(PayrollRecord);
    const saved = await repo.save(records);
    console.log(`✅ ${saved.length} payroll records saved`);
    return saved;
  }

  /**
     * @param {any[]} payrollRecords
     */
  async seedDeductions(payrollRecords) {
    console.log(`💸 Seeding deductions for payroll records...`);

    const deductionTypes = [
      { type: 'sss', code: 'SSS', desc: 'SSS Contribution' },
      { type: 'philhealth', code: 'PH', desc: 'PhilHealth Contribution' },
      { type: 'pag-ibig', code: 'PAG', desc: 'Pag-IBIG Contribution' },
      { type: 'tax', code: 'TAX', desc: 'Withholding Tax' },
      { type: 'loan', code: 'LOAN', desc: 'Company Loan' },
      { type: 'advance', code: 'ADV', desc: 'Salary Advance' },
      { type: 'other', code: 'OTHER', desc: 'Miscellaneous' },
    ];

    const deductions = [];

    for (const record of payrollRecords) {
      // Determine number of deductions for this record
      const numDeductions = random.int(1, this.config.deductionPerPayroll);
      const selectedTypes = this.shuffleArray(deductionTypes).slice(0, numDeductions);

      for (const dt of selectedTypes) {
        let amount = 0;
        let percentage = null;
        if (dt.type === 'sss') {
          amount = random.float(200, 1200);
        } else if (dt.type === 'philhealth') {
          amount = random.float(150, 800);
        } else if (dt.type === 'pag-ibig') {
          amount = random.float(100, 400);
        } else if (dt.type === 'tax') {
          amount = record.grossPay * random.float(0.05, 0.15);
        } else if (dt.type === 'loan') {
          amount = random.float(500, 5000);
        } else if (dt.type === 'advance') {
          amount = random.float(1000, 10000);
        } else {
          amount = random.float(50, 1000);
        }

        deductions.push({
          payrollRecordId: record.id,
          type: dt.type,
          code: dt.code,
          description: dt.desc,
          amount,
          percentage,
          isRecurring: Math.random() > 0.7,
          appliedDate: record.period ? random.date(new Date(record.period.startDate), new Date(record.period.endDate)).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          note: null,
        });
      }

      // Also update the payroll record's deduction fields (we can do later via update or recompute)
      // For simplicity, we'll leave them as seeded; actual payroll computation would set them.
    }

    const repo = this.dataSource.getRepository(Deduction);
    await repo.save(deductions);
    console.log(`✅ ${deductions.length} deductions saved`);

    // Now update payroll records to reflect deduction totals (optional)
    // Could be done but not necessary for seed data.
    return deductions;
  }

  async seedAuditLogs() {
    console.log(`📝 Seeding ${this.config.auditLogCount} audit logs...`);
    const actions = ['CREATE', 'UPDATE', 'DELETE', 'VIEW'];
    const entities = ['Employee', 'AttendanceLog', 'PayrollPeriod', 'PayrollRecord', 'Deduction', 'OvertimeLog'];

    const logs = [];
    for (let i = 0; i < this.config.auditLogCount; i++) {
      logs.push({
        action: random.element(actions),
        entity: random.element(entities),
        entityId: random.int(1, 100),
        timestamp: random.pastDate(),
        user: random.element(['admin', 'system', 'hr_clerk', 'manager']),
      });
    }

    const repo = this.dataSource.getRepository(AuditLog);
    await repo.save(logs);
    console.log(`✅ ${this.config.auditLogCount} audit logs saved`);
  }

  // Helper: get array of date strings between two dates (inclusive)
  /**
     * @param {string | number | Date} startStr
     * @param {string | number | Date} endStr
     */
  getDatesBetween(startStr, endStr) {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const dates = [];
    let current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  /**
     * @param {any[]} arr
     */
  shuffleArray(arr) {
    return arr.sort(() => 0.5 - Math.random());
  }

  async run() {
    try {
      await this.init();
      await this.queryRunner.startTransaction();

      if (!this.config.clearOnly) {
        await this.clearData();
      }

      if (this.config.clearOnly) {
        console.log('🧹 Clear only mode – no seeding performed.');
        await this.queryRunner.commitTransaction();
        return;
      }

      /**
         * @type {string | any[]}
         */
      let employees = [];
      /**
         * @type {string | any[]}
         */
      let periods = [];
      /**
         * @type {string | any[]}
         */
      let attendanceLogs = [];
      /**
         * @type {string | any[]}
         */
      let overtimeLogs = [];
      /**
         * @type {string | any[]}
         */
      let payrollRecords = [];
      let deductions = [];

      // Seeding order respects foreign keys
      if (!this.config.skipEmployees) employees = await this.seedEmployees();
      if (!this.config.skipPeriods) periods = await this.seedPayrollPeriods();
      if (!this.config.skipAttendance && employees.length && periods.length) {
        attendanceLogs = await this.seedAttendanceLogs(employees, periods);
      }
      if (!this.config.skipOvertime && employees.length && periods.length) {
        overtimeLogs = await this.seedOvertimeLogs(employees, periods);
      }
      if (!this.config.skipPayroll && employees.length && periods.length) {
        payrollRecords = await this.seedPayrollRecords(employees, periods, attendanceLogs, overtimeLogs);
      }
      if (!this.config.skipDeductions && payrollRecords.length) {
        deductions = await this.seedDeductions(payrollRecords);
      }
      if (!this.config.skipAudit) await this.seedAuditLogs();

      await this.queryRunner.commitTransaction();

      console.log('\n🎉 SEED COMPLETED SUCCESSFULLY!');
      console.log(`   Employees: ${employees.length}`);
      console.log(`   Payroll Periods: ${periods.length}`);
      console.log(`   Attendance Logs: ${attendanceLogs.length}`);
      console.log(`   Overtime Logs: ${overtimeLogs.length}`);
      console.log(`   Payroll Records: ${payrollRecords.length}`);
      console.log(`   Deductions: ${deductions.length}`);
      console.log(`   Audit Logs: ${this.config.auditLogCount}`);

    } catch (error) {
      console.error('\n❌ Seeding failed – rolling back...', error);
      if (this.queryRunner) await this.queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await this.destroy();
    }
  }
}

// ========== COMMAND LINE HANDLER ==========
function parseArgs() {
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_CONFIG };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--clear-only':
        config.clearOnly = true;
        break;
      case '--employees':
        config.skipEmployees = false;
        config.employeeCount = parseInt(args[++i]) || DEFAULT_CONFIG.employeeCount;
        break;
      case '--periods':
        config.skipPeriods = false;
        config.periodCount = parseInt(args[++i]) || DEFAULT_CONFIG.periodCount;
        break;
      case '--attendance':
        config.skipAttendance = false;
        // optional count? we can add if needed
        break;
      case '--overtime':
        config.skipOvertime = false;
        break;
      case '--payroll':
        config.skipPayroll = false;
        break;
      case '--deductions':
        config.skipDeductions = false;
        break;
      case '--audit':
        config.skipAudit = false;
        config.auditLogCount = parseInt(args[++i]) || DEFAULT_CONFIG.auditLogCount;
        break;
      case '--skip-employees':
        config.skipEmployees = true;
        break;
      case '--skip-periods':
        config.skipPeriods = true;
        break;
      case '--skip-attendance':
        config.skipAttendance = true;
        break;
      case '--skip-overtime':
        config.skipOvertime = true;
        break;
      case '--skip-payroll':
        config.skipPayroll = true;
        break;
      case '--skip-deductions':
        config.skipDeductions = true;
        break;
      case '--skip-audit':
        config.skipAudit = true;
        break;
      case '--help':
        console.log(`
Usage: node seedData.js [options]

Options:
  --clear-only                Only wipe database, do not seed.
  --employees [count]         Seed employees (default: 20)
  --periods [count]           Seed payroll periods (default: 6)
  --attendance                Seed attendance logs (requires employees & periods)
  --overtime                  Seed overtime logs
  --payroll                   Seed payroll records
  --deductions                Seed deductions (requires payroll records)
  --audit [count]             Seed audit logs (default: 50)
  --skip-employees            Skip seeding employees
  --skip-periods              Skip seeding payroll periods
  --skip-attendance           Skip seeding attendance logs
  --skip-overtime             Skip seeding overtime logs
  --skip-payroll              Skip seeding payroll records
  --skip-deductions           Skip seeding deductions
  --skip-audit                Skip seeding audit logs
  --help                      Show this help

Examples:
  node seedData.js --employees 15 --periods 4 --attendance --overtime --payroll --deductions
  node seedData.js --clear-only
  node seedData.js --skip-attendance --skip-overtime
`);
        process.exit(0);
    }
  }
  return config;
}

// ========== EXECUTION ==========
if (require.main === module) {
  const config = parseArgs();
  const seeder = new PayTrackSeeder(config);
  seeder.run().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { PayTrackSeeder, DEFAULT_CONFIG };
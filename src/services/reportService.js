//@ts-check
// @ts-ignore
const { AppDataSource } = require("../main/db/datasource");
const attendanceLogService = require("./AttendanceLog");
const auditLogService = require("./AuditLog");
const deductionService = require("./Deduction");
const employeeService = require("./Employee");
const overtimeLogService = require("./OvertimeLog");
const payrollPeriodService = require("./PayrollPeriod");
const payrollRecordService = require("./PayrollRecord");

class ReportService {
  constructor() {
    // Lazily load other services to avoid circular dependencies
  }

  async initialize() {
    console.log("ReportService initialized");
  }

  async getServices() {
    // Dynamic requires to prevent circular dependencies
    return {
      payrollRecord: payrollRecordService,
      attendance: attendanceLogService,
      employee: employeeService,
      period: payrollPeriodService,
      deduction: deductionService,
      overtime: overtimeLogService,
    };
  }

  /**
   * Generate payroll report for a given period
   * @param {number} periodId
   * @param {string} format - 'csv' or 'json' or 'pdf'
   * @param {string} user
   */
  async generatePayrollReport(periodId, format = "json", user = "system") {
    try {
      const { payrollRecord, period } = await this.getServices();
      const periodObj = await period.findById(periodId);
      const records = await payrollRecord.findAll({ periodId });

      const reportData = records.map((rec) => ({
        employeeId: rec.employeeId,
        // @ts-ignore
        employeeName: `${rec.employee?.lastName}, ${rec.employee?.firstName}`,
        // @ts-ignore
        department: rec.employee?.department,
        daysPresent: rec.daysPresent,
        daysAbsent: rec.daysAbsent,
        daysLate: rec.daysLate,
        daysHalfDay: rec.daysHalfDay,
        basicPay: rec.basicPay,
        overtimePay: rec.overtimePay,
        holidayPay: rec.holidayPay,
        allowance: rec.allowance,
        bonus: rec.bonus,
        grossPay: rec.grossPay,
        sssDeduction: rec.sssDeduction,
        philhealthDeduction: rec.philhealthDeduction,
        pagibigDeduction: rec.pagibigDeduction,
        taxDeduction: rec.taxDeduction,
        loanDeduction: rec.loanDeduction,
        advanceDeduction: rec.advanceDeduction,
        otherDeductions: rec.otherDeductions,
        deductionsTotal: rec.deductionsTotal,
        netPay: rec.netPay,
        paymentStatus: rec.paymentStatus,
      }));

      const summary = {
        periodName: periodObj.name,
        startDate: periodObj.startDate,
        endDate: periodObj.endDate,
        payDate: periodObj.payDate,
        totalEmployees: records.length,
        totalGrossPay: records.reduce(
          // @ts-ignore
          (sum, r) => sum + parseFloat(r.grossPay),
          0,
        ),
        totalDeductions: records.reduce(
          // @ts-ignore
          (sum, r) => sum + parseFloat(r.deductionsTotal),
          0,
        ),
        // @ts-ignore
        totalNetPay: records.reduce((sum, r) => sum + parseFloat(r.netPay), 0),
      };

      let output;
      if (format === "csv") {
        output = this.convertToCSV(reportData, summary);
      } else if (format === "json") {
        output = { summary, records: reportData };
      } else {
        output = { summary, records: reportData, format: "pdf-placeholder" };
      }

      await auditLogService.logExport(
        "PayrollReport",
        format,
        { periodId },
        user,
      );
      return output;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to generate payroll report:", error.message);
      throw error;
    }
  }

  /**
   * Generate attendance report for an employee or all employees
   * @param {Object} options - { employeeId, startDate, endDate, status }
   * @param {string} format
   * @param {string} user
   */
  async generateAttendanceReport(options, format = "json", user = "system") {
    try {
      const { attendance } = await this.getServices();
      const logs = await attendance.findAll(options);

      const reportData = logs.map((log) => ({
        employeeId: log.employeeId,
        // @ts-ignore
        employeeName: `${log.employee?.lastName}, ${log.employee?.firstName}`,
        timestamp: log.timestamp,
        // @ts-ignore
        date: log.timestamp.toISOString().split("T")[0],
        // @ts-ignore
        time: log.timestamp.toTimeString().split(" ")[0],
        source: log.source,
        status: log.status,
        hoursWorked: log.hoursWorked,
        overtimeHours: log.overtimeHours,
        lateMinutes: log.lateMinutes,
        note: log.note,
      }));

      const summary = {
        totalRecords: logs.length,
        totalHoursWorked: logs.reduce(
          // @ts-ignore
          (sum, l) => sum + parseFloat(l.hoursWorked),
          0,
        ),
        totalOvertimeHours: logs.reduce(
          // @ts-ignore
          (sum, l) => sum + parseFloat(l.overtimeHours),
          0,
        ),
        totalLateMinutes: logs.reduce(
          // @ts-ignore
          (sum, l) => sum + (l.lateMinutes || 0),
          0,
        ),
      };

      let output;
      if (format === "csv") {
        output = this.convertToCSV(reportData, summary);
      } else {
        output = { summary, records: reportData };
      }

      await auditLogService.logExport(
        "AttendanceReport",
        format,
        options,
        user,
      );
      return output;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to generate attendance report:", error.message);
      throw error;
    }
  }

  /**
   * Generate employee summary (YTD, etc.)
   * @param {number} employeeId
   * @param {number} year
   * @param {string} format
   * @param {string} user
   */
  async generateEmployeeSummary(
    employeeId,
    year,
    format = "json",
    user = "system",
  ) {
    try {
      const { employee, payrollRecord, attendance } = await this.getServices();
      const emp = await employee.findById(employeeId);
      if (!emp) throw new Error("Employee not found");

      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const payrolls = await payrollRecord.findAll({
        employeeId,
        startDate,
        endDate,
      });

      const attendances = await attendance.findAll({
        employeeId,
        startDate,
        endDate,
      });

      const summary = {
        employee: {
          id: emp.id,
          name: `${emp.lastName}, ${emp.firstName} ${emp.middleName || ""}`,
          employeeNumber: emp.employeeNumber,
          department: emp.department,
          position: emp.position,
          hireDate: emp.hireDate,
        },
        year,
        payrollSummary: {
          totalPeriods: payrolls.length,
          totalGrossPay: payrolls.reduce(
            // @ts-ignore
            (sum, p) => sum + parseFloat(p.grossPay),
            0,
          ),
          totalDeductions: payrolls.reduce(
            // @ts-ignore
            (sum, p) => sum + parseFloat(p.deductionsTotal),
            0,
          ),
          totalNetPay: payrolls.reduce(
            // @ts-ignore
            (sum, p) => sum + parseFloat(p.netPay),
            0,
          ),
        },
        attendanceSummary: {
          totalDays: attendances.length,
          totalHoursWorked: attendances.reduce(
            // @ts-ignore
            (sum, a) => sum + parseFloat(a.hoursWorked),
            0,
          ),
          totalOvertimeHours: attendances.reduce(
            // @ts-ignore
            (sum, a) => sum + parseFloat(a.overtimeHours),
            0,
          ),
          totalLateMinutes: attendances.reduce(
            // @ts-ignore
            (sum, a) => sum + (a.lateMinutes || 0),
            0,
          ),
        },
        payrollRecords: payrolls.map((p) => ({
          // @ts-ignore
          period: p.period?.name,
          grossPay: p.grossPay,
          deductions: p.deductionsTotal,
          netPay: p.netPay,
        })),
      };

      let output;
      if (format === "csv") {
        const flatData = summary.payrollRecords;
        output = this.convertToCSV(flatData, summary);
      } else {
        output = summary;
      }

      await auditLogService.logExport(
        "EmployeeSummary",
        format,
        { employeeId, year },
        user,
      );
      return output;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to generate employee summary:", error.message);
      throw error;
    }
  }

  /**
   * Generate tax report (by period or yearly)
   * @param {number} periodId
   * @param {string} format
   * @param {string} user
   */
  async generateTaxReport(periodId, format = "json", user = "system") {
    try {
      const { payrollRecord, period } = await this.getServices();
      const periodObj = await period.findById(periodId);
      const records = await payrollRecord.findAll({ periodId });

      const taxData = records
        // @ts-ignore
        .filter((r) => r.taxDeduction > 0)
        .map((r) => ({
          employeeId: r.employeeId,
          // @ts-ignore
          employeeName: `${r.employee?.lastName}, ${r.employee?.firstName}`,
          // @ts-ignore
          tin: r.employee?.tinNumber,
          basicPay: r.basicPay,
          grossPay: r.grossPay,
          taxDeduction: r.taxDeduction,
        }));

      const summary = {
        periodName: periodObj.name,
        totalEmployeesWithTax: taxData.length,
        totalTaxCollected: taxData.reduce(
          // @ts-ignore
          (sum, t) => sum + parseFloat(t.taxDeduction),
          0,
        ),
      };

      let output;
      if (format === "csv") {
        output = this.convertToCSV(taxData, summary);
      } else {
        output = { summary, records: taxData };
      }

      await auditLogService.logExport("TaxReport", format, { periodId }, user);
      return output;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to generate tax report:", error.message);
      throw error;
    }
  }

  /**
   * Generate deductions report (by period, by type)
   * @param {number} periodId
   * @param {string} format
   * @param {string} user
   */
  async generateDeductionsReport(periodId, format = "json", user = "system") {
    try {
      const { deduction, period } = await this.getServices();
      const periodObj = await period.findById(periodId);
      const { deduction: deductionRepo } = await deduction.getRepositories();
      // @ts-ignore
      const deductions = await deductionRepo
        .createQueryBuilder("deduction")
        .leftJoinAndSelect("deduction.payrollRecord", "payrollRecord")
        .leftJoinAndSelect("payrollRecord.employee", "employee")
        .where("payrollRecord.periodId = :periodId", { periodId })
        .getMany();

      const groupedByType = {};
      deductions.forEach((d) => {
        // @ts-ignore
        if (!groupedByType[d.type]) groupedByType[d.type] = [];
        // @ts-ignore
        groupedByType[d.type].push({
          // @ts-ignore
          employeeName: `${d.payrollRecord?.employee?.lastName}, ${d.payrollRecord?.employee?.firstName}`,
          amount: d.amount,
          description: d.description,
        });
      });

      const summary = {
        periodName: periodObj.name,
        totalDeductions: deductions.length,
        totalAmount: deductions.reduce(
          // @ts-ignore
          (sum, d) => sum + parseFloat(d.amount),
          0,
        ),
        byType: Object.keys(groupedByType).map((type) => ({
          type,
          // @ts-ignore
          count: groupedByType[type].length,
          // @ts-ignore
          total: groupedByType[type].reduce((s, d) => s + d.amount, 0),
        })),
      };

      let output;
      if (format === "csv") {
        const flatData = deductions.map((d) => ({
          type: d.type,
          // @ts-ignore
          employee: `${d.payrollRecord?.employee?.lastName}, ${d.payrollRecord?.employee?.firstName}`,
          amount: d.amount,
          description: d.description,
        }));
        output = this.convertToCSV(flatData, summary);
      } else {
        output = { summary, grouped: groupedByType };
      }

      await auditLogService.logExport(
        "DeductionsReport",
        format,
        { periodId },
        user,
      );
      return output;
    } catch (error) {
      // @ts-ignore
      console.error("Failed to generate deductions report:", error.message);
      throw error;
    }
  }

  /**
   * Simple CSV converter for array of objects
   * @param {Array<Object>} data
   * @param {Object} summary
   * @returns {string} CSV string
   */
  convertToCSV(data, summary = {}) {
    if (!data || data.length === 0) return "No data";

    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(","));

    for (const row of data) {
      const values = headers.map((header) => {
        // @ts-ignore
        const val = row[header] !== undefined ? row[header] : "";
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(","));
    }

    if (Object.keys(summary).length > 0) {
      csvRows.push("");
      csvRows.push("# Summary");
      Object.entries(summary).forEach(([key, val]) => {
        csvRows.push(`# ${key}: ${val}`);
      });
    }

    return csvRows.join("\n");
  }
}

// Singleton instance
const reportService = new ReportService();
module.exports = reportService;

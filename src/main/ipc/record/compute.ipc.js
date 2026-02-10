// src/ipc/handlers/payroll-record/compute.ipc.js
// @ts-check
const AttendanceLog = require("../../../entities/AttendanceLog");
const OvertimeLog = require("../../../entities/OvertimeLog");
const PayrollRecord = require("../../../entities/PayrollRecord");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");

/**
 * Compute payroll for a specific record
 * @param {Object} params - Computation parameters
 * @param {number} params.payrollRecordId - Payroll record ID
 * @param {boolean} [params.recalculateAll] - Force recalculate all values
 * @param {import('typeorm').QueryRunner} queryRunner - Transaction query runner
 * @returns {Promise<{status: boolean, message: string, data: Object|null}>}
 */
async function computePayrollRecord(params, queryRunner) {
  try {
    const { payrollRecordId, recalculateAll = false } = params;

    if (!payrollRecordId || isNaN(payrollRecordId)) {
      return {
        status: false,
        message: "Invalid payroll record ID",
        data: null,
      };
    }

    const payrollRecordRepo = queryRunner.manager.getRepository(PayrollRecord);
    const attendanceRepo = queryRunner.manager.getRepository(AttendanceLog);
    const overtimeRepo = queryRunner.manager.getRepository(OvertimeLog);

    // Get payroll record with relations
    const payrollRecord = await payrollRecordRepo.findOne({
      where: { id: parseInt(payrollRecordId) },
      relations: ["employee", "period"],
    });

    if (!payrollRecord) {
      return {
        status: false,
        message: "Payroll record not found",
        data: null,
      };
    }

    // Skip if already computed and not forcing recalc
    if (payrollRecord.computedAt && !recalculateAll) {
      return {
        status: false,
        message:
          "Payroll already computed. Use recalculateAll flag to recompute.",
        data: payrollRecord,
      };
    }

    const { employee, period } = payrollRecord;

    // Calculate attendance statistics
    const attendanceStats = await calculateAttendanceStats(
      employee.id,
      period.startDate,
      period.endDate,
      attendanceRepo,
    );

    // Calculate overtime
    const overtimeStats = await calculateOvertimeStats(
      employee.id,
      period.startDate,
      period.endDate,
      overtimeRepo,
      employee.hourlyRate,
      employee.overtimeRate,
    );

    // Calculate basic pay (days present * daily rate)
    const basicPay = attendanceStats.daysPresent * employee.dailyRate;

    // Calculate gross pay
    const grossPay = basicPay + overtimeStats.totalOvertimePay;

    // Calculate deductions (simplified - in real app, use calculateGovernmentContributions)
    const deductions = calculateBasicDeductions(grossPay);

    // Calculate net pay
    const netPay = grossPay - deductions.total;

    // Update payroll record
    payrollRecord.daysPresent = attendanceStats.daysPresent;
    payrollRecord.daysAbsent = attendanceStats.daysAbsent;
    payrollRecord.daysLate = attendanceStats.daysLate;
    payrollRecord.daysHalfDay = attendanceStats.daysHalfDay;
    payrollRecord.basicPay = basicPay;
    payrollRecord.overtimeHours = overtimeStats.totalOvertimeHours;
    payrollRecord.overtimePay = overtimeStats.totalOvertimePay;
    payrollRecord.grossPay = grossPay;
    payrollRecord.sssDeduction = deductions.sss;
    payrollRecord.philhealthDeduction = deductions.philhealth;
    payrollRecord.pagibigDeduction = deductions.pagibig;
    payrollRecord.deductionsTotal = deductions.total;
    payrollRecord.netPay = netPay;
    payrollRecord.computedAt = new Date();

    await payrollRecordRepo.save(payrollRecord);

    logger.info(
      `Computed payroll record ${payrollRecordId}: Net pay = ${netPay}`,
    );

    return {
      status: true,
      message: "Payroll computed successfully",
      data: payrollRecord,
    };
  } catch (error) {
    logger.error("Failed to compute payroll record:", error);
    return {
      status: false,
      message: `Failed to compute payroll: ${error.message}`,
      data: null,
    };
  }
}

/**
 * Calculate attendance statistics
 */
async function calculateAttendanceStats(
  employeeId,
  startDate,
  endDate,
  attendanceRepo,
) {
  const attendanceLogs = await attendanceRepo.find({
    where: {
      employeeId: employeeId,
      timestamp: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    },
  });

  const stats = {
    daysPresent: 0,
    daysAbsent: 0,
    daysLate: 0,
    daysHalfDay: 0,
  };

  attendanceLogs.forEach((log) => {
    switch (log.status) {
      case "present":
        stats.daysPresent++;
        break;
      case "absent":
        stats.daysAbsent++;
        break;
      case "late":
        stats.daysLate++;
        stats.daysPresent++; // Late is still present
        break;
      case "half-day":
        stats.daysHalfDay++;
        break;
    }
  });

  return stats;
}

/**
 * Calculate overtime statistics
 */
async function calculateOvertimeStats(
  employeeId,
  startDate,
  endDate,
  overtimeRepo,
  hourlyRate,
  overtimeRate,
) {
  const overtimeLogs = await overtimeRepo.find({
    where: {
      employeeId: employeeId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
      approvalStatus: "approved", // Only count approved overtime
    },
  });

  const stats = {
    totalOvertimeHours: 0,
    totalOvertimePay: 0,
  };

  overtimeLogs.forEach((log) => {
    stats.totalOvertimeHours += parseFloat(log.hours);
    stats.totalOvertimePay +=
      parseFloat(log.amount) || log.hours * hourlyRate * overtimeRate;
  });

  return stats;
}

/**
 * Calculate basic government deductions (simplified)
 */
function calculateBasicDeductions(grossPay) {
  // Simplified calculation - adjust based on actual rates
  const sss = Math.min(grossPay * 0.045, 1350); // 4.5% up to max
  const philhealth = grossPay * 0.025; // 2.5%
  const pagibig = Math.min(grossPay * 0.02, 100); // 2% up to 100

  return {
    sss,
    philhealth,
    pagibig,
    total: sss + philhealth + pagibig,
  };
}

module.exports = computePayrollRecord;

// src/ipc/handlers/payroll-record/calculation/calculate_gross.ipc.js
// @ts-check
const AttendanceLog = require("../../../../entities/AttendanceLog");
const Employee = require("../../../../entities/Employee");
const OvertimeLog = require("../../../../entities/OvertimeLog");
const PayrollPeriod = require("../../../../entities/PayrollPeriod");
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Calculate gross pay for employee in a period
 * @param {number} employeeId - Employee ID
 * @param {number} periodId - Payroll period ID
 * @returns {Promise<{status: boolean, message: string, data: Object}>}
 */
async function calculateGrossPay(employeeId, periodId) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    try {
        if (!employeeId || !periodId) {
            return {
                status: false,
                message: "Employee ID and Period ID are required",
                data: null
            };
        }

        const employeeRepo = queryRunner.manager.getRepository(Employee);
        const periodRepo = queryRunner.manager.getRepository(PayrollPeriod);
        const attendanceRepo = queryRunner.manager.getRepository(AttendanceLog);
        const overtimeRepo = queryRunner.manager.getRepository(OvertimeLog);

        // Get employee and period
        const employee = await employeeRepo.findOne({ where: { id: parseInt(employeeId) } });
        const period = await periodRepo.findOne({ where: { id: parseInt(periodId) } });

        if (!employee) {
            return {
                status: false,
                message: "Employee not found",
                data: null
            };
        }

        if (!period) {
            return {
                status: false,
                message: "Payroll period not found",
                data: null
            };
        }

        // Calculate basic pay (attendance-based)
        const attendanceStats = await calculateBasicPay(
            employeeId,
            period.startDate,
            period.endDate,
            employee.dailyRate,
            attendanceRepo
        );

        // Calculate overtime pay
        const overtimePay = await calculateOvertimePay(
            employeeId,
            period.startDate,
            period.endDate,
            employee.hourlyRate,
            employee.overtimeRate,
            overtimeRepo
        );

        // Calculate allowances and bonuses (simplified)
        const additionalEarnings = await calculateAdditionalEarnings(employeeId, periodId);

        // Total gross pay
        const grossPay = attendanceStats.totalBasicPay + overtimePay.total + additionalEarnings.total;

        return {
            status: true,
            message: "Gross pay calculated successfully",
            data: {
                employee: {
                    id: employee.id,
                    name: `${employee.firstName} ${employee.lastName}`,
                    dailyRate: employee.dailyRate,
                    hourlyRate: employee.hourlyRate,
                    overtimeRate: employee.overtimeRate
                },
                period: {
                    id: period.id,
                    name: period.name,
                    startDate: period.startDate,
                    endDate: period.endDate
                },
                attendance: attendanceStats,
                overtime: overtimePay,
                additionalEarnings,
                grossPay,
                breakdown: {
                    basicPay: attendanceStats.totalBasicPay,
                    overtimePay: overtimePay.total,
                    allowances: additionalEarnings.allowances,
                    bonuses: additionalEarnings.bonuses
                }
            }
        };

    } catch (error) {
        logger.error("Failed to calculate gross pay:", error);
        return {
            status: false,
            message: `Failed to calculate gross pay: ${error.message}`,
            data: null
        };
    } finally {
        await queryRunner.release();
    }
}

/**
 * Calculate basic pay from attendance
 */
async function calculateBasicPay(employeeId, startDate, endDate, dailyRate, attendanceRepo) {
    const attendanceLogs = await attendanceRepo.find({
        where: {
            employeeId: employeeId,
            timestamp: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }
    });

    let daysPresent = 0;
    let daysHalfDay = 0;
    let totalBasicPay = 0;

    attendanceLogs.forEach(log => {
        if (log.status === "present" || log.status === "late") {
            daysPresent++;
            totalBasicPay += parseFloat(dailyRate);
        } else if (log.status === "half-day") {
            daysHalfDay++;
            totalBasicPay += parseFloat(dailyRate) * 0.5;
        }
        // absent - no pay
    });

    return {
        daysPresent,
        daysHalfDay,
        daysWorked: daysPresent + daysHalfDay,
        totalBasicPay,
        dailyRate
    };
}

/**
 * Calculate overtime pay
 */
async function calculateOvertimePay(employeeId, startDate, endDate, hourlyRate, overtimeRate, overtimeRepo) {
    const overtimeLogs = await overtimeRepo.find({
        where: {
            employeeId: employeeId,
            date: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            },
            approvalStatus: "approved"
        }
    });

    let totalHours = 0;
    let totalPay = 0;

    overtimeLogs.forEach(log => {
        const hours = parseFloat(log.hours);
        const rate = parseFloat(log.rate) || overtimeRate;
        const amount = log.amount || (hours * hourlyRate * rate);
        
        totalHours += hours;
        totalPay += parseFloat(amount);
    });

    return {
        totalHours,
        total: totalPay,
        averageRate: totalHours > 0 ? totalPay / totalHours : 0,
        logs: overtimeLogs.length
    };
}

/**
 * Calculate additional earnings (simplified)
 */
async function calculateAdditionalEarnings(employeeId, periodId) {
    // In a real app, this would query allowance and bonus tables
    // For now, return zeros or fixed values
    return {
        allowances: 0,
        bonuses: 0,
        total: 0
    };
}

module.exports = calculateGrossPay;
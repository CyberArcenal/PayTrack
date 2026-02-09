// src/ipc/handlers/overtime/get/by_employee.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get overtime logs by employee ID
 * @param {number} employeeId
 * @param {Object} [dateRange]
 * @returns {Promise<{status: boolean, message: string, data: any[]}>}
 */
module.exports = async function getOvertimeLogsByEmployee(employeeId, dateRange = {}) {
  try {
    if (!employeeId || typeof employeeId !== "number" || employeeId <= 0) {
      return {
        status: false,
        message: "Invalid employee ID",
        data: [],
      };
    }

    // Verify employee exists
    const employeeRepo = AppDataSource.getRepository("Employee");
    const employee = await employeeRepo.findOne({ where: { id: employeeId } });
    
    if (!employee) {
      return {
        status: false,
        message: `Employee with ID ${employeeId} not found`,
        data: [],
      };
    }

    const overtimeLogRepo = AppDataSource.getRepository("OvertimeLog");
    const query = overtimeLogRepo.createQueryBuilder("overtime")
      .where("overtime.employeeId = :employeeId", { employeeId })
      .orderBy("overtime.date", "DESC");

    // Apply date range filter
    if (dateRange.startDate && dateRange.endDate) {
      query.andWhere("overtime.date BETWEEN :startDate AND :endDate", {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
    }

    const overtimeLogs = await query.getMany();

    // Calculate totals
    const totals = overtimeLogs.reduce(
      (acc, log) => {
        acc.totalHours += parseFloat(log.hours) || 0;
        acc.totalAmount += parseFloat(log.amount) || 0;
        return acc;
      },
      { totalHours: 0, totalAmount: 0 }
    );

    logger.info(`Retrieved ${overtimeLogs.length} overtime logs for employee ${employeeId}`);

    return {
      status: true,
      message: "Overtime logs retrieved successfully",
      data: {
        logs: overtimeLogs,
        totals,
        employee: {
          id: employee.id,
          name: `${employee.firstName} ${employee.lastName}`,
          employeeNumber: employee.employeeNumber,
        },
      },
    };
  } catch (error) {
    logger.error(`Error in getOvertimeLogsByEmployee for employee ${employeeId}:`, error);
    
    return {
      status: false,
      message: error.message || "Failed to retrieve overtime logs",
      data: [],
    };
  }
};
// src/ipc/handlers/overtime/get/by_id.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get overtime log by ID
 * @param {number} id
 * @returns {Promise<{status: boolean, message: string, data: any|null}>}
 */
module.exports = async function getOvertimeLogById(id) {
  try {
    if (!id || typeof id !== "number" || id <= 0) {
      return {
        status: false,
        message: "Invalid overtime log ID",
        data: null,
      };
    }

    const overtimeLogRepo = AppDataSource.getRepository("OvertimeLog");
    
    const overtimeLog = await overtimeLogRepo.findOne({
      where: { id },
      relations: ["employee", "payrollRecord"],
    });

    if (!overtimeLog) {
      return {
        status: false,
        message: `Overtime log with ID ${id} not found`,
        data: null,
      };
    }

    logger.info(`Retrieved overtime log ID: ${id}`);

    return {
      status: true,
      message: "Overtime log retrieved successfully",
      data: overtimeLog,
    };
  } catch (error) {
    logger.error(`Error in getOvertimeLogById for ID ${id}:`, error);
    
    return {
      status: false,
      message: error.message || "Failed to retrieve overtime log",
      data: null,
    };
  }
};
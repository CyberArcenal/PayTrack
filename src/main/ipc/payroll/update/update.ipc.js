// src/ipc/handlers/payroll-period/update/update.ipc.js
const { AppDataSource } = require("../../../db/datasource");
const { logger } = require("../../../../utils/logger");

/**
 * Update an existing payroll period
 * @param {Object} updateData - Update data containing id and fields to update
 * @param {import("typeorm").QueryRunner} [queryRunner] - Optional query runner for transaction
 * @returns {Promise<Object>} Response object
 */
module.exports = async function updatePayrollPeriod(updateData, queryRunner) {
  let shouldReleaseQueryRunner = false;
  let localQueryRunner = queryRunner;
  
  try {
    // Validate required fields
    if (!updateData.id || isNaN(Number(updateData.id))) {
      return {
        status: false,
        message: "Valid period ID is required",
        data: null
      };
    }
    
    const periodId = parseInt(updateData.id);
    
    // Create query runner if not provided
    if (!localQueryRunner) {
      localQueryRunner = AppDataSource.createQueryRunner();
      await localQueryRunner.connect();
      await localQueryRunner.startTransaction();
      shouldReleaseQueryRunner = true;
    }
    
    const periodRepository = localQueryRunner.manager.getRepository("PayrollPeriod");
    
    // Check if period exists
    const existingPeriod = await periodRepository.findOne({ where: { id: periodId } });
    
    if (!existingPeriod) {
      if (shouldReleaseQueryRunner) {
        await localQueryRunner.rollbackTransaction();
        await localQueryRunner.release();
      }
      
      return {
        status: false,
        message: `Payroll period with ID ${periodId} not found`,
        data: null
      };
    }
    
    // Prevent updates to locked or closed periods
    if (existingPeriod.status === 'locked' || existingPeriod.status === 'closed') {
      if (shouldReleaseQueryRunner) {
        await localQueryRunner.rollbackTransaction();
        await localQueryRunner.release();
      }
      
      return {
        status: false,
        message: `Cannot update ${existingPeriod.status} payroll period`,
        data: null
      };
    }
    
    // Validate dates if provided
    const updates = { ...updateData };
    delete updates.id; // Remove id from updates
    
    if (updates.startDate) {
      const startDate = new Date(updates.startDate);
      if (isNaN(startDate.getTime())) {
        if (shouldReleaseQueryRunner) {
          await localQueryRunner.rollbackTransaction();
          await localQueryRunner.release();
        }
        
        return {
          status: false,
          message: "Invalid start date format",
          data: null
        };
      }
      updates.startDate = startDate;
    }
    
    if (updates.endDate) {
      const endDate = new Date(updates.endDate);
      if (isNaN(endDate.getTime())) {
        if (shouldReleaseQueryRunner) {
          await localQueryRunner.rollbackTransaction();
          await localQueryRunner.release();
        }
        
        return {
          status: false,
          message: "Invalid end date format",
          data: null
        };
      }
      updates.endDate = endDate;
    }
    
    if (updates.payDate) {
      const payDate = new Date(updates.payDate);
      if (isNaN(payDate.getTime())) {
        if (shouldReleaseQueryRunner) {
          await localQueryRunner.rollbackTransaction();
          await localQueryRunner.release();
        }
        
        return {
          status: false,
          message: "Invalid pay date format",
          data: null
        };
      }
      updates.payDate = payDate;
    }
    
    // Validate date consistency
    const startDate = updates.startDate || existingPeriod.startDate;
    const endDate = updates.endDate || existingPeriod.endDate;
    const payDate = updates.payDate || existingPeriod.payDate;
    
    if (startDate > endDate) {
      if (shouldReleaseQueryRunner) {
        await localQueryRunner.rollbackTransaction();
        await localQueryRunner.release();
      }
      
      return {
        status: false,
        message: "Start date cannot be after end date",
        data: null
      };
    }
    
    if (payDate < endDate) {
      if (shouldReleaseQueryRunner) {
        await localQueryRunner.rollbackTransaction();
        await localQueryRunner.release();
      }
      
      return {
        status: false,
        message: "Pay date should be on or after end date",
        data: null
      };
    }
    
    // Check for overlapping periods (excluding current period)
    if (updates.startDate || updates.endDate) {
      const overlappingPeriod = await periodRepository.findOne({
        where: [
          {
            id: { $ne: periodId },
            startDate: { $lte: endDate },
            endDate: { $gte: startDate }
          }
        ]
      });
      
      if (overlappingPeriod) {
        if (shouldReleaseQueryRunner) {
          await localQueryRunner.rollbackTransaction();
          await localQueryRunner.release();
        }
        
        return {
          status: false,
          message: `Period overlaps with existing period: ${overlappingPeriod.name || overlappingPeriod.id}`,
          data: null
        };
      }
    }
    
    // Update period
    await periodRepository.update(periodId, updates);
    
    // Get updated period
    const updatedPeriod = await periodRepository.findOne({ where: { id: periodId } });
    
    if (shouldReleaseQueryRunner) {
      await localQueryRunner.commitTransaction();
      await localQueryRunner.release();
    }
    
    logger?.info(`Updated payroll period ${periodId}`);
    
    return {
      status: true,
      message: "Payroll period updated successfully",
      data: updatedPeriod
    };
  } catch (error) {
    if (shouldReleaseQueryRunner && localQueryRunner) {
      await localQueryRunner.rollbackTransaction();
      await localQueryRunner.release();
    }
    
    logger?.error(`Error in updatePayrollPeriod for period ${updateData.id}:`, error);
    return {
      status: false,
      message: `Failed to update payroll period: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};
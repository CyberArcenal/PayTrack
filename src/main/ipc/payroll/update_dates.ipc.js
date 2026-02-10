// src/ipc/handlers/payroll-period/update_dates.ipc.js
const { AppDataSource } = require("../../db/datasource");
const { logger } = require("../../../utils/logger");

/**
 * Update period dates
 * @param {Object} updateData - Update data containing id and dates
 * @param {import("typeorm").QueryRunner} [queryRunner] - Optional query runner for transaction
 * @returns {Promise<Object>} Response object
 */
module.exports = async function updatePeriodDates(updateData, queryRunner) {
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
    
    // Check if at least one date is provided
    if (!updateData.startDate && !updateData.endDate && !updateData.payDate) {
      return {
        status: false,
        message: "At least one date (startDate, endDate, or payDate) is required",
        data: null
      };
    }
    
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
        message: `Cannot update dates for ${existingPeriod.status} payroll period`,
        data: null
      };
    }
    
    // Prepare updates
    const updates = {};
    
    // Validate and process startDate
    if (updateData.startDate) {
      const startDate = new Date(updateData.startDate);
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
    
    // Validate and process endDate
    if (updateData.endDate) {
      const endDate = new Date(updateData.endDate);
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
    
    // Validate and process payDate
    if (updateData.payDate) {
      const payDate = new Date(updateData.payDate);
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
    
    // Determine dates for validation
    const startDate = updates.startDate || existingPeriod.startDate;
    const endDate = updates.endDate || existingPeriod.endDate;
    const payDate = updates.payDate || existingPeriod.payDate;
    
    // Validate date consistency
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
    
    // Update period dates
    await periodRepository.update(periodId, updates);
    
    // Get updated period
    const updatedPeriod = await periodRepository.findOne({ where: { id: periodId } });
    
    if (shouldReleaseQueryRunner) {
      await localQueryRunner.commitTransaction();
      await localQueryRunner.release();
    }
    
    logger?.info(`Updated dates for payroll period ${periodId}`);
    
    return {
      status: true,
      message: "Payroll period dates updated successfully",
      data: updatedPeriod
    };
  } catch (error) {
    if (shouldReleaseQueryRunner && localQueryRunner) {
      await localQueryRunner.rollbackTransaction();
      await localQueryRunner.release();
    }
    
    logger?.error(`Error in updatePeriodDates for period ${updateData.id}:`, error);
    return {
      status: false,
      message: `Failed to update period dates: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};
// src/ipc/handlers/overtime/calculate/amount.ipc.js
const { logger } = require("../../../../utils/logger");

/**
 * Calculate overtime amount
 * @param {number} hours
 * @param {number} hourlyRate
 * @param {number} overtimeRate
 * @param {string} [type] - Overtime type
 * @returns {Promise<{status: boolean, message: string, data: {amount: number, breakdown: any}}>}
 */
module.exports = async function calculateOvertimeAmount(hours, hourlyRate, overtimeRate, type = "regular") {
  try {
    // Validate inputs
    if (typeof hours !== "number" || hours <= 0) {
      return {
        status: false,
        message: "Invalid hours. Must be a positive number",
        data: null,
      };
    }

    if (typeof hourlyRate !== "number" || hourlyRate <= 0) {
      return {
        status: false,
        message: "Invalid hourly rate. Must be a positive number",
        data: null,
      };
    }

    if (typeof overtimeRate !== "number" || overtimeRate <= 0) {
      return {
        status: false,
        message: "Invalid overtime rate. Must be a positive number",
        data: null,
      };
    }

    // Adjust rate based on type
    let adjustedRate = overtimeRate;
    let rateMultiplier = 1.0;

    switch (type.toLowerCase()) {
      case "holiday":
        adjustedRate = Math.max(overtimeRate, 2.0); // At least double pay
        rateMultiplier = 2.0;
        break;
      case "special-holiday":
        adjustedRate = Math.max(overtimeRate, 1.3); // At least 130%
        rateMultiplier = 1.3;
        break;
      case "rest-day":
        adjustedRate = Math.max(overtimeRate, 1.3); // At least 130%
        rateMultiplier = 1.3;
        break;
      case "regular":
      default:
        adjustedRate = overtimeRate;
        rateMultiplier = 1.0;
    }

    // Calculate amount
    const baseAmount = hours * hourlyRate;
    const overtimeAmount = baseAmount * adjustedRate;
    const overtimePremium = overtimeAmount - baseAmount;

    // Calculate breakdown
    const breakdown = {
      baseAmount: parseFloat(baseAmount.toFixed(2)),
      overtimePremium: parseFloat(overtimePremium.toFixed(2)),
      totalAmount: parseFloat(overtimeAmount.toFixed(2)),
      hourlyRate,
      hours,
      appliedRate: adjustedRate,
      rateMultiplier,
      type,
      calculation: `(${hours} hours × ${hourlyRate}/hour) × ${adjustedRate} = ${overtimeAmount.toFixed(2)}`,
    };

    logger.debug(`Calculated overtime amount: ${hours}h × ${hourlyRate} × ${adjustedRate} = ${overtimeAmount}`);

    return {
      status: true,
      message: "Overtime amount calculated successfully",
      data: breakdown,
    };
  } catch (error) {
    logger.error(`Error in calculateOvertimeAmount: hours=${hours}, rate=${hourlyRate}, overtimeRate=${overtimeRate}`, error);
    
    return {
      status: false,
      message: error.message || "Failed to calculate overtime amount",
      data: null,
    };
  }
};
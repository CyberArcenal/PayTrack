// ===================== src/ipc/handlers/deduction/calculate_amount.ipc.js =====================
// @ts-check
/**
 * Calculate deduction amount based on amount and percentage
 * @param {number|string} amount - Base amount
 * @param {number|string} [percentage] - Percentage to apply

 */
module.exports = async function calculateDeductionAmount(amount, percentage) {
  try {
    // Validate and parse inputs
    // @ts-ignore
    const baseAmount = parseFloat(amount);
    if (isNaN(baseAmount) || baseAmount < 0) {
      return {
        status: false,
        message: "Invalid base amount. Must be a non-negative number",
        data: null
      };
    }
    
    let parsedPercentage = null;
    let calculatedAmount = baseAmount;
    
    if (percentage !== undefined && percentage !== null) {
      // @ts-ignore
      parsedPercentage = parseFloat(percentage);
      if (isNaN(parsedPercentage) || parsedPercentage < 0 || parsedPercentage > 100) {
        return {
          status: false,
          message: "Invalid percentage. Must be between 0 and 100",
          data: null
        };
      }
      calculatedAmount = baseAmount * (parsedPercentage / 100);
    }
    
    // Round to 2 decimal places
    calculatedAmount = Math.round(calculatedAmount * 100) / 100;
    
    return {
      status: true,
      message: "Amount calculated successfully",
      data: {
        calculatedAmount,
        baseAmount,
        percentage: parsedPercentage,
        formula: parsedPercentage 
          ? `${baseAmount} × ${parsedPercentage}% = ${calculatedAmount}`
          : `Fixed amount: ${calculatedAmount}`
      }
    };
    
  } catch (error) {
    return {
      status: false,
      // @ts-ignore
      message: `Calculation error: ${error.message}`,
      data: null
    };
  }
};
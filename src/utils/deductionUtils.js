// src/utils/deductionUtils.js
/**
 * Validate deduction data before create/update
 * @param {Object} data
 * @returns {Promise<{valid: boolean, errors: string[]}>}
 */
async function validateDeductionData(data) {
  const errors = [];
  if (!data.payrollRecordId) errors.push("payrollRecordId is required");
  if (!data.type) errors.push("type is required");
  if (data.amount === undefined && data.percentage === undefined) {
    errors.push("Either amount or percentage must be provided");
  }
  if (data.amount !== undefined && (isNaN(data.amount) || data.amount < 0)) {
    errors.push("amount must be a non-negative number");
  }
  if (data.percentage !== undefined && (isNaN(data.percentage) || data.percentage < 0 || data.percentage > 100)) {
    errors.push("percentage must be a number between 0 and 100");
  }
  if (data.appliedDate && isNaN(new Date(data.appliedDate).getTime())) {
    errors.push("appliedDate must be a valid date");
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { validateDeductionData };
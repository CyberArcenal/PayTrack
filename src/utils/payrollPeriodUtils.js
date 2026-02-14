// src/utils/payrollPeriodUtils.js
/**
 * Validate payroll period data before create/update
 * @param {Object} data - Period data
 * @param {import('typeorm').Repository} periodRepo - Repository for date overlap checks
 * @param {number} excludeId - ID to exclude when checking overlapping dates
 * @returns {Promise<{valid: boolean, errors: string[]}>}
 */
async function validatePayrollPeriodData(data, periodRepo, excludeId = null) {
  const errors = [];

  // Required fields
  if (!data.periodType) errors.push("periodType is required");
  if (!data.startDate) errors.push("startDate is required");
  if (!data.endDate) errors.push("endDate is required");
  if (!data.payDate) errors.push("payDate is required");
  if (!data.workingDays && data.workingDays !== 0) errors.push("workingDays is required");

  // Date validation
  const start = data.startDate ? new Date(data.startDate) : null;
  const end = data.endDate ? new Date(data.endDate) : null;
  const pay = data.payDate ? new Date(data.payDate) : null;

  if (start && isNaN(start.getTime())) {
    errors.push("startDate must be a valid date");
  }
  if (end && isNaN(end.getTime())) {
    errors.push("endDate must be a valid date");
  }
  if (pay && isNaN(pay.getTime())) {
    errors.push("payDate must be a valid date");
  }

  // Date range validation
  if (start && end && start >= end) {
    errors.push("endDate must be after startDate");
  }
  if (end && pay && pay < end) {
    errors.push("payDate must be on or after endDate");
  }

  // Period type validation
  const allowedTypes = ["weekly", "bi-weekly", "semi-monthly", "monthly"];
  if (data.periodType && !allowedTypes.includes(data.periodType)) {
    errors.push(`periodType must be one of: ${allowedTypes.join(", ")}`);
  }

  // Status validation (if provided)
  const allowedStatuses = ["open", "processing", "locked", "closed"];
  if (data.status && !allowedStatuses.includes(data.status)) {
    errors.push(`status must be one of: ${allowedStatuses.join(", ")}`);
  }

  // Check for overlapping periods (if startDate and endDate provided)
  if (start && end && !errors.length) {
    const query = periodRepo
      .createQueryBuilder("period")
      .where("period.startDate < :end AND period.endDate > :start", {
        start: data.startDate,
        end: data.endDate,
      });
    if (excludeId) {
      query.andWhere("period.id != :id", { id: excludeId });
    }
    const overlapping = await query.getCount();
    if (overlapping > 0) {
      errors.push("Period overlaps with an existing period");
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Generate a period name based on dates and type
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @param {string} periodType
 * @returns {string}
 */
function generatePeriodName(startDate, endDate, periodType) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${periodType} ${startStr} - ${endStr}`;
}

module.exports = {
  validatePayrollPeriodData,
  generatePeriodName,
};
// src/utils/payrollRecordUtils.js
/**
 * Validate payroll record data before create/update
 * @param {Object} data - Payroll record data
 * @param {Object} repos - { employeeRepo, periodRepo, payrollRepo }
 * @param {number} excludeId - ID to exclude when checking uniqueness
 * @returns {Promise<{valid: boolean, errors: string[]}>}
 */
async function validatePayrollRecordData(data, { employeeRepo, periodRepo, payrollRepo }, excludeId = null) {
  const errors = [];

  // Required fields
  if (!data.employeeId) errors.push("employeeId is required");
  if (!data.periodId) errors.push("periodId is required");

  // Check existence of employee and period
  if (data.employeeId) {
    const emp = await employeeRepo.findOne({ where: { id: data.employeeId } });
    if (!emp) errors.push(`Employee with ID ${data.employeeId} not found`);
  }
  if (data.periodId) {
    const per = await periodRepo.findOne({ where: { id: data.periodId } });
    if (!per) errors.push(`Payroll period with ID ${data.periodId} not found`);
  }

  // Unique employee+period constraint
  if (data.employeeId && data.periodId && payrollRepo) {
    const query = payrollRepo
      .createQueryBuilder("payroll")
      .where("payroll.employeeId = :employeeId", { employeeId: data.employeeId })
      .andWhere("payroll.periodId = :periodId", { periodId: data.periodId });
    if (excludeId) {
      query.andWhere("payroll.id != :id", { id: excludeId });
    }
    const existing = await query.getCount();
    if (existing > 0) {
      errors.push("Payroll record already exists for this employee and period");
    }
  }

  // Validate numeric fields
  const numericFields = [
    'daysPresent', 'daysAbsent', 'daysLate', 'daysHalfDay',
    'basicPay', 'overtimeHours', 'overtimePay', 'holidayPay',
    'nightDiffPay', 'allowance', 'bonus', 'grossPay',
    'sssDeduction', 'philhealthDeduction', 'pagibigDeduction',
    'taxDeduction', 'loanDeduction', 'advanceDeduction',
    'otherDeductions', 'deductionsTotal', 'netPay'
  ];
  numericFields.forEach(field => {
    if (data[field] !== undefined && (isNaN(data[field]) || data[field] < 0)) {
      errors.push(`${field} must be a non-negative number`);
    }
  });

  // Payment status validation
  const allowedStatuses = ["unpaid", "paid", "partially-paid", "cancelled"];
  if (data.paymentStatus && !allowedStatuses.includes(data.paymentStatus)) {
    errors.push(`paymentStatus must be one of: ${allowedStatuses.join(", ")}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Calculate gross pay from components
 */
function calculateGrossPay(basicPay, overtimePay, holidayPay, nightDiffPay, allowance, bonus) {
  return (parseFloat(basicPay) || 0) +
         (parseFloat(overtimePay) || 0) +
         (parseFloat(holidayPay) || 0) +
         (parseFloat(nightDiffPay) || 0) +
         (parseFloat(allowance) || 0) +
         (parseFloat(bonus) || 0);
}

/**
 * Calculate total deductions
 */
function calculateDeductionsTotal(sss, philhealth, pagibig, tax, loan, advance, other) {
  return (parseFloat(sss) || 0) +
         (parseFloat(philhealth) || 0) +
         (parseFloat(pagibig) || 0) +
         (parseFloat(tax) || 0) +
         (parseFloat(loan) || 0) +
         (parseFloat(advance) || 0) +
         (parseFloat(other) || 0);
}

/**
 * Calculate net pay
 */
function calculateNetPay(grossPay, deductionsTotal) {
  return (parseFloat(grossPay) || 0) - (parseFloat(deductionsTotal) || 0);
}

module.exports = {
  validatePayrollRecordData,
  calculateGrossPay,
  calculateDeductionsTotal,
  calculateNetPay,
};
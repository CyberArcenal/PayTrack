// src/ipc/handlers/payroll-period/management/validate_period.ipc.js
const { AppDataSource } = require("../../../db/datasource");
const { logger } = require("../../../../utils/logger");

/**
 * Validate a payroll period for processing
 * @param {number} periodId - Payroll period ID
 * @param {string} validationType - Type of validation (process, lock, close)
 * @returns {Promise<Object>} Response object
 */
module.exports = async function validatePayrollPeriod(periodId, validationType = 'process') {
  try {
    // Validate inputs
    if (!periodId || isNaN(Number(periodId))) {
      return {
        status: false,
        message: "Valid period ID is required",
        data: null
      };
    }
    
    const id = parseInt(periodId);
    const validValidationTypes = ['process', 'lock', 'close'];
    
    if (!validValidationTypes.includes(validationType)) {
      return {
        status: false,
        message: `Invalid validation type. Valid values: ${validValidationTypes.join(', ')}`,
        data: null
      };
    }
    
    const periodRepository = AppDataSource.getRepository("PayrollPeriod");
    const payrollRecordRepository = AppDataSource.getRepository("PayrollRecord");
    const employeeRepository = AppDataSource.getRepository("Employee");
    
    // Get period with relations
    const period = await periodRepository.findOne({
      where: { id },
      relations: ["payrollRecords"]
    });
    
    if (!period) {
      return {
        status: false,
        message: `Payroll period with ID ${id} not found`,
        data: null
      };
    }
    
    const validation = {
      periodId: id,
      periodName: period.name,
      status: period.status,
      validationType,
      isValid: true,
      errors: [],
      warnings: [],
      checks: []
    };
    
    // Check 1: Period status
    validation.checks.push({
      name: 'Period Status',
      required: true,
      passed: ['open', 'processing'].includes(period.status),
      message: period.status === 'open' || period.status === 'processing' 
        ? 'Period is open for processing' 
        : `Period is ${period.status}`
    });
    
    if (!['open', 'processing'].includes(period.status)) {
      validation.isValid = false;
      validation.errors.push(`Period is ${period.status} and cannot be processed`);
    }
    
    // Check 2: Date validity
    const now = new Date();
    const endDate = new Date(period.endDate);
    const payDate = new Date(period.payDate);
    
    validation.checks.push({
      name: 'End Date Passed',
      required: validationType === 'process',
      passed: endDate <= now,
      message: endDate <= now 
        ? 'Period end date has passed' 
        : 'Period end date is in the future'
    });
    
    if (validationType === 'process' && endDate > now) {
      validation.warnings.push('Processing period before end date');
    }
    
    validation.checks.push({
      name: 'Pay Date Valid',
      required: true,
      passed: payDate >= endDate,
      message: payDate >= endDate 
        ? 'Pay date is on or after end date' 
        : 'Pay date is before end date'
    });
    
    if (payDate < endDate) {
      validation.isValid = false;
      validation.errors.push('Pay date is before end date');
    }
    
    // Check 3: Working days
    validation.checks.push({
      name: 'Working Days',
      required: true,
      passed: period.workingDays > 0,
      message: period.workingDays > 0 
        ? `Working days: ${period.workingDays}` 
        : 'No working days specified'
    });
    
    if (period.workingDays <= 0) {
      validation.warnings.push('Working days should be greater than 0');
    }
    
    // Get active employees
    const activeEmployees = await employeeRepository.count({
      where: { status: 'active' }
    });
    
    validation.checks.push({
      name: 'Active Employees',
      required: true,
      passed: activeEmployees > 0,
      message: activeEmployees > 0 
        ? `${activeEmployees} active employees found` 
        : 'No active employees'
    });
    
    if (activeEmployees === 0) {
      validation.isValid = false;
      validation.errors.push('No active employees found');
    }
    
    // Check 4: Existing payroll records
    const existingRecords = period.payrollRecords || [];
    
    validation.checks.push({
      name: 'Existing Records',
      required: validationType === 'lock' || validationType === 'close',
      passed: existingRecords.length > 0,
      message: existingRecords.length > 0 
        ? `${existingRecords.length} payroll records exist` 
        : 'No payroll records'
    });
    
    if ((validationType === 'lock' || validationType === 'close') && existingRecords.length === 0) {
      validation.isValid = false;
      validation.errors.push('No payroll records to lock/close');
    }
    
    // Check 5: For lock validation - all records computed
    if (validationType === 'lock' && existingRecords.length > 0) {
      const uncomputedRecords = existingRecords.filter(record => !record.computedAt);
      
      validation.checks.push({
        name: 'All Records Computed',
        required: true,
        passed: uncomputedRecords.length === 0,
        message: uncomputedRecords.length === 0 
          ? 'All records computed' 
          : `${uncomputedRecords.length} records not computed`
      });
      
      if (uncomputedRecords.length > 0) {
        validation.isValid = false;
        validation.errors.push(`${uncomputedRecords.length} payroll records not computed`);
      }
    }
    
    // Check 6: For close validation - all records paid
    if (validationType === 'close' && existingRecords.length > 0) {
      const unpaidRecords = existingRecords.filter(record => record.paymentStatus !== 'paid');
      
      validation.checks.push({
        name: 'All Records Paid',
        required: true,
        passed: unpaidRecords.length === 0,
        message: unpaidRecords.length === 0 
          ? 'All records paid' 
          : `${unpaidRecords.length} records not paid`
      });
      
      if (unpaidRecords.length > 0) {
        validation.isValid = false;
        validation.errors.push(`${unpaidRecords.length} payroll records not paid`);
      }
    }
    
    // Summary
    validation.summary = {
      totalChecks: validation.checks.length,
      passedChecks: validation.checks.filter(c => c.passed).length,
      failedChecks: validation.checks.filter(c => !c.passed).length,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length
    };
    
    logger?.info(`Validated payroll period ${id} for ${validationType}: ${validation.isValid ? 'VALID' : 'INVALID'}`);
    
    return {
      status: true,
      message: validation.isValid ? 'Validation passed' : 'Validation failed',
      data: validation
    };
  } catch (error) {
    logger?.error(`Error in validatePayrollPeriod for period ${periodId}:`, error);
    return {
      status: false,
      message: `Failed to validate payroll period: ${error.message}`,
      data: null,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
};
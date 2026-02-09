/**
 * @file Validate attendance data
 * @type {import('../../../types/ipc').AttendanceValidateDataHandler}
 */

const { AppDataSource } = require('../../../db/datasource');
const { logger } = require('../../../utils/logger');

/**
 * Validate attendance data
 * @param {import('../../../types/ipc').ValidateAttendanceDataParams} params - Validation parameters
 * @returns {Promise<import('../../../types/ipc').AttendanceResponse>}
 */
module.exports = async (params) => {
  try {
    if (!params.data) {
      return {
        status: false,
        message: 'Attendance data is required for validation',
        data: null
      };
    }

    const validationResults = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    const data = params.data;

    // 1. Validate required fields
    if (!data.employeeId && !data.employeeNumber) {
      validationResults.isValid = false;
      validationResults.errors.push({
        field: 'employeeId',
        message: 'Either employeeId or employeeNumber is required'
      });
    }

    if (!data.timestamp) {
      validationResults.isValid = false;
      validationResults.errors.push({
        field: 'timestamp',
        message: 'Timestamp is required'
      });
    }

    // 2. Validate data types and formats
    if (data.employeeId && isNaN(Number(data.employeeId))) {
      validationResults.isValid = false;
      validationResults.errors.push({
        field: 'employeeId',
        message: 'employeeId must be a number'
      });
    }

    if (data.timestamp) {
      try {
        const date = new Date(data.timestamp);
        if (isNaN(date.getTime())) {
          validationResults.isValid = false;
          validationResults.errors.push({
            field: 'timestamp',
            message: 'Invalid timestamp format'
          });
        } else {
          // Check if timestamp is in the future
          if (date > new Date()) {
            validationResults.warnings.push({
              field: 'timestamp',
              message: 'Timestamp is in the future'
            });
          }
          
          // Check if timestamp is too far in the past (more than 1 year)
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          if (date < oneYearAgo) {
            validationResults.warnings.push({
              field: 'timestamp',
              message: 'Timestamp is more than 1 year old'
            });
          }
        }
      } catch (error) {
        validationResults.isValid = false;
        validationResults.errors.push({
          field: 'timestamp',
          message: 'Failed to parse timestamp'
        });
      }
    }

    // 3. Validate status
    if (data.status) {
      const validStatuses = ['present', 'absent', 'late', 'half-day', 'on-leave', 'holiday'];
      if (!validStatuses.includes(data.status.toLowerCase())) {
        validationResults.isValid = false;
        validationResults.errors.push({
          field: 'status',
          message: `Invalid status. Valid values: ${validStatuses.join(', ')}`
        });
      }
    }

    // 4. Validate numeric fields
    if (data.hoursWorked !== undefined) {
      const hours = parseFloat(data.hoursWorked);
      if (isNaN(hours) || hours < 0) {
        validationResults.isValid = false;
        validationResults.errors.push({
          field: 'hoursWorked',
          message: 'hoursWorked must be a positive number'
        });
      } else if (hours > 24) {
        validationResults.warnings.push({
          field: 'hoursWorked',
          message: 'hoursWorked exceeds 24 hours'
        });
      } else if (hours > 0 && hours < 1) {
        validationResults.warnings.push({
          field: 'hoursWorked',
          message: 'hoursWorked is less than 1 hour'
        });
      }
    }

    if (data.overtimeHours !== undefined) {
      const overtime = parseFloat(data.overtimeHours);
      if (isNaN(overtime) || overtime < 0) {
        validationResults.isValid = false;
        validationResults.errors.push({
          field: 'overtimeHours',
          message: 'overtimeHours must be a positive number'
        });
      } else if (overtime > 12) {
        validationResults.warnings.push({
          field: 'overtimeHours',
          message: 'overtimeHours exceeds 12 hours'
        });
      }
    }

    if (data.lateMinutes !== undefined) {
      const lateMins = parseInt(data.lateMinutes);
      if (isNaN(lateMins) || lateMins < 0) {
        validationResults.isValid = false;
        validationResults.errors.push({
          field: 'lateMinutes',
          message: 'lateMinutes must be a positive integer'
        });
      } else if (lateMins > 480) { // 8 hours in minutes
        validationResults.warnings.push({
          field: 'lateMinutes',
          message: 'lateMinutes exceeds 8 hours'
        });
      }
    }

    // 5. Validate source
    if (data.source) {
      const validSources = ['manual', 'rfid', 'biometric', 'mobile', 'web', 'system', 'csv'];
      if (!validSources.includes(data.source.toLowerCase())) {
        validationResults.warnings.push({
          field: 'source',
          message: `Unusual source. Common sources: ${validSources.join(', ')}`
        });
      }
    }

    // 6. Business logic validation
    if (data.status === 'absent' && data.hoursWorked > 0) {
      validationResults.warnings.push({
        field: 'status/hoursWorked',
        message: 'Absent status with positive hours worked'
      });
    }

    if (data.status === 'present' && data.hoursWorked === 0) {
      validationResults.warnings.push({
        field: 'status/hoursWorked',
        message: 'Present status with zero hours worked'
      });
    }

    if (data.overtimeHours > 0 && data.hoursWorked <= 8) {
      validationResults.warnings.push({
        field: 'overtimeHours/hoursWorked',
        message: 'Overtime recorded with less than 8 hours worked'
      });
    }

    // 7. Check employee existence if requested
    if (params.checkEmployeeExistence && (data.employeeId || data.employeeNumber)) {
      const employeeRepo = AppDataSource.getRepository('Employee');
      
      try {
        let employee;
        if (data.employeeId) {
          employee = await employeeRepo.findOne({
            where: { id: Number(data.employeeId) }
          });
        } else if (data.employeeNumber) {
          employee = await employeeRepo.findOne({
            where: { employeeNumber: data.employeeNumber.toString() }
          });
        }

        if (!employee) {
          validationResults.errors.push({
            field: 'employeeId/employeeNumber',
            message: 'Employee not found in system'
          });
          validationResults.isValid = false;
        } else if (employee.status !== 'active') {
          validationResults.warnings.push({
            field: 'employeeId/employeeNumber',
            message: `Employee is ${employee.status}`
          });
        }
      } catch (error) {
        validationResults.warnings.push({
          field: 'employeeExistence',
          message: 'Could not verify employee existence'
        });
      }
    }

    // 8. Check for duplicates if requested
    if (params.checkDuplicates && data.employeeId && data.timestamp) {
      try {
        const attendanceRepo = AppDataSource.getRepository('AttendanceLog');
        const date = new Date(data.timestamp);
        const dateStr = date.toISOString().split('T')[0];
        
        const existingCount = await attendanceRepo
          .createQueryBuilder('attendance')
          .where('attendance.employeeId = :employeeId', { 
            employeeId: Number(data.employeeId) 
          })
          .andWhere('DATE(attendance.timestamp) = :date', { date: dateStr })
          .getCount();

        if (existingCount > 0) {
          validationResults.warnings.push({
            field: 'duplicate',
            message: 'Attendance already exists for this employee on this date'
          });
        }
      } catch (error) {
        validationResults.warnings.push({
          field: 'duplicateCheck',
          message: 'Could not check for duplicates'
        });
      }
    }

    // 9. Generate suggestions for improvement
    if (!data.status && data.hoursWorked) {
      if (data.hoursWorked >= 8) {
        validationResults.suggestions.push({
          field: 'status',
          suggestion: 'Consider setting status to "present"'
        });
      } else if (data.hoursWorked >= 4) {
        validationResults.suggestions.push({
          field: 'status',
          suggestion: 'Consider setting status to "half-day"'
        });
      }
    }

    if (data.lateMinutes && data.lateMinutes > 0 && data.status !== 'late') {
      validationResults.suggestions.push({
        field: 'status',
        suggestion: 'Consider setting status to "late" since lateMinutes > 0'
      });
    }

    // Calculate validation score
    const errorCount = validationResults.errors.length;
    const warningCount = validationResults.warnings.length;
    const totalIssues = errorCount + warningCount;
    
    let validationScore = 100;
    if (totalIssues > 0) {
      validationScore = Math.max(0, 100 - (errorCount * 20) - (warningCount * 5));
    }

    return {
      status: true,
      message: `Validation completed with score: ${validationScore}/100`,
      data: {
        ...validationResults,
        score: validationScore,
        summary: {
          errors: errorCount,
          warnings: warningCount,
          suggestions: validationResults.suggestions.length,
          isValid: validationResults.isValid
        }
      }
    };
  } catch (error) {
    logger.error('Failed to validate attendance data:', error);
    
    return {
      status: false,
      message: `Failed to validate attendance data: ${error.message}`,
      data: null,
      error: error.message
    };
  }
};
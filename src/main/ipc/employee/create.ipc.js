// create.ipc.js placeholder
// ===================== create.ipc.js =====================

const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");
const validateEmployeeData = require("./validation/validate_data.ipc");

/**
 * Create a new employee
 * @param {Object} employeeData
 * @param {import("typeorm").QueryRunner} [queryRunner]
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function createEmployee(employeeData, queryRunner) {
  const repo = queryRunner ? queryRunner.manager.getRepository("Employee") : AppDataSource.getRepository("Employee");

  try {
    // Validate input data
    const validation = validateEmployeeData(employeeData);
    if (!validation.isValid) {
      return {
        status: false,
        message: "Validation failed",
        data: { errors: validation.errors },
      };
    }

    // Check for duplicate employee number
    const existingEmployee = await repo.findOne({
      where: { employeeNumber: employeeData.employeeNumber },
    });

    if (existingEmployee) {
      return {
        status: false,
        message: `Employee with number ${employeeData.employeeNumber} already exists`,
        data: null,
      };
    }

    // Check for duplicate email
    if (employeeData.email) {
      const existingEmail = await repo.findOne({
        where: { email: employeeData.email },
      });

      if (existingEmail) {
        return {
          status: false,
          message: `Employee with email ${employeeData.email} already exists`,
          data: null,
        };
      }
    }

    // Calculate rates if basePay is provided
    let dailyRate = 0;
    let hourlyRate = 0;

    if (employeeData.basePay) {
      const basePay = parseFloat(employeeData.basePay);
      // Assuming 10 working days per pay period and 8 hours per day
      dailyRate = basePay / 10;
      hourlyRate = dailyRate / 8;
    }

    // Prepare employee entity
    const employee = repo.create({
      employeeNumber: employeeData.employeeNumber.trim(),
      firstName: employeeData.firstName.trim(),
      middleName: employeeData.middleName?.trim() || null,
      lastName: employeeData.lastName.trim(),
      email: employeeData.email?.trim() || null,
      phone: employeeData.phone?.trim() || null,
      address: employeeData.address?.trim() || null,
      birthDate: employeeData.birthDate || null,
      hireDate: employeeData.hireDate,
      position: employeeData.position?.trim() || null,
      department: employeeData.department?.trim() || null,
      basePay: employeeData.basePay ? parseFloat(employeeData.basePay) : 0,
      dailyRate: employeeData.dailyRate || dailyRate,
      hourlyRate: employeeData.hourlyRate || hourlyRate,
      overtimeRate: employeeData.overtimeRate || 1.25,
      paymentMethod: employeeData.paymentMethod || "bank",
      bankName: employeeData.bankName?.trim() || null,
      accountNumber: employeeData.accountNumber?.trim() || null,
      status: employeeData.status || "active",
      employmentType: employeeData.employmentType || "regular",
      sssNumber: employeeData.sssNumber?.trim() || null,
      philhealthNumber: employeeData.philhealthNumber?.trim() || null,
      pagibigNumber: employeeData.pagibigNumber?.trim() || null,
      tinNumber: employeeData.tinNumber?.trim() || null,
    });

    // Save employee
    const savedEmployee = await repo.save(employee);

    logger.info(`Employee created: ID ${savedEmployee.id}, Number: ${savedEmployee.employeeNumber}`);

    return {
      status: true,
      message: "Employee created successfully",
      data: savedEmployee,
    };
  } catch (error) {
    logger.error("Error in createEmployee:", error);

    // Handle database errors
    let errorMessage = "Failed to create employee";
    if (error.code === "SQLITE_CONSTRAINT") {
      if (error.message.includes("UNIQUE")) {
        if (error.message.includes("employeeNumber")) {
          errorMessage = "Employee number already exists";
        } else if (error.message.includes("email")) {
          errorMessage = "Email already exists";
        }
      }
    }

    return {
      status: false,
      message: errorMessage,
      data: null,
    };
  }
};
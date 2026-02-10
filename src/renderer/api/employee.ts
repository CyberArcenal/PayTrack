// employee.ts placeholder
// employeeAPI.ts
export interface Employee {
  id?: number;
  employeeNumber: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  birthDate?: string | null;
  hireDate: string;
  position?: string | null;
  department?: string | null;
  basePay: number;
  dailyRate: number;
  hourlyRate: number;
  overtimeRate: number;
  paymentMethod: string;
  bankName?: string | null;
  accountNumber?: string | null;
  status: 'active' | 'inactive' | 'terminated' | 'on-leave';
  employmentType: 'regular' | 'contractual' | 'part-time' | 'probationary';
  sssNumber?: string | null;
  philhealthNumber?: string | null;
  pagibigNumber?: string | null;
  tinNumber?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EmployeeFilters {
  department?: string;
  position?: string;
  status?: string;
  employmentType?: string;
  search?: string;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  pageSize?: number;
  hireDateFrom?: string;
  hireDateTo?: string;
  minSalary?: number;
  maxSalary?: number;
}

export interface PaginatedResponse<T> {
  employees: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface EmployeeValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface DuplicateCheckResult {
  hasDuplicates: boolean;
  duplicates: Array<{
    field: string;
    value: string;
    existingEmployeeId: number;
    existingEmployeeName: string;
  }>;
}

export interface EmployeeNumberResult {
  employeeNumber: string;
  prefix: string;
  sequence: number;
}

export interface GovernmentValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validatedNumbers: {
    sss?: string;
    philhealth?: string;
    pagibig?: string;
    tin?: string;
  };
}

export interface ServiceTenureResult {
  employeeId: number;
  employeeName: string;
  hireDate: string;
  asOfDate: string;
  tenure: {
    years: number;
    months: number;
    days: number;
    totalDays: number;
    totalMonths: number;
  };
  formattedTenure: string;
  isAnniversary: boolean;
}

export interface AgeResult {
  employeeId: number;
  employeeName: string;
  birthDate: string;
  age: number;
  nextBirthday: string;
  daysUntilBirthday: number;
  isBirthdayToday: boolean;
}

export interface RateCalculationResult {
  basePay: number;
  dailyRate: number;
  hourlyRate: number;
  overtimeRate: number;
  workingDays: number;
  hoursPerDay: number;
}

export interface SalaryIncreaseDetails {
  oldBasePay: number;
  newBasePay: number;
  increaseType: 'percentage' | 'fixed';
  increaseValue: number;
  effectiveDate?: string;
  increaseAmount: number;
}

export interface MasterlistSummary {
  totalEmployees: number;
  totalBasePay: number;
  avgBasePay: number;
  generatedAt: string;
}

export interface DirectoryData {
  directoryByDepartment: Record<string, Employee[]>;
  totalActiveEmployees: number;
  departments: string[];
  generatedAt: string;
}

export interface HeadcountData {
  headcountData: Array<{ department: string; count: string }>;
  totalHeadcount: number;
  asOfDate: string;
  generatedAt: string;
}

export interface SalaryReportStatistics {
  totalEmployees: number;
  totalSalary: number;
  avgSalary: number;
  minSalary: number;
  maxSalary: number;
}

export interface SalaryReportData {
  employees: Employee[];
  statistics: SalaryReportStatistics;
  salaryByDepartment: Record<string, {
    employees: Employee[];
    totalSalary: number;
    avgSalary: number;
  }>;
  filters: {
    department?: string;
    minSalary?: number;
    maxSalary?: number;
  };
  generatedAt: string;
}

export interface BirthdayReportData {
  month: number;
  monthName: string;
  year: number;
  totalBirthdays: number;
  birthdaysByDay: Record<number, Employee[]>;
  employees: Array<Employee & {
    age: number;
    nextBirthday: string;
    daysUntilBirthday: number;
  }>;
  generatedAt: string;
}

export interface EmployeeCountData {
  total: number;
  byStatus: Array<{ status: string; count: string }>;
  byDepartment: Array<{ department: string; count: string }>;
  filters: EmployeeFilters;
}

export interface BaseResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
}

export interface EmployeePayload {
  method: string;
  params?: Record<string, any>;
}

class EmployeeAPI {
  // 📋 BASIC OPERATIONS

  async getAllEmployees(filters?: EmployeeFilters): Promise<BaseResponse<PaginatedResponse<Employee>>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "getAllEmployees",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get employees");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get employees");
    }
  }

  async getEmployeeById(id: number): Promise<BaseResponse<Employee>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "getEmployeeById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get employee");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get employee");
    }
  }

  async getEmployeeByNumber(employeeNumber: string): Promise<BaseResponse<Employee>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "getEmployeeByNumber",
        params: { employeeNumber },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get employee");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get employee");
    }
  }

  async getEmployeesByDepartment(department: string, filters?: EmployeeFilters): Promise<BaseResponse<Employee[]>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "getEmployeesByDepartment",
        params: { department, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get employees by department");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get employees by department");
    }
  }

  async getEmployeesByPosition(position: string, filters?: EmployeeFilters): Promise<BaseResponse<Employee[]>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "getEmployeesByPosition",
        params: { position, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get employees by position");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get employees by position");
    }
  }

  async getEmployeesByStatus(status: string, filters?: EmployeeFilters): Promise<BaseResponse<Employee[]>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "getEmployeesByStatus",
        params: { status, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get employees by status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get employees by status");
    }
  }

  async getEmployeesByEmploymentType(employmentType: string, filters?: EmployeeFilters): Promise<BaseResponse<Employee[]>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "getEmployeesByEmploymentType",
        params: { employmentType, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get employees by employment type");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get employees by employment type");
    }
  }

  async getActiveEmployees(filters?: EmployeeFilters): Promise<BaseResponse<Employee[]>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "getActiveEmployees",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get active employees");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get active employees");
    }
  }

  async getInactiveEmployees(filters?: EmployeeFilters): Promise<BaseResponse<Employee[]>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "getInactiveEmployees",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get inactive employees");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get inactive employees");
    }
  }

  async searchEmployees(query: string, filters?: EmployeeFilters): Promise<BaseResponse<PaginatedResponse<Employee>>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "searchEmployees",
        params: { query, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search employees");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search employees");
    }
  }

  async getEmployeeCount(filters?: EmployeeFilters): Promise<BaseResponse<EmployeeCountData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "getEmployeeCount",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get employee count");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get employee count");
    }
  }

  // ✏️ WRITE OPERATIONS

  async createEmployee(employeeData: Partial<Employee>): Promise<BaseResponse<Employee>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "createEmployee",
        params: employeeData,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create employee");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create employee");
    }
  }

  async updateEmployee(id: number, updateData: Partial<Employee>): Promise<BaseResponse<Employee>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "updateEmployee",
        params: { id, ...updateData },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update employee");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update employee");
    }
  }

  async deleteEmployee(id: number, reason?: string, userId?: number, userType?: string): Promise<BaseResponse<{ id: number; status: string }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "deleteEmployee",
        params: { id, reason, userId, userType },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete employee");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete employee");
    }
  }

  async updateEmployeeStatus(id: number, status: Employee['status'], reason?: string, userId?: number, userType?: string): Promise<BaseResponse<Employee>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "updateEmployeeStatus",
        params: { id, status, reason, userId, userType },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update employee status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update employee status");
    }
  }

  async updateEmployeeSalary(id: number, basePay: number, effectiveDate?: string, reason?: string, userId?: number, userType?: string): Promise<BaseResponse<Employee>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "updateEmployeeSalary",
        params: { id, basePay, effectiveDate, reason, userId, userType },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update employee salary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update employee salary");
    }
  }

  async updateEmployeeDepartment(id: number, department: string, reason?: string, userId?: number, userType?: string): Promise<BaseResponse<Employee>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "updateEmployeeDepartment",
        params: { id, department, reason, userId, userType },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update employee department");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update employee department");
    }
  }

  async updateEmployeePosition(id: number, position: string, reason?: string, userId?: number, userType?: string): Promise<BaseResponse<Employee>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "updateEmployeePosition",
        params: { id, position, reason, userId, userType },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update employee position");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update employee position");
    }
  }

  async updateEmployeeBankInfo(id: number, bankInfo: { bankName?: string; accountNumber?: string; paymentMethod?: string }, userId?: number, userType?: string): Promise<BaseResponse<Employee>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "updateEmployeeBankInfo",
        params: { id, ...bankInfo, userId, userType },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update employee bank info");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update employee bank info");
    }
  }

  async updateEmployeeGovernmentIds(id: number, govtIds: { sssNumber?: string; philhealthNumber?: string; pagibigNumber?: string; tinNumber?: string }, userId?: number, userType?: string): Promise<BaseResponse<Employee>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "updateEmployeeGovernmentIds",
        params: { id, ...govtIds, userId, userType },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update employee government IDs");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update employee government IDs");
    }
  }

  // 💰 PAYROLL OPERATIONS

  async calculateEmployeeRates(employeeId: number, basePay?: number): Promise<BaseResponse<RateCalculationResult>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "calculateEmployeeRates",
        params: { employeeId, basePay },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to calculate employee rates");
    } catch (error: any) {
      throw new Error(error.message || "Failed to calculate employee rates");
    }
  }

  async updateEmployeePayrollInfo(id: number, payrollInfo: { basePay?: number; dailyRate?: number; hourlyRate?: number; overtimeRate?: number; paymentMethod?: string }, userId?: number, userType?: string): Promise<BaseResponse<Employee>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "updateEmployeePayrollInfo",
        params: { id, ...payrollInfo, userId, userType },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update employee payroll info");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update employee payroll info");
    }
  }

  async applySalaryIncrease(id: number, increaseType: 'percentage' | 'fixed', increaseValue: number, effectiveDate?: string, reason?: string, userId?: number, userType?: string): Promise<BaseResponse<Employee & { increaseDetails: SalaryIncreaseDetails }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "applySalaryIncrease",
        params: { id, increaseType, increaseValue, effectiveDate, reason, userId, userType },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to apply salary increase");
    } catch (error: any) {
      throw new Error(error.message || "Failed to apply salary increase");
    }
  }

  // 📊 REPORT OPERATIONS

  async getEmployeeMasterlist(filters?: EmployeeFilters): Promise<BaseResponse<{ employees: Employee[]; summary: MasterlistSummary }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "getEmployeeMasterlist",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get employee masterlist");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get employee masterlist");
    }
  }

  async getEmployeeDirectory(filters?: EmployeeFilters): Promise<BaseResponse<DirectoryData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "getEmployeeDirectory",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get employee directory");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get employee directory");
    }
  }

  async getDepartmentHeadcount(date?: string): Promise<BaseResponse<HeadcountData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "getDepartmentHeadcount",
        params: { date },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get department headcount");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get department headcount");
    }
  }

  async getEmployeeSalaryReport(department?: string, minSalary?: number, maxSalary?: number): Promise<BaseResponse<SalaryReportData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "getEmployeeSalaryReport",
        params: { department, minSalary, maxSalary },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get employee salary report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get employee salary report");
    }
  }

  async getEmployeeBirthdayReport(month?: number, year?: number): Promise<BaseResponse<BirthdayReportData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "getEmployeeBirthdayReport",
        params: { month, year },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get employee birthday report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get employee birthday report");
    }
  }

  // ⚙️ VALIDATION & UTILITY OPERATIONS

  async validateEmployeeData(employeeData: Partial<Employee>): Promise<BaseResponse<EmployeeValidationResult>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "validateEmployeeData",
        params: employeeData,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to validate employee data");
    } catch (error: any) {
      throw new Error(error.message || "Failed to validate employee data");
    }
  }

  async checkDuplicateEmployee(employeeData: Partial<Employee>): Promise<BaseResponse<DuplicateCheckResult>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "checkDuplicateEmployee",
        params: employeeData,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to check for duplicates");
    } catch (error: any) {
      throw new Error(error.message || "Failed to check for duplicates");
    }
  }

  async generateEmployeeNumber(prefix?: string): Promise<BaseResponse<EmployeeNumberResult>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "generateEmployeeNumber",
        params: { prefix },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to generate employee number");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate employee number");
    }
  }

  async validateGovernmentNumbers(sss?: string, philhealth?: string, pagibig?: string, tin?: string): Promise<BaseResponse<GovernmentValidationResult>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "validateGovernmentNumbers",
        params: { sss, philhealth, pagibig, tin },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to validate government numbers");
    } catch (error: any) {
      throw new Error(error.message || "Failed to validate government numbers");
    }
  }

  async calculateServiceTenure(employeeId: number, asOfDate?: string): Promise<BaseResponse<ServiceTenureResult>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "calculateServiceTenure",
        params: { employeeId, asOfDate },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to calculate service tenure");
    } catch (error: any) {
      throw new Error(error.message || "Failed to calculate service tenure");
    }
  }

  async getEmployeeAge(employeeId: number): Promise<BaseResponse<AgeResult>> {
    try {
      if (!window.backendAPI || !window.backendAPI.employee) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.employee({
        method: "getEmployeeAge",
        params: { employeeId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get employee age");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get employee age");
    }
  }

  // 🔧 UTILITY METHODS

  async getEmployeeByEmail(email: string): Promise<BaseResponse<Employee>> {
    try {
      // Use search method to find by email
      const response = await this.searchEmployees(email, { pageSize: 1 });
      
      if (response.status && response.data.employees.length > 0) {
        const employee = response.data.employees[0];
        if (employee.email === email) {
          return {
            status: true,
            message: "Employee found",
            data: employee
          };
        }
      }
      
      return {
        status: false,
        message: "Employee not found",
        data: null as any
      };
    } catch (error: any) {
      throw new Error(error.message || "Failed to get employee by email");
    }
  }

  async getEmployeesBySalaryRange(minSalary: number, maxSalary: number, filters?: EmployeeFilters): Promise<BaseResponse<Employee[]>> {
    try {
      const allFilters: EmployeeFilters = {
        ...filters,
        minSalary,
        maxSalary
      };
      
      const response = await this.searchEmployees("", allFilters);
      return {
        status: response.status,
        message: response.message,
        data: response.data.employees
      };
    } catch (error: any) {
      throw new Error(error.message || "Failed to get employees by salary range");
    }
  }

  async getRecentHires(days: number = 30): Promise<BaseResponse<Employee[]>> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);
      
      const hireDateFrom = thirtyDaysAgo.toISOString().split('T')[0];
      
      const response = await this.searchEmployees("", {
        hireDateFrom,
        sortField: "hireDate",
        sortOrder: "DESC"
      });
      
      return {
        status: response.status,
        message: response.message,
        data: response.data.employees
      };
    } catch (error: any) {
      throw new Error(error.message || "Failed to get recent hires");
    }
  }

  async getUpcomingBirthdays(days: number = 30): Promise<BaseResponse<Employee[]>> {
    try {
      // Get all active employees with birth dates
      const response = await this.getActiveEmployees();
      
      if (!response.status) {
        return response;
      }
      
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);
      
      const upcomingBirthdays = response.data.filter(employee => {
        if (!employee.birthDate) return false;
        
        const birthDate = new Date(employee.birthDate);
        const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        
        if (nextBirthday < today) {
          nextBirthday.setFullYear(today.getFullYear() + 1);
        }
        
        return nextBirthday <= futureDate && nextBirthday >= today;
      });
      
      // Sort by next birthday
      upcomingBirthdays.sort((a, b) => {
        const dateA = new Date(a.birthDate!);
        const dateB = new Date(b.birthDate!);
        
        const nextA = new Date(today.getFullYear(), dateA.getMonth(), dateA.getDate());
        const nextB = new Date(today.getFullYear(), dateB.getMonth(), dateB.getDate());
        
        if (nextA < today) nextA.setFullYear(today.getFullYear() + 1);
        if (nextB < today) nextB.setFullYear(today.getFullYear() + 1);
        
        return nextA.getTime() - nextB.getTime();
      });
      
      return {
        status: true,
        message: "Upcoming birthdays retrieved",
        data: upcomingBirthdays
      };
    } catch (error: any) {
      throw new Error(error.message || "Failed to get upcoming birthdays");
    }
  }

  async getEmployeeStatistics(): Promise<BaseResponse<{
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    averageSalary: number;
    departments: Array<{ name: string; count: number; avgSalary: number }>;
  }>> {
    try {
      const [countResponse, activeResponse, salaryReport] = await Promise.all([
        this.getEmployeeCount(),
        this.getActiveEmployees(),
        this.getEmployeeSalaryReport()
      ]);
      
      if (!countResponse.status || !activeResponse.status || !salaryReport.status) {
        throw new Error("Failed to get statistics");
      }
      
      const total = countResponse.data.total;
      const active = activeResponse.data.length;
      const inactive = total - active;
      const avgSalary = salaryReport.data.statistics.avgSalary;
      
      // Get department statistics
      const departments = Object.entries(salaryReport.data.salaryByDepartment).map(([name, data]) => ({
        name,
        count: data.employees.length,
        avgSalary: data.avgSalary
      }));
      
      return {
        status: true,
        message: "Statistics retrieved",
        data: {
          totalEmployees: total,
          activeEmployees: active,
          inactiveEmployees: inactive,
          averageSalary: avgSalary,
          departments
        }
      };
    } catch (error: any) {
      throw new Error(error.message || "Failed to get employee statistics");
    }
  }

  async validateAndCreateEmployee(employeeData: Partial<Employee>): Promise<BaseResponse<Employee>> {
    try {
      // First validate the data
      const validation = await this.validateEmployeeData(employeeData);
      if (!validation.data.isValid) {
        return {
          status: false,
          message: "Validation failed",
          data: validation.data as any
        };
      }
      
      // Check for duplicates
      const duplicateCheck = await this.checkDuplicateEmployee(employeeData);
      if (duplicateCheck.data.hasDuplicates) {
        return {
          status: false,
          message: "Duplicate employee found",
          data: duplicateCheck.data as any
        };
      }
      
      // Validate government numbers if provided
      if (employeeData.sssNumber || employeeData.philhealthNumber || employeeData.pagibigNumber || employeeData.tinNumber) {
        const govtValidation = await this.validateGovernmentNumbers(
          employeeData.sssNumber as string | undefined,
          employeeData.philhealthNumber as string | undefined,
          employeeData.pagibigNumber as string | undefined,
          employeeData.tinNumber as string | undefined
        );
        
        if (!govtValidation.data.isValid) {
          return {
            status: false,
            message: "Government number validation failed",
            data: govtValidation.data as any
          };
        }
      }
      
      // Generate employee number if not provided
      if (!employeeData.employeeNumber) {
        const numberResult = await this.generateEmployeeNumber();
        if (numberResult.status) {
          employeeData.employeeNumber = numberResult.data.employeeNumber;
        }
      }
      
      // Create the employee
      return await this.createEmployee(employeeData);
    } catch (error: any) {
      throw new Error(error.message || "Failed to validate and create employee");
    }
  }

  async bulkUpdateStatus(employeeIds: number[], status: Employee['status'], reason?: string, userId?: number, userType?: string): Promise<BaseResponse<{ updated: number; failed: number; results: Array<{ id: number; success: boolean; message: string }> }>> {
    try {
      const results = [];
      let updated = 0;
      let failed = 0;
      
      for (const id of employeeIds) {
        try {
          const result = await this.updateEmployeeStatus(id, status, reason, userId, userType);
          if (result.status) {
            updated++;
            results.push({ id, success: true, message: "Updated successfully" });
          } else {
            failed++;
            results.push({ id, success: false, message: result.message });
          }
        } catch (error: any) {
          failed++;
          results.push({ id, success: false, message: error.message });
        }
      }
      
      return {
        status: true,
        message: `Bulk update completed: ${updated} updated, ${failed} failed`,
        data: { updated, failed, results }
      };
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk update status");
    }
  }

  // 🎲 HELPER METHODS

  formatEmployeeName(employee: Employee): string {
    const middleInitial = employee.middleName ? ` ${employee.middleName.charAt(0)}.` : '';
    return `${employee.firstName}${middleInitial} ${employee.lastName}`.trim();
  }

  calculateYearsOfService(employee: Employee, asOfDate?: string): number {
    const hireDate = new Date(employee.hireDate);
    const endDate = asOfDate ? new Date(asOfDate) : new Date();
    
    let years = endDate.getFullYear() - hireDate.getFullYear();
    const monthDiff = endDate.getMonth() - hireDate.getMonth();
    const dayDiff = endDate.getDate() - hireDate.getDate();
    
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      years--;
    }
    
    return years;
  }

  formatSalary(salary: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(salary);
  }

  getEmployeeStatusColor(status: Employee['status']): string {
    const colors: Record<Employee['status'], string> = {
      'active': 'green',
      'inactive': 'gray',
      'terminated': 'red',
      'on-leave': 'blue'
    };
    return colors[status] || 'gray';
  }

  getEmploymentTypeLabel(type: Employee['employmentType']): string {
    const labels: Record<Employee['employmentType'], string> = {
      'regular': 'Regular',
      'contractual': 'Contractual',
      'part-time': 'Part-time',
      'probationary': 'Probationary'
    };
    return labels[type] || type;
  }
}

const employeeAPI = new EmployeeAPI();

export default employeeAPI;
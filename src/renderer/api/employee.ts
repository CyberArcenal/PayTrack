// src/renderer/api/employee.ts
// Employee API – katulad ng attendance_log.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces (based on Employee entity)
// ----------------------------------------------------------------------

export interface Employee {
  id: number;
  employeeNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  birthDate: string | null;          // ISO date
  hireDate: string;                   // ISO date
  position: string | null;
  department: string | null;
  basePay: number;                    // decimal
  dailyRate: number;                  // decimal
  hourlyRate: number;                  // decimal
  overtimeRate: number;                // decimal
  paymentMethod: string;
  bankName: string | null;
  accountNumber: string | null;
  status: string;                      // 'active', 'inactive', 'terminated', 'on-leave'
  employmentType: string;               // 'regular', 'contractual', 'part-time', 'probationary'
  sssNumber: string | null;
  philhealthNumber: string | null;
  pagibigNumber: string | null;
  tinNumber: string | null;
  createdAt: string;                    // ISO datetime
  updatedAt: string;                    // ISO datetime
}

export interface PaginatedEmployees {
  items: Employee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EmployeeSummary {
  total: number;
  statusCounts: Array<{ status: string; count: number }>;
  departmentCounts: Array<{ department: string; count: number }>;
  employmentTypeCounts: Array<{ employmentType: string; count: number }>;
}

// Para sa bulk operations
export interface BulkCreateResult {
  created: Employee[];
  errors?: Array<{ index: number; error: string }>;
}

export interface BulkUpdateResult {
  updated: Array<{ id: number; before: Employee; after: Employee }>;
  errors?: Array<{ id: number; error: string }>;
}

export interface FileOperationResult {
  filePath: string;
}

export interface ReportResult {
  filePath: string;
  format: string;
  entryCount: number;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface EmployeesResponse {
  status: boolean;
  message: string;
  data: Employee[];                     // for getAll, getByDepartment, search, etc.
}

export interface PaginatedEmployeesResponse {
  status: boolean;
  message: string;
  data: PaginatedEmployees;
}

export interface EmployeeResponse {
  status: boolean;
  message: string;
  data: Employee;
}

export interface EmployeeSummaryResponse {
  status: boolean;
  message: string;
  data: EmployeeSummary;
}

export interface ExportEmployeesResponse {
  status: boolean;
  message: string;
  data: FileOperationResult;
}

export interface GenerateReportResponse {
  status: boolean;
  message: string;
  data: ReportResult;
}

export interface BulkCreateResponse {
  status: boolean;
  message: string;
  data: BulkCreateResult;
}

export interface BulkUpdateResponse {
  status: boolean;
  message: string;
  data: BulkUpdateResult;
}

export interface DeleteResponse {
  status: boolean;
  message: string;
  data: null;
}

// ----------------------------------------------------------------------
// 🧠 EmployeeAPI Class
// ----------------------------------------------------------------------

class EmployeeAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all employees with optional filters and pagination.
   * @param params - { status?, department?, employmentType?, search?, page?, limit? }
   */
  async getAll(params?: {
    status?: string;
    department?: string;
    employmentType?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<EmployeesResponse> {
    try {
      if (!window.backendAPI?.employee) {
        throw new Error("Electron API (employee) not available");
      }

      const response = await window.backendAPI.employee({
        method: "getAllEmployees",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch employees");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch employees");
    }
  }

  /**
   * Get employee by ID.
   * @param id - Employee ID
   */
  async getById(id: number): Promise<EmployeeResponse> {
    try {
      if (!window.backendAPI?.employee) {
        throw new Error("Electron API (employee) not available");
      }

      const response = await window.backendAPI.employee({
        method: "getEmployeeById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch employee");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch employee");
    }
  }

  /**
   * Get employee by employee number.
   * @param employeeNumber - Unique employee number
   */
  async getByNumber(employeeNumber: string): Promise<EmployeeResponse> {
    try {
      if (!window.backendAPI?.employee) {
        throw new Error("Electron API (employee) not available");
      }

      const response = await window.backendAPI.employee({
        method: "getEmployeeByNumber",
        params: { employeeNumber },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch employee by number");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch employee by number");
    }
  }

  /**
   * Get employees by department.
   * @param department - Department name
   */
  async getByDepartment(department: string): Promise<EmployeesResponse> {
    try {
      if (!window.backendAPI?.employee) {
        throw new Error("Electron API (employee) not available");
      }

      const response = await window.backendAPI.employee({
        method: "getEmployeesByDepartment",
        params: { department },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch employees by department");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch employees by department");
    }
  }

  /**
   * Get employees by status.
   * @param status - Employee status (active, inactive, terminated, on-leave)
   */
  async getByStatus(status: string): Promise<EmployeesResponse> {
    try {
      if (!window.backendAPI?.employee) {
        throw new Error("Electron API (employee) not available");
      }

      const response = await window.backendAPI.employee({
        method: "getEmployeesByStatus",
        params: { status },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch employees by status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch employees by status");
    }
  }

  /**
   * Get employee statistics (summary).
   */
  async getStats(): Promise<EmployeeSummaryResponse> {
    try {
      if (!window.backendAPI?.employee) {
        throw new Error("Electron API (employee) not available");
      }

      const response = await window.backendAPI.employee({
        method: "getEmployeeStats",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch employee statistics");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch employee statistics");
    }
  }

  /**
   * Search employees by keyword (name, email, employee number, etc.).
   * @param params - { search, page?, limit? }
   */
  async search(params: {
    search: string;
    page?: number;
    limit?: number;
  }): Promise<EmployeesResponse> {
    try {
      if (!window.backendAPI?.employee) {
        throw new Error("Electron API (employee) not available");
      }

      const response = await window.backendAPI.employee({
        method: "searchEmployees",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search employees");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search employees");
    }
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATION METHODS
  // --------------------------------------------------------------------

  /**
   * Create a new employee.
   * @param data - Employee data (all required fields except generated ones)
   * @param user - Optional username (defaults to 'system')
   */
  async create(
    data: Omit<
      Employee,
      | "id"
      | "employeeNumber"
      | "createdAt"
      | "updatedAt"
      | "dailyRate"
      | "hourlyRate"
    > & {
      employeeNumber?: string; // optional, backend can generate
      dailyRate?: number;
      hourlyRate?: number;
    },
    user: string = "system"
  ): Promise<EmployeeResponse> {
    try {
      if (!window.backendAPI?.employee) {
        throw new Error("Electron API (employee) not available");
      }

      const response = await window.backendAPI.employee({
        method: "createEmployee",
        params: data,
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create employee");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create employee");
    }
  }

  /**
   * Update an existing employee.
   * @param id - Employee ID
   * @param data - Partial fields to update
   * @param user - Optional username
   */
  async update(
    id: number,
    data: Partial<Omit<Employee, "id" | "createdAt" | "updatedAt">>,
    user: string = "system"
  ): Promise<EmployeeResponse> {
    try {
      if (!window.backendAPI?.employee) {
        throw new Error("Electron API (employee) not available");
      }

      const response = await window.backendAPI.employee({
        method: "updateEmployee",
        params: { id, ...data },
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update employee");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update employee");
    }
  }

  /**
   * Delete an employee.
   * @param id - Employee ID
   * @param user - Optional username
   */
  async delete(id: number, user: string = "system"): Promise<DeleteResponse> {
    try {
      if (!window.backendAPI?.employee) {
        throw new Error("Electron API (employee) not available");
      }

      const response = await window.backendAPI.employee({
        method: "deleteEmployee",
        params: { id },
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete employee");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete employee");
    }
  }

  /**
   * Bulk create employees.
   * @param records - Array of employee data (same as create but without employeeNumber)
   * @param user - Optional username
   */
  async bulkCreate(
    records: Array<
      Omit<Employee, "id" | "employeeNumber" | "createdAt" | "updatedAt"> & {
        employeeNumber?: string;
      }
    >,
    user: string = "system"
  ): Promise<BulkCreateResponse> {
    try {
      if (!window.backendAPI?.employee) {
        throw new Error("Electron API (employee) not available");
      }

      const response = await window.backendAPI.employee({
        method: "bulkCreateEmployees",
        params: { employees: records },
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk create employees");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk create employees");
    }
  }

  /**
   * Bulk update employees.
   * @param updates - Array of { id, data }
   * @param user - Optional username
   */
  async bulkUpdate(
    updates: Array<{ id: number; data: Partial<Omit<Employee, "id" | "createdAt" | "updatedAt">> }>,
    user: string = "system"
  ): Promise<BulkUpdateResponse> {
    try {
      if (!window.backendAPI?.employee) {
        throw new Error("Electron API (employee) not available");
      }

      const response = await window.backendAPI.employee({
        method: "bulkUpdateEmployees",
        params: { updates },
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk update employees");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk update employees");
    }
  }

  /**
   * Update employee status.
   * @param id - Employee ID
   * @param status - New status ('active', 'inactive', 'terminated', 'on-leave')
   * @param user - Optional username
   */
  async updateStatus(
    id: number,
    status: string,
    user: string = "system"
  ): Promise<EmployeeResponse> {
    try {
      if (!window.backendAPI?.employee) {
        throw new Error("Electron API (employee) not available");
      }

      const response = await window.backendAPI.employee({
        method: "updateEmployeeStatus",
        params: { id, status },
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update employee status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update employee status");
    }
  }

  /**
   * Terminate an employee (special status update).
   * @param id - Employee ID
   * @param reason - Optional termination reason (will be logged)
   * @param user - Optional username
   */
  async terminate(
    id: number,
    reason?: string,
    user: string = "system"
  ): Promise<EmployeeResponse> {
    try {
      if (!window.backendAPI?.employee) {
        throw new Error("Electron API (employee) not available");
      }

      const response = await window.backendAPI.employee({
        method: "terminateEmployee",
        params: { id, reason },
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to terminate employee");
    } catch (error: any) {
      throw new Error(error.message || "Failed to terminate employee");
    }
  }

  // --------------------------------------------------------------------
  // 📁 EXPORT & REPORT METHODS
  // --------------------------------------------------------------------

  /**
   * Export employees to CSV.
   * @param filters - Optional filters (status, department, etc.)
   * @param columns - Optional list of columns to include
   */
  async exportCSV(
    filters?: {
      status?: string;
      department?: string;
      employmentType?: string;
    },
    columns?: string[]
  ): Promise<ExportEmployeesResponse> {
    try {
      if (!window.backendAPI?.employee) {
        throw new Error("Electron API (employee) not available");
      }

      const response = await window.backendAPI.employee({
        method: "exportEmployeesToCSV",
        params: { filters, columns },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export employees to CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export employees to CSV");
    }
  }

  /**
   * Generate an employee report.
   * @param params - { includeDetails?, department? }
   */
  async generateReport(params?: {
    includeDetails?: boolean;
    department?: string;
    format?: "json" | "html";
  }): Promise<GenerateReportResponse> {
    try {
      if (!window.backendAPI?.employee) {
        throw new Error("Electron API (employee) not available");
      }

      const response = await window.backendAPI.employee({
        method: "generateEmployeeReport",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to generate employee report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate employee report");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if an employee exists.
   * @param id - Employee ID
   */
  async exists(id: number): Promise<boolean> {
    try {
      const response = await this.getById(id);
      return response.status;
    } catch {
      return false;
    }
  }

  /**
   * Check if an employee number is already taken.
   * @param employeeNumber - Employee number to check
   */
  async isEmployeeNumberTaken(employeeNumber: string): Promise<boolean> {
    try {
      const response = await this.getByNumber(employeeNumber);
      return response.status;
    } catch {
      return false;
    }
  }

  /**
   * Validate if the backend API is available.
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.employee);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const employeeAPI = new EmployeeAPI();
export default employeeAPI;
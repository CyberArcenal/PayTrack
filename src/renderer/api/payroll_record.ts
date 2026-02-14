// src/renderer/api/payrollRecord.ts
// Payroll Record API – similar structure to attendance_log.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces (based on PayrollRecord entity and relations)
// ----------------------------------------------------------------------

// Minimal employee info for nested objects
export interface EmployeeMinimal {
  id: number;
  firstName: string;
  lastName: string;
  employeeNumber: string;
}

// Minimal period info
export interface PayrollPeriodMinimal {
  id: number;
  name: string | null;
  startDate: string;      // YYYY-MM-DD
  endDate: string;        // YYYY-MM-DD
  periodType: string;
}

// Minimal deduction info
export interface DeductionMinimal {
  id: number;
  type: string;
  code: string | null;
  description: string | null;
  amount: number;
  isRecurring: boolean;
  appliedDate: string;    // YYYY-MM-DD
}

// Minimal overtime log info
export interface OvertimeLogMinimal {
  id: number;
  date: string;           // YYYY-MM-DD
  hours: number;
  rate: number;
  amount: number;
  type: string;
  approvalStatus: string;
}

// Minimal attendance log info
export interface AttendanceLogMinimal {
  id: number;
  timestamp: string;      // ISO datetime
  status: string;
  hoursWorked: number;
  overtimeHours: number;
  lateMinutes: number;
}

// Main Payroll Record entry
export interface PayrollRecordEntry {
  id: number;
  employeeId: number;
  periodId: number;

  daysPresent: number;
  daysAbsent: number;
  daysLate: number;
  daysHalfDay: number;

  basicPay: number;               // decimal
  overtimeHours: number;          // decimal
  overtimePay: number;            // decimal
  holidayPay: number;             // decimal
  nightDiffPay: number;           // decimal
  allowance: number;              // decimal
  bonus: number;                  // decimal
  grossPay: number;               // decimal

  sssDeduction: number;           // decimal
  philhealthDeduction: number;    // decimal
  pagibigDeduction: number;       // decimal
  taxDeduction: number;           // decimal
  loanDeduction: number;          // decimal
  advanceDeduction: number;       // decimal
  otherDeductions: number;        // decimal
  deductionsTotal: number;        // decimal

  netPay: number;                 // decimal

  computedAt: string | null;      // ISO datetime
  paymentStatus: string;          // unpaid, paid, partially-paid, cancelled
  paidAt: string | null;          // ISO datetime
  paymentMethod: string | null;
  paymentReference: string | null;
  remarks: string | null;

  createdAt: string;              // ISO datetime
  updatedAt: string;              // ISO datetime

  // Optional relations (when populated)
  employee?: EmployeeMinimal;
  period?: PayrollPeriodMinimal;
  deductions?: DeductionMinimal[];
  overtimeLogs?: OvertimeLogMinimal[];
  attendanceLogs?: AttendanceLogMinimal[];
}

export interface PaginatedPayrollRecords {
  items: PayrollRecordEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PayrollSummary {
  totalRecords: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  statusCounts: Array<{ status: string; count: number }>;
}

export interface PayrollStats {
  // Currently reusing summary; can be extended later
  totalRecords: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  statusCounts: Array<{ status: string; count: number }>;
}

export interface FileOperationResult {
  filePath: string;
}

export interface PayrollReportResult {
  filePath: string;
  format: string;
  recordCount: number;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface PayrollRecordsResponse {
  status: boolean;
  message: string;
  data: PayrollRecordEntry[];               // For getAll, search, byEmployee, etc.
}

export interface PaginatedPayrollRecordsResponse {
  status: boolean;
  message: string;
  data: PaginatedPayrollRecords;
}

export interface PayrollRecordResponse {
  status: boolean;
  message: string;
  data: PayrollRecordEntry;
}

export interface PayrollSummaryResponse {
  status: boolean;
  message: string;
  data: PayrollSummary;
}

export interface PayrollStatsResponse {
  status: boolean;
  message: string;
  data: PayrollStats;
}

export interface ExportPayrollRecordsResponse {
  status: boolean;
  message: string;
  data: FileOperationResult;
}

export interface GeneratePayrollReportResponse {
  status: boolean;
  message: string;
  data: PayrollReportResult;
}

export interface BulkOperationResponse {
  status: boolean;
  message: string;
  data: {
    successful: any[];
    failed: Array<{ index: number; reason: string }>;
  };
}

// ----------------------------------------------------------------------
// 🧠 PayrollRecordAPI Class
// ----------------------------------------------------------------------

class PayrollRecordAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all payroll records with optional filters and pagination.
   * @param params - Filters: employeeId, periodId, paymentStatus, startDate, endDate, page, limit
   */
  async getAll(params?: {
    employeeId?: number;
    periodId?: number;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PayrollRecordsResponse> {
    try {
      if (!window.backendAPI?.payrollRecord) {
        throw new Error("Electron API (payrollRecord) not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "getAllPayrollRecords",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch payroll records");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch payroll records");
    }
  }

  /**
   * Get a single payroll record by ID.
   * @param id - Payroll record ID
   */
  async getById(id: number): Promise<PayrollRecordResponse> {
    try {
      if (!window.backendAPI?.payrollRecord) {
        throw new Error("Electron API (payrollRecord) not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "getPayrollRecordById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch payroll record");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch payroll record");
    }
  }

  /**
   * Get payroll records for a specific employee.
   * @param params - employeeId, paymentStatus?, startDate?, endDate?, page?, limit?
   */
  async getByEmployee(params: {
    employeeId: number;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PayrollRecordsResponse> {
    try {
      if (!window.backendAPI?.payrollRecord) {
        throw new Error("Electron API (payrollRecord) not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "getPayrollRecordsByEmployee",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch employee payroll records");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch employee payroll records");
    }
  }

  /**
   * Get payroll records for a specific period.
   * @param params - periodId, paymentStatus?, page?, limit?
   */
  async getByPeriod(params: {
    periodId: number;
    paymentStatus?: string;
    page?: number;
    limit?: number;
  }): Promise<PayrollRecordsResponse> {
    try {
      if (!window.backendAPI?.payrollRecord) {
        throw new Error("Electron API (payrollRecord) not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "getPayrollRecordsByPeriod",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch period payroll records");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch period payroll records");
    }
  }

  /**
   * Get payroll records by payment status.
   * @param params - paymentStatus, employeeId?, periodId?, startDate?, endDate?, page?, limit?
   */
  async getByStatus(params: {
    paymentStatus: string;
    employeeId?: number;
    periodId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PayrollRecordsResponse> {
    try {
      if (!window.backendAPI?.payrollRecord) {
        throw new Error("Electron API (payrollRecord) not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "getPayrollRecordsByStatus",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch payroll records by status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch payroll records by status");
    }
  }

  /**
   * Get payroll statistics (summary totals).
   * @param params - periodId?, startDate?, endDate?
   */
  async getStats(params?: {
    periodId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<PayrollStatsResponse> {
    try {
      if (!window.backendAPI?.payrollRecord) {
        throw new Error("Electron API (payrollRecord) not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "getPayrollRecordStats",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch payroll stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch payroll stats");
    }
  }

  /**
   * Search payroll records using flexible filters.
   * @param params - searchTerm, employeeId?, periodId?, paymentStatus?, startDate?, endDate?, page?, limit?
   */
  async search(params: {
    searchTerm: string;
    employeeId?: number;
    periodId?: number;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PayrollRecordsResponse> {
    try {
      if (!window.backendAPI?.payrollRecord) {
        throw new Error("Electron API (payrollRecord) not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "searchPayrollRecords",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search payroll records");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search payroll records");
    }
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATION METHODS
  // --------------------------------------------------------------------

  /**
   * Create a new payroll record (manual entry).
   * @param data - Payroll record data (employeeId, periodId, and optionally days counts, earnings, etc.)
   * @param user - Optional username (defaults to 'system')
   */
  async create(data: Partial<PayrollRecordEntry> & { employeeId: number; periodId: number }, user: string = "system"): Promise<PayrollRecordResponse> {
    try {
      if (!window.backendAPI?.payrollRecord) {
        throw new Error("Electron API (payrollRecord) not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "createPayrollRecord",
        params: { ...data, userId: user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create payroll record");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create payroll record");
    }
  }

  /**
   * Update an existing payroll record.
   * @param id - Payroll record ID
   * @param data - Fields to update
   * @param user - Optional username
   */
  async update(id: number, data: Partial<PayrollRecordEntry>, user: string = "system"): Promise<PayrollRecordResponse> {
    try {
      if (!window.backendAPI?.payrollRecord) {
        throw new Error("Electron API (payrollRecord) not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "updatePayrollRecord",
        params: { id, ...data, userId: user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update payroll record");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update payroll record");
    }
  }

  /**
   * Delete a payroll record (only if unpaid).
   * @param id - Payroll record ID
   * @param user - Optional username
   */
  async delete(id: number, user: string = "system"): Promise<{ status: boolean; message: string; data: any }> {
    try {
      if (!window.backendAPI?.payrollRecord) {
        throw new Error("Electron API (payrollRecord) not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "deletePayrollRecord",
        params: { id, userId: user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete payroll record");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete payroll record");
    }
  }

  /**
   * Bulk create payroll records.
   * @param records - Array of payroll record data (each must include employeeId and periodId)
   * @param user - Optional username
   */
  async bulkCreate(records: Array<Partial<PayrollRecordEntry> & { employeeId: number; periodId: number }>, user: string = "system"): Promise<BulkOperationResponse> {
    try {
      if (!window.backendAPI?.payrollRecord) {
        throw new Error("Electron API (payrollRecord) not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "bulkCreatePayrollRecords",
        params: { records, userId: user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk create payroll records");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk create payroll records");
    }
  }

  /**
   * Bulk update payroll records.
   * @param updates - Array of { id, data }
   * @param user - Optional username
   */
  async bulkUpdate(updates: Array<{ id: number; data: Partial<PayrollRecordEntry> }>, user: string = "system"): Promise<BulkOperationResponse> {
    try {
      if (!window.backendAPI?.payrollRecord) {
        throw new Error("Electron API (payrollRecord) not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "bulkUpdatePayrollRecords",
        params: { updates, userId: user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk update payroll records");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk update payroll records");
    }
  }

  /**
   * Compute payroll for an employee in a given period (auto-generate from attendance, overtime, etc.).
   * @param employeeId - Employee ID
   * @param periodId - Payroll period ID
   * @param user - Optional username
   */
  async compute(employeeId: number, periodId: number, user: string = "system"): Promise<PayrollRecordResponse> {
    try {
      if (!window.backendAPI?.payrollRecord) {
        throw new Error("Electron API (payrollRecord) not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "computePayroll",
        params: { employeeId, periodId, userId: user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to compute payroll");
    } catch (error: any) {
      throw new Error(error.message || "Failed to compute payroll");
    }
  }

  /**
   * Mark a payroll record as paid.
   * @param id - Payroll record ID
   * @param paymentData - { paymentMethod?, paymentReference?, paidAt? }
   * @param user - Optional username
   */
  async markAsPaid(id: number, paymentData: { paymentMethod?: string; paymentReference?: string; paidAt?: string | Date } = {}, user: string = "system"): Promise<PayrollRecordResponse> {
    try {
      if (!window.backendAPI?.payrollRecord) {
        throw new Error("Electron API (payrollRecord) not available");
      }

      // Convert Date to ISO string if needed
      const processedPaymentData = { ...paymentData };
      if (processedPaymentData.paidAt instanceof Date) {
        processedPaymentData.paidAt = processedPaymentData.paidAt.toISOString();
      }

      const response = await window.backendAPI.payrollRecord({
        method: "markAsPaid",
        params: { id, paymentData: processedPaymentData, userId: user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to mark payroll as paid");
    } catch (error: any) {
      throw new Error(error.message || "Failed to mark payroll as paid");
    }
  }

  /**
   * Cancel a payroll record (set payment status to 'cancelled').
   * @param id - Payroll record ID
   * @param user - Optional username
   */
  async cancel(id: number, user: string = "system"): Promise<PayrollRecordResponse> {
    try {
      if (!window.backendAPI?.payrollRecord) {
        throw new Error("Electron API (payrollRecord) not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "cancelPayrollRecord",
        params: { id, userId: user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to cancel payroll record");
    } catch (error: any) {
      throw new Error(error.message || "Failed to cancel payroll record");
    }
  }

  // --------------------------------------------------------------------
  // 📁 EXPORT & REPORT METHODS
  // --------------------------------------------------------------------

  /**
   * Export filtered payroll records to CSV.
   * @param params - Filters: employeeId, periodId, paymentStatus, startDate, endDate
   */
  async exportCSV(params?: {
    employeeId?: number;
    periodId?: number;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ExportPayrollRecordsResponse> {
    try {
      if (!window.backendAPI?.payrollRecord) {
        throw new Error("Electron API (payrollRecord) not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "exportPayrollRecordsToCSV",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export payroll records to CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export payroll records to CSV");
    }
  }

  /**
   * Generate a payroll report (summary + records).
   * @param params - periodId?, startDate?, endDate?, format? (not used yet)
   */
  async generateReport(params?: {
    periodId?: number;
    startDate?: string;
    endDate?: string;
    format?: string;
  }): Promise<GeneratePayrollReportResponse> {
    try {
      if (!window.backendAPI?.payrollRecord) {
        throw new Error("Electron API (payrollRecord) not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "generatePayrollReport",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to generate payroll report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate payroll report");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if a payroll record exists for an employee in a given period.
   * @param employeeId - Employee ID
   * @param periodId - Payroll period ID
   */
  async exists(employeeId: number, periodId: number): Promise<boolean> {
    try {
      const response = await this.getAll({
        employeeId,
        periodId,
        limit: 1,
      });
      return (response.data?.length ?? 0) > 0;
    } catch (error) {
      console.error("Error checking payroll record existence:", error);
      return false;
    }
  }

  /**
   * Get the latest payroll record for an employee.
   * @param employeeId - Employee ID
   */
  async getLatestForEmployee(employeeId: number): Promise<PayrollRecordEntry | null> {
    try {
      const response = await this.getAll({
        employeeId,
        limit: 1,
        page: 1,
      });
      return response.data?.[0] || null;
    } catch (error) {
      console.error("Error fetching latest payroll record:", error);
      return null;
    }
  }

  /**
   * Validate if the backend API is available.
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.payrollRecord);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const payrollRecordAPI = new PayrollRecordAPI();
export default payrollRecordAPI;
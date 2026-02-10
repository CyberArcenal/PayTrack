// payrollRecordAPI.ts - Type-safe API for Payroll Record Management
// @ts-check

// ==================== INTERFACES ====================

export interface PayrollRecordData {
  id?: number;
  employeeId: number;
  periodId: number;
  daysPresent?: number;
  daysAbsent?: number;
  daysLate?: number;
  daysHalfDay?: number;
  basicPay?: number;
  overtimeHours?: number;
  overtimePay?: number;
  holidayPay?: number;
  nightDiffPay?: number;
  allowance?: number;
  bonus?: number;
  grossPay?: number;
  sssDeduction?: number;
  philhealthDeduction?: number;
  pagibigDeduction?: number;
  taxDeduction?: number;
  loanDeduction?: number;
  advanceDeduction?: number;
  otherDeductions?: number;
  deductionsTotal?: number;
  netPay?: number;
  computedAt?: string | Date;
  paymentStatus?: "unpaid" | "paid" | "partially-paid" | "cancelled";
  paidAt?: string | Date;
  paymentMethod?: string;
  paymentReference?: string;
  remarks?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface DeductionData {
  id?: number;
  payrollRecordId: number;
  type: string;
  code?: string;
  description?: string;
  amount: number;
  percentage?: number;
  isRecurring?: boolean;
  appliedDate?: string | Date;
  note?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PayrollRecordResponse {
  status: boolean;
  message: string;
  data: PayrollRecordData | null;
  meta?: PaginationMeta;
  errors?: any;
}

export interface PayrollRecordsListResponse {
  status: boolean;
  message: string;
  data: PayrollRecordData[];
  meta?: PaginationMeta;
}

export interface DeductionResponse {
  status: boolean;
  message: string;
  data: DeductionData | null;
}

export interface DeductionsListResponse {
  status: boolean;
  message: string;
  data: {
    deductions: DeductionData[];
    totals: {
      tax: number;
      sss: number;
      philhealth: number;
      pagibig: number;
      loan: number;
      advance: number;
      other: number;
      total: number;
    };
    summary: {
      recurring: number;
      oneTime: number;
    };
  };
}

export interface CalculationResult {
  status: boolean;
  message: string;
  data: {
    grossPay?: number;
    deductions?: {
      total: number;
      breakdown: Record<string, number>;
    };
    netPay?: number;
    overtimePay?: number;
    governmentContributions?: {
      sss: number;
      philhealth: number;
      pagibig: number;
      total: number;
    };
    [key: string]: any;
  };
}

export interface ValidationResult {
  status: boolean;
  message: string;
  errors: string[];
  data: PayrollRecordData | null;
}

export interface DuplicateCheckResult {
  status: boolean;
  message: string;
  isDuplicate: boolean;
  existingRecord: PayrollRecordData | null;
}

export interface StatusOption {
  value: string;
  label: string;
  description: string;
  color: string;
  icon: string;
}

export interface StatusesResponse {
  status: boolean;
  message: string;
  data: StatusOption[];
}

export interface ReportData {
  status: boolean;
  message: string;
  data: {
    report: any;
    format?: string;
    url?: string;
    filename?: string;
  };
}

export interface PayslipData {
  status: boolean;
  message: string;
  data: {
    payslip: any;
    format: "pdf" | "html" | "json";
    url?: string;
    filename?: string;
  };
}

export interface PayrollRecordFilters {
  periodId?: number;
  employeeId?: number;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PayrollRecordPayload {
  method: string;
  params?: Record<string, any>;
}

// ==================== API CLASS ====================

class PayrollRecordAPI {
  // 🔎 BASIC GET METHODS

  /**
   * Get all payroll records with optional filtering
   */
  async getAll(
    filters: PayrollRecordFilters = {},
  ): Promise<PayrollRecordsListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "getAllPayrollRecords",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get payroll records");
    } catch (error: any) {
      console.error("Failed to get payroll records:", error);
      return {
        status: false,
        message: error.message || "Failed to get payroll records",
        data: [],
      };
    }
  }

  /**
   * Get payroll record by ID
   */
  async getById(id: number): Promise<PayrollRecordResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "getPayrollRecordById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get payroll record");
    } catch (error: any) {
      console.error("Failed to get payroll record by ID:", error);
      return {
        status: false,
        message: error.message || "Failed to get payroll record",
        data: null,
      };
    }
  }

  /**
   * Get payroll records by employee
   */
  async getByEmployee(
    employeeId: number,
    dateRange?: { startDate?: string; endDate?: string },
  ): Promise<PayrollRecordsListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "getPayrollRecordsByEmployee",
        params: { employeeId, dateRange },
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to get employee payroll records",
      );
    } catch (error: any) {
      console.error("Failed to get employee payroll records:", error);
      return {
        status: false,
        message: error.message || "Failed to get employee payroll records",
        data: [],
      };
    }
  }

  /**
   * Get payroll records by period
   */
  async getByPeriod(
    periodId: number,
    filters: PayrollRecordFilters = {},
  ): Promise<PayrollRecordsListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "getPayrollRecordsByPeriod",
        params: { periodId, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to get period payroll records",
      );
    } catch (error: any) {
      console.error("Failed to get period payroll records:", error);
      return {
        status: false,
        message: error.message || "Failed to get period payroll records",
        data: [],
      };
    }
  }

  /**
   * Get payroll records by payment status
   */
  async getByStatus(
    status: string,
    filters: PayrollRecordFilters = {},
  ): Promise<PayrollRecordsListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "getPayrollRecordsByStatus",
        params: { status, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to get payroll records by status",
      );
    } catch (error: any) {
      console.error("Failed to get payroll records by status:", error);
      return {
        status: false,
        message: error.message || "Failed to get payroll records by status",
        data: [],
      };
    }
  }

  /**
   * Get unpaid payroll records
   */
  async getUnpaid(
    periodId?: number,
    filters: PayrollRecordFilters = {},
  ): Promise<PayrollRecordsListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "getUnpaidPayrollRecords",
        params: { periodId, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to get unpaid payroll records",
      );
    } catch (error: any) {
      console.error("Failed to get unpaid payroll records:", error);
      return {
        status: false,
        message: error.message || "Failed to get unpaid payroll records",
        data: [],
      };
    }
  }

  /**
   * Get paid payroll records
   */
  async getPaid(
    periodId?: number,
    filters: PayrollRecordFilters = {},
  ): Promise<PayrollRecordsListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "getPaidPayrollRecords",
        params: { periodId, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get paid payroll records");
    } catch (error: any) {
      console.error("Failed to get paid payroll records:", error);
      return {
        status: false,
        message: error.message || "Failed to get paid payroll records",
        data: [],
      };
    }
  }

  /**
   * Get employee payroll history
   */
  async getEmployeeHistory(
    employeeId: number,
    limit: number = 10,
  ): Promise<PayrollRecordsListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "getEmployeePayrollHistory",
        params: { employeeId, limit },
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to get employee payroll history",
      );
    } catch (error: any) {
      console.error("Failed to get employee payroll history:", error);
      return {
        status: false,
        message: error.message || "Failed to get employee payroll history",
        data: [],
      };
    }
  }

  // ✏️ WRITE OPERATIONS

  /**
   * Create a new payroll record
   */
  async create(data: PayrollRecordData): Promise<PayrollRecordResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "createPayrollRecord",
        params: data,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create payroll record");
    } catch (error: any) {
      console.error("Failed to create payroll record:", error);
      return {
        status: false,
        message: error.message || "Failed to create payroll record",
        data: null,
      };
    }
  }

  /**
   * Update a payroll record
   */
  async update(
    id: number,
    data: Partial<PayrollRecordData>,
  ): Promise<PayrollRecordResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "updatePayrollRecord",
        params: { id, ...data },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update payroll record");
    } catch (error: any) {
      console.error("Failed to update payroll record:", error);
      return {
        status: false,
        message: error.message || "Failed to update payroll record",
        data: null,
      };
    }
  }

  /**
   * Delete a payroll record
   */
  async delete(id: number): Promise<PayrollRecordResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "deletePayrollRecord",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete payroll record");
    } catch (error: any) {
      console.error("Failed to delete payroll record:", error);
      return {
        status: false,
        message: error.message || "Failed to delete payroll record",
        data: null,
      };
    }
  }

  /**
   * Compute payroll for a record
   */
  async compute(
    payrollRecordId: number,
    recalculateAll: boolean = false,
  ): Promise<PayrollRecordResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "computePayrollRecord",
        params: { payrollRecordId, recalculateAll },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to compute payroll");
    } catch (error: any) {
      console.error("Failed to compute payroll:", error);
      return {
        status: false,
        message: error.message || "Failed to compute payroll",
        data: null,
      };
    }
  }

  /**
   * Mark payroll record as paid
   */
  async markAsPaid(
    payrollRecordId: number,
    paymentMethod: string = "bank",
    paymentReference: string = "",
    remarks: string = "",
    userId?: number,
  ): Promise<PayrollRecordResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "markAsPaid",
        params: {
          payrollRecordId,
          paymentMethod,
          paymentReference,
          remarks,
          userId,
        },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to mark as paid");
    } catch (error: any) {
      console.error("Failed to mark as paid:", error);
      return {
        status: false,
        message: error.message || "Failed to mark as paid",
        data: null,
      };
    }
  }

  /**
   * Mark payroll record as unpaid
   */
  async markAsUnpaid(
    payrollRecordId: number,
    userId?: number,
  ): Promise<PayrollRecordResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "markAsUnpaid",
        params: { payrollRecordId, userId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to mark as unpaid");
    } catch (error: any) {
      console.error("Failed to mark as unpaid:", error);
      return {
        status: false,
        message: error.message || "Failed to mark as unpaid",
        data: null,
      };
    }
  }

  /**
   * Adjust payroll record amounts
   */
  async adjust(
    payrollRecordId: number,
    adjustments: Record<string, number>,
    reason: string = "",
    userId?: number,
  ): Promise<PayrollRecordResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "adjustPayrollRecord",
        params: { payrollRecordId, adjustments, reason, userId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to adjust payroll record");
    } catch (error: any) {
      console.error("Failed to adjust payroll record:", error);
      return {
        status: false,
        message: error.message || "Failed to adjust payroll record",
        data: null,
      };
    }
  }

  // 📊 REPORTS

  /**
   * Get payroll record report
   */
  async getReport(
    periodId: number,
    reportType: string = "summary",
  ): Promise<ReportData> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "getPayrollRecordReport",
        params: { periodId, reportType },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get payroll report");
    } catch (error: any) {
      console.error("Failed to get payroll report:", error);
      return {
        status: false,
        message: error.message || "Failed to get payroll report",
        data: { report: null },
      };
    }
  }

  /**
   * Get payslip report
   */
  async getPayslip(
    payrollRecordId: number,
    format: "pdf" | "html" | "json" = "pdf",
  ): Promise<PayslipData> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "getPayslipReport",
        params: { payrollRecordId, format },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get payslip");
    } catch (error: any) {
      console.error("Failed to get payslip:", error);
      return {
        status: false,
        message: error.message || "Failed to get payslip",
        data: { payslip: null, format },
      };
    }
  }

  // 💰 CALCULATIONS

  /**
   * Calculate gross pay
   */
  async calculateGrossPay(
    employeeId: number,
    periodId: number,
  ): Promise<CalculationResult> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "calculateGrossPay",
        params: { employeeId, periodId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to calculate gross pay");
    } catch (error: any) {
      console.error("Failed to calculate gross pay:", error);
      return {
        status: false,
        message: error.message || "Failed to calculate gross pay",
        data: {},
      };
    }
  }

  /**
   * Calculate deductions
   */
  async calculateDeductions(
    employeeId: number,
    periodId: number,
    grossPay: number,
  ): Promise<CalculationResult> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "calculateDeductions",
        params: { employeeId, periodId, grossPay },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to calculate deductions");
    } catch (error: any) {
      console.error("Failed to calculate deductions:", error);
      return {
        status: false,
        message: error.message || "Failed to calculate deductions",
        data: {},
      };
    }
  }

  /**
   * Calculate net pay
   */
  async calculateNetPay(
    grossPay: number,
    deductions: Record<string, number>,
  ): Promise<CalculationResult> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "calculateNetPay",
        params: { grossPay, deductions },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to calculate net pay");
    } catch (error: any) {
      console.error("Failed to calculate net pay:", error);
      return {
        status: false,
        message: error.message || "Failed to calculate net pay",
        data: {},
      };
    }
  }

  /**
   * Calculate overtime pay
   */
  async calculateOvertimePay(
    employeeId: number,
    periodId: number,
    overtimeHours?: number,
  ): Promise<CalculationResult> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "calculateOvertimePay",
        params: { employeeId, periodId, overtimeHours },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to calculate overtime pay");
    } catch (error: any) {
      console.error("Failed to calculate overtime pay:", error);
      return {
        status: false,
        message: error.message || "Failed to calculate overtime pay",
        data: {},
      };
    }
  }

  /**
   * Calculate government contributions
   */
  async calculateGovernmentContributions(
    employeeId: number,
    grossPay: number,
    periodId?: number,
  ): Promise<CalculationResult> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "calculateGovernmentContributions",
        params: { employeeId, grossPay, periodId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to calculate government contributions",
      );
    } catch (error: any) {
      console.error("Failed to calculate government contributions:", error);
      return {
        status: false,
        message:
          error.message || "Failed to calculate government contributions",
        data: {},
      };
    }
  }

  // 📋 DEDUCTION OPERATIONS

  /**
   * Add deduction to payroll record
   */
  async addDeduction(data: DeductionData): Promise<DeductionResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "addDeduction",
        params: data,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to add deduction");
    } catch (error: any) {
      console.error("Failed to add deduction:", error);
      return {
        status: false,
        message: error.message || "Failed to add deduction",
        data: null,
      };
    }
  }

  /**
   * Update deduction
   */
  async updateDeduction(
    id: number,
    data: Partial<DeductionData>,
  ): Promise<DeductionResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "updateDeduction",
        params: { id, ...data },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update deduction");
    } catch (error: any) {
      console.error("Failed to update deduction:", error);
      return {
        status: false,
        message: error.message || "Failed to update deduction",
        data: null,
      };
    }
  }

  /**
   * Remove deduction
   */
  async removeDeduction(id: number): Promise<DeductionResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "removeDeduction",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to remove deduction");
    } catch (error: any) {
      console.error("Failed to remove deduction:", error);
      return {
        status: false,
        message: error.message || "Failed to remove deduction",
        data: null,
      };
    }
  }

  /**
   * Get deductions for payroll record
   */
  async getDeductions(
    payrollRecordId: number,
  ): Promise<DeductionsListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "getPayrollDeductions",
        params: { payrollRecordId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get deductions");
    } catch (error: any) {
      console.error("Failed to get deductions:", error);
      return {
        status: false,
        message: error.message || "Failed to get deductions",
        data: {
          deductions: [],
          totals: {
            tax: 0,
            sss: 0,
            philhealth: 0,
            pagibig: 0,
            loan: 0,
            advance: 0,
            other: 0,
            total: 0,
          },
          summary: {
            recurring: 0,
            oneTime: 0,
          },
        },
      };
    }
  }

  // ⚙️ VALIDATION & UTILITIES

  /**
   * Validate payroll record data
   */
  async validate(data: PayrollRecordData): Promise<ValidationResult> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "validatePayrollRecordData",
        params: data,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to validate data");
    } catch (error: any) {
      console.error("Failed to validate data:", error);
      return {
        status: false,
        message: error.message || "Failed to validate data",
        errors: [error.message],
        data: null,
      };
    }
  }

  /**
   * Check for duplicate payroll record
   */
  async checkDuplicate(
    employeeId: number,
    periodId: number,
    excludeId?: number,
  ): Promise<DuplicateCheckResult> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "checkDuplicatePayrollRecord",
        params: { employeeId, periodId, excludeId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to check for duplicate");
    } catch (error: any) {
      console.error("Failed to check for duplicate:", error);
      return {
        status: false,
        message: error.message || "Failed to check for duplicate",
        isDuplicate: false,
        existingRecord: null,
      };
    }
  }

  /**
   * Get all available payment statuses
   */
  async getStatuses(): Promise<StatusesResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollRecord) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollRecord({
        method: "getPayrollRecordStatuses",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get statuses");
    } catch (error: any) {
      console.error("Failed to get statuses:", error);
      return {
        status: false,
        message: error.message || "Failed to get statuses",
        data: [],
      };
    }
  }

  // 🔧 UTILITY METHODS

  /**
   * Get payroll record with all relations
   */
  async getRecordWithRelations(id: number): Promise<PayrollRecordData | null> {
    try {
      const response = await this.getById(id);
      return response.data;
    } catch (error) {
      console.error("Failed to get record with relations:", error);
      return null;
    }
  }

  /**
   * Check if payroll record is paid
   */
  async isPaid(id: number): Promise<boolean> {
    try {
      const response = await this.getById(id);
      return response.data?.paymentStatus === "paid";
    } catch (error) {
      console.error("Failed to check if paid:", error);
      return false;
    }
  }

  /**
   * Get total net pay for period
   */
  async getPeriodTotal(periodId: number): Promise<number> {
    try {
      const response = await this.getByPeriod(periodId);
      return response.data.reduce(
        (total, record) => total + (record.netPay || 0),
        0,
      );
    } catch (error) {
      console.error("Failed to get period total:", error);
      return 0;
    }
  }

  /**
   * Get employee's latest payroll record
   */
  async getLatestForEmployee(
    employeeId: number,
  ): Promise<PayrollRecordData | null> {
    try {
      const response = await this.getEmployeeHistory(employeeId, 1);
      return response.data.length > 0 ? response.data[0] : null;
    } catch (error) {
      console.error("Failed to get latest for employee:", error);
      return null;
    }
  }

  /**
   * Get summary statistics
   */
  async getSummary(filters: PayrollRecordFilters = {}): Promise<{
    totalRecords: number;
    totalNetPay: number;
    paidCount: number;
    unpaidCount: number;
  }> {
    try {
      const response = await this.getAll(filters);
      const data = response.data;

      return {
        totalRecords: data.length,
        totalNetPay: data.reduce(
          (sum, record) => sum + (record.netPay || 0),
          0,
        ),
        paidCount: data.filter((record) => record.paymentStatus === "paid")
          .length,
        unpaidCount: data.filter((record) => record.paymentStatus === "unpaid")
          .length,
      };
    } catch (error) {
      console.error("Failed to get summary:", error);
      return {
        totalRecords: 0,
        totalNetPay: 0,
        paidCount: 0,
        unpaidCount: 0,
      };
    }
  }

  /**
   * Create and compute payroll in one operation
   */
  async createAndCompute(
    data: PayrollRecordData,
  ): Promise<PayrollRecordResponse> {
    try {
      // Validate first
      const validation = await this.validate(data);
      if (!validation.status) {
        return {
          status: false,
          message: validation.message,
          data: null,
          errors: validation.errors,
        };
      }

      // Check for duplicate
      const duplicate = await this.checkDuplicate(
        data.employeeId,
        data.periodId,
      );
      if (duplicate.isDuplicate) {
        return {
          status: false,
          message: "Duplicate payroll record exists",
          data: duplicate.existingRecord,
        };
      }

      // Create record
      const createResponse = await this.create(data);
      if (!createResponse.status || !createResponse.data?.id) {
        return createResponse;
      }

      // Compute payroll
      const computeResponse = await this.compute(createResponse.data.id);

      if (computeResponse.status) {
        return {
          ...computeResponse,
          message: "Payroll record created and computed successfully",
        };
      } else {
        // Return partial success with creation data
        return {
          status: true,
          message: "Record created but computation failed",
          data: createResponse.data,
        };
      }
    } catch (error: any) {
      console.error("Failed to create and compute:", error);
      return {
        status: false,
        message: error.message || "Failed to create and compute payroll",
        data: null,
      };
    }
  }

  /**
   * Process payroll for multiple employees in a period
   */
  async processBatch(
    periodId: number,
    employeeIds: number[],
  ): Promise<{
    success: number;
    failed: number;
    results: Array<{
      employeeId: number;
      success: boolean;
      recordId?: number;
      message: string;
    }>;
  }> {
    const results = [];

    for (const employeeId of employeeIds) {
      try {
        // Check if already exists
        const duplicate = await this.checkDuplicate(employeeId, periodId);
        if (duplicate.isDuplicate) {
          results.push({
            employeeId,
            success: false,
            message: "Already processed",
          });
          continue;
        }

        // Create record
        const createResponse = await this.create({
          employeeId,
          periodId,
        });

        if (createResponse.status && createResponse.data?.id) {
          // Compute payroll
          await this.compute(createResponse.data.id);
          results.push({
            employeeId,
            success: true,
            recordId: createResponse.data.id,
            message: "Processed successfully",
          });
        } else {
          results.push({
            employeeId,
            success: false,
            message: createResponse.message || "Failed to create record",
          });
        }
      } catch (error: any) {
        results.push({
          employeeId,
          success: false,
          message: error.message || "Processing error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return {
      success: successCount,
      failed: failedCount,
      results,
    };
  }
}

// Export singleton instance
const payrollRecordAPI = new PayrollRecordAPI();

export default payrollRecordAPI;

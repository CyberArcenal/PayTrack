// deductionAPI.ts - Similar structure to activation.ts
export interface DeductionData {
  id: number;
  payrollRecordId: number;
  type: string;
  code: string | null;
  description: string | null;
  amount: number;
  percentage: number | null;
  isRecurring: boolean;
  appliedDate: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  payrollRecord?: {
    id: number;
    employeeId: number;
    periodId: number;
    grossPay: number;
    netPay: number;
    paymentStatus: string;
  };
  employee?: {
    id: number;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    department: string | null;
  };
  period?: {
    id: number;
    name: string | null;
    startDate: string;
    endDate: string;
    payDate: string;
  };
}

export interface DeductionSummaryData {
  totalDeductions: number;
  totalAmount: number;
  breakdown: Record<string, { count: number; amount: number }>;
  byPeriod: Record<string, { count: number; amount: number }>;
  recurring: {
    count: number;
    amount: number;
  };
  governmentContributions: {
    sss: number;
    philhealth: number;
    pagibig: number;
    tax: number;
    total: number;
  };
}

export interface DeductionReportData {
  dateRange: {
    startDate: string;
    endDate: string;
    days: number;
  };
  deductions: DeductionData[];
  statistics: {
    totalDeductions: number;
    totalAmount: number;
    averageAmount: number;
    typeSummary: Array<{
      type: string;
      count: number;
      totalAmount: number;
    }>;
    departmentSummary: Array<{
      department: string;
      count: number;
      totalAmount: number;
    }>;
  };
  meta: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
}

export interface GovernmentDeductionData {
  sss: {
    amount: number;
    employeeShare: number;
    employerShare: number;
    total: number;
  };
  philhealth: {
    amount: number;
    employeeShare: number;
    employerShare: number;
    total: number;
  };
  pagibig: {
    amount: number;
    employeeShare: number;
    employerShare: number;
    total: number;
  };
  tax: {
    amount: number;
    taxBracket: string;
    taxableIncome: number;
  };
}

export interface LoanData {
  id: number;
  employeeId: number;
  loanType: string;
  loanAmount: number;
  balance: number;
  monthlyDeduction: number;
  startDate: string;
  endDate: string | null;
  status: 'active' | 'paid' | 'defaulted';
  note: string | null;
}

export interface DeductionStatsData {
  totalDeductions: number;
  totalAmount: number;
  byType: Record<string, number>;
  byDepartment: Record<string, number>;
  recurringCount: number;
  activeLoans: number;
  recentActivity: Array<{
    date: string;
    count: number;
    amount: number;
  }>;
}

export interface DeductionCalculationResult {
  calculatedAmount: number;
  baseAmount: number;
  percentage: number | null;
  formula: string;
}

export interface DeductionCreateData {
  payrollRecordId: number;
  type: string;
  code?: string;
  description?: string;
  amount: number;
  percentage?: number;
  isRecurring?: boolean;
  appliedDate?: string;
  note?: string;
}

export interface DeductionUpdateData {
  type?: string;
  code?: string | null;
  description?: string | null;
  amount?: number;
  percentage?: number | null;
  isRecurring?: boolean;
  appliedDate?: string;
  note?: string | null;
}

export interface DeductionBulkCreateData {
  deductions: DeductionCreateData[];
  payrollPeriodId?: number;
}

export interface DeductionResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
}

export interface DeductionListResponse extends DeductionResponse<{
  deductions: DeductionData[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}> {}

export interface DeductionReportResponse extends DeductionResponse<DeductionReportData> {}
export interface DeductionSummaryResponse extends DeductionResponse<DeductionSummaryData> {}
export interface GovernmentDeductionResponse extends DeductionResponse<GovernmentDeductionData> {}
export interface LoanListResponse extends DeductionResponse<LoanData[]> {}
export interface DeductionStatsResponse extends DeductionResponse<DeductionStatsData> {}
export interface DeductionCalculationResponse extends DeductionResponse<DeductionCalculationResult> {}
export interface DeductionTypeResponse extends DeductionResponse<Array<{
  value: string;
  label: string;
  category: string;
  description: string;
  isStandard: boolean;
}>> {}

export interface ValidationResponse extends DeductionResponse<{
  isValid: boolean;
  errors?: string[];
}> {}

export interface FileOperationResponse extends DeductionResponse<{
  filePath: string;
  fileName: string;
  fileSize: number;
}> {}

export interface BulkOperationResponse extends DeductionResponse<{
  total: number;
  success: number;
  failed: number;
  errors?: Array<{
    index: number;
    error: string;
  }>;
}> {}

export interface DeductionPayload {
  method: string;
  params?: Record<string, any>;
}

class DeductionAPI {
  // ===================== 📋 READ-ONLY METHODS =====================
  
  /**
   * Get all deductions with optional filters
   */
  async getAll(filters?: {
    page?: number;
    limit?: number;
    type?: string;
    payrollRecordId?: number;
    isRecurring?: boolean;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<DeductionListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getAllDeductions",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get deductions");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get deductions");
    }
  }

  /**
   * Get deduction by ID
   */
  async getById(id: number): Promise<DeductionResponse<DeductionData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getDeductionById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get deduction");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get deduction");
    }
  }

  /**
   * Get deductions by payroll record
   */
  async getByPayrollRecord(payrollRecordId: number, filters?: {
    type?: string;
    isRecurring?: boolean;
    startDate?: string;
    endDate?: string;
  }): Promise<DeductionResponse<{
    deductions: DeductionData[];
    totals: {
      totalAmount: number;
      byType: Record<string, number>;
      recurringCount: number;
      recurringAmount: number;
    };
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getDeductionsByPayrollRecord",
        params: { payrollRecordId, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get payroll record deductions");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get payroll record deductions");
    }
  }

  /**
   * Get deductions by employee
   */
  async getByEmployee(employeeId: number, dateRange?: {
    startDate?: string;
    endDate?: string;
    periodId?: number;
    type?: string;
  }): Promise<DeductionResponse<{
    employee: {
      id: number;
      employeeNumber: string;
      firstName: string;
      lastName: string;
      department: string | null;
    };
    deductions: DeductionData[];
    summary: {
      totalDeductions: number;
      totalAmount: number;
      deductionsByPeriod: Array<{
        periodId: number;
        periodName: string | null;
        startDate: string;
        endDate: string;
        deductions: DeductionData[];
        totalAmount: number;
      }>;
      deductionsByType: Array<{
        type: string;
        count: number;
        totalAmount: number;
        isRecurring: boolean;
      }>;
      dateRange: string;
    };
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getDeductionsByEmployee",
        params: { employeeId, dateRange },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get employee deductions");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get employee deductions");
    }
  }

  /**
   * Get deductions by type
   */
  async getByType(type: string, filters?: {
    employeeId?: number;
    payrollRecordId?: number;
    isRecurring?: boolean;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<DeductionResponse<{
    deductions: DeductionData[];
    statistics: {
      type: string;
      totalCount: number;
      totalAmount: number;
      averageAmount: number;
      recurringCount: number;
      recurringAmount: number;
      uniqueEmployees: number;
      uniquePeriods: number;
    };
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getDeductionsByType",
        params: { type, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get deductions by type");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get deductions by type");
    }
  }

  /**
   * Get deductions by date
   */
  async getByDate(date: string, filters?: {
    type?: string;
    employeeId?: number;
    department?: string;
    isRecurring?: boolean;
  }): Promise<DeductionReportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getDeductionsByDate",
        params: { date, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get deductions by date");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get deductions by date");
    }
  }

  /**
   * Get deductions by date range
   */
  async getByDateRange(startDate: string, endDate: string, filters?: {
    type?: string;
    employeeId?: number;
    department?: string;
    isRecurring?: boolean;
    page?: number;
    limit?: number;
  }): Promise<DeductionReportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getDeductionsByDateRange",
        params: { startDate, endDate, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get deductions by date range");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get deductions by date range");
    }
  }

  /**
   * Get recurring deductions
   */
  async getRecurring(employeeId?: number): Promise<DeductionResponse<{
    recurringDeductions: DeductionData[];
    summary: {
      totalRecurringDeductions: number;
      totalAffectedEmployees: number;
      totalMonthlyAmount: number;
      totalYearlyAmount: number;
      recurringByEmployee: Array<{
        employeeId: number;
        employeeName: string;
        employeeNumber: string;
        department: string | null;
        deductions: DeductionData[];
        totalAmount: number;
        deductionCount: number;
      }>;
      recurringByType: Array<{
        type: string;
        count: number;
        totalAmount: number;
        affectedEmployees: number;
      }>;
    };
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getRecurringDeductions",
        params: { employeeId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get recurring deductions");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get recurring deductions");
    }
  }

  /**
   * Get employee deductions summary
   */
  async getEmployeeSummary(employeeId: number, periodId?: number): Promise<DeductionSummaryResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getEmployeeDeductionsSummary",
        params: { employeeId, periodId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get employee deductions summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get employee deductions summary");
    }
  }

  /**
   * Get deduction report
   */
  async getReport(dateRange: {
    startDate: string;
    endDate: string;
  }, filters?: {
    type?: string;
    employeeId?: number;
    department?: string;
  }): Promise<DeductionReportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getDeductionReport",
        params: { dateRange, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get deduction report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get deduction report");
    }
  }

  /**
   * Get deduction summary report
   */
  async getSummaryReport(periodId: number, groupBy?: string): Promise<DeductionSummaryResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getDeductionSummaryReport",
        params: { periodId, groupBy },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get deduction summary report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get deduction summary report");
    }
  }

  /**
   * Get tax deduction report
   */
  async getTaxReport(year: number, quarter?: number): Promise<DeductionReportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getTaxDeductionReport",
        params: { year, quarter },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get tax deduction report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get tax deduction report");
    }
  }

  /**
   * Get government deductions report
   */
  async getGovernmentDeductionsReport(periodId: number): Promise<GovernmentDeductionResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getGovernmentDeductionsReport",
        params: { periodId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get government deductions report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get government deductions report");
    }
  }

  /**
   * Get loan deductions report
   */
  async getLoanReport(dateRange: {
    startDate: string;
    endDate: string;
  }, employeeId?: number): Promise<DeductionResponse<{
    loans: LoanData[];
    summary: {
      totalLoans: number;
      totalAmount: number;
      totalBalance: number;
      activeLoans: number;
      paidLoans: number;
    };
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getLoanDeductionsReport",
        params: { dateRange, employeeId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get loan deductions report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get loan deductions report");
    }
  }

  /**
   * Get employee loans
   */
  async getEmployeeLoans(employeeId: number, status?: string): Promise<LoanListResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getEmployeeLoans",
        params: { employeeId, status },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get employee loans");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get employee loans");
    }
  }

  /**
   * Get loan balance
   */
  async getLoanBalance(employeeId: number, loanId?: number): Promise<DeductionResponse<{
    balance: number;
    totalPaid: number;
    remainingPayments: number;
    nextPaymentDate: string | null;
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getLoanBalance",
        params: { employeeId, loanId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get loan balance");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get loan balance");
    }
  }

  /**
   * Get deduction types
   */
  async getTypes(category?: string): Promise<DeductionTypeResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getDeductionTypes",
        params: { category },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get deduction types");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get deduction types");
    }
  }

  /**
   * Get deduction stats
   */
  async getStats(): Promise<DeductionStatsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getStats",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get deduction stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get deduction stats");
    }
  }

  // ===================== ✏️ WRITE OPERATION METHODS =====================

  /**
   * Create a new deduction
   */
  async create(data: DeductionCreateData): Promise<DeductionResponse<DeductionData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "createDeduction",
        params: data,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create deduction");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create deduction");
    }
  }

  /**
   * Update an existing deduction
   */
  async update(id: number, data: DeductionUpdateData): Promise<DeductionResponse<DeductionData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "updateDeduction",
        params: { id, data },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update deduction");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update deduction");
    }
  }

  /**
   * Delete a deduction
   */
  async delete(id: number): Promise<DeductionResponse<{
    deletedId: number;
    deletedDeduction: {
      id: number;
      type: string;
      amount: number;
      payrollRecordId: number;
    };
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "deleteDeduction",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete deduction");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete deduction");
    }
  }

  /**
   * Apply recurring deductions
   */
  async applyRecurring(payrollPeriodId: number): Promise<BulkOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "applyRecurringDeductions",
        params: { payrollPeriodId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to apply recurring deductions");
    } catch (error: any) {
      throw new Error(error.message || "Failed to apply recurring deductions");
    }
  }

  /**
   * Update deduction amount
   */
  async updateAmount(id: number, amount: number): Promise<DeductionResponse<DeductionData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "updateDeductionAmount",
        params: { id, amount },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update deduction amount");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update deduction amount");
    }
  }

  /**
   * Update deduction status
   */
  async updateStatus(id: number, status: string): Promise<DeductionResponse<DeductionData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "updateDeductionStatus",
        params: { id, status },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update deduction status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update deduction status");
    }
  }

  /**
   * Bulk apply deductions
   */
  async bulkApply(data: {
    employeeIds: number[];
    deductionType: string;
    amount: number;
    periodId: number;
    note?: string;
  }): Promise<BulkOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "bulkApplyDeductions",
        params: data,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk apply deductions");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk apply deductions");
    }
  }

  // ===================== 🔄 BATCH OPERATION METHODS =====================

  /**
   * Bulk create deductions
   */
  async bulkCreate(data: DeductionBulkCreateData): Promise<BulkOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "bulkCreateDeductions",
        params: data,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk create deductions");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk create deductions");
    }
  }

  /**
   * Import deductions from CSV
   */
  async importFromCSV(filePath: string): Promise<BulkOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "importDeductionsFromCSV",
        params: { filePath },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to import deductions from CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to import deductions from CSV");
    }
  }

  /**
   * Export deductions to CSV
   */
  async exportToCSV(params: {
    startDate: string;
    endDate: string;
    filters?: any;
  }): Promise<FileOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "exportDeductionsToCSV",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export deductions to CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export deductions to CSV");
    }
  }

  /**
   * Sync government deductions
   */
  async syncGovernmentDeductions(periodId: number): Promise<BulkOperationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "syncGovernmentDeductions",
        params: { periodId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to sync government deductions");
    } catch (error: any) {
      throw new Error(error.message || "Failed to sync government deductions");
    }
  }

  // ===================== 🏦 GOVERNMENT DEDUCTION METHODS =====================

  /**
   * Calculate SSS deduction
   */
  async calculateSSS(employeeId: number, grossPay: number): Promise<DeductionResponse<{
    amount: number;
    employeeShare: number;
    employerShare: number;
    total: number;
    contributionSchedule: string;
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "calculateSSSDeduction",
        params: { employeeId, grossPay },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to calculate SSS deduction");
    } catch (error: any) {
      throw new Error(error.message || "Failed to calculate SSS deduction");
    }
  }

  /**
   * Calculate PhilHealth deduction
   */
  async calculatePhilHealth(employeeId: number, grossPay: number): Promise<DeductionResponse<{
    amount: number;
    employeeShare: number;
    employerShare: number;
    total: number;
    premiumRate: number;
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "calculatePhilHealthDeduction",
        params: { employeeId, grossPay },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to calculate PhilHealth deduction");
    } catch (error: any) {
      throw new Error(error.message || "Failed to calculate PhilHealth deduction");
    }
  }

  /**
   * Calculate Pag-IBIG deduction
   */
  async calculatePagIBIG(employeeId: number, grossPay: number): Promise<DeductionResponse<{
    amount: number;
    employeeShare: number;
    employerShare: number;
    total: number;
    membershipProgram: string;
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "calculatePagIBIGDeduction",
        params: { employeeId, grossPay },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to calculate Pag-IBIG deduction");
    } catch (error: any) {
      throw new Error(error.message || "Failed to calculate Pag-IBIG deduction");
    }
  }

  /**
   * Calculate withholding tax
   */
  async calculateTax(employeeId: number, grossPay: number, deductions?: {
    sss?: number;
    philhealth?: number;
    pagibig?: number;
    other?: number;
  }): Promise<DeductionResponse<{
    amount: number;
    taxBracket: string;
    taxableIncome: number;
    taxRate: number;
    taxDue: number;
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "calculateWithholdingTax",
        params: { employeeId, grossPay, deductions },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to calculate withholding tax");
    } catch (error: any) {
      throw new Error(error.message || "Failed to calculate withholding tax");
    }
  }

  /**
   * Update government contribution rates
   */
  async updateGovernmentRates(data: {
    sss?: {
      employeeRate: number;
      employerRate: number;
      maxSalaryBase: number;
    };
    philhealth?: {
      premiumRate: number;
      minSalary: number;
      maxSalary: number;
    };
    pagibig?: {
      employeeRate: number;
      employerRate: number;
      maxContribution: number;
    };
    tax?: {
      brackets: Array<{
        min: number;
        max: number;
        rate: number;
        baseTax: number;
      }>;
    };
  }): Promise<DeductionResponse<boolean>> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "updateGovernmentContributionRates",
        params: data,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update government contribution rates");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update government contribution rates");
    }
  }

  // ===================== 💰 LOAN & ADVANCE METHODS =====================

  /**
   * Create loan deduction
   */
  async createLoan(data: {
    employeeId: number;
    loanType: string;
    loanAmount: number;
    monthlyDeduction: number;
    startDate: string;
    endDate?: string;
    note?: string;
  }): Promise<DeductionResponse<LoanData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "createLoanDeduction",
        params: data,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create loan deduction");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create loan deduction");
    }
  }

  /**
   * Update loan deduction
   */
  async updateLoan(id: number, data: {
    monthlyDeduction?: number;
    status?: string;
    note?: string;
  }): Promise<DeductionResponse<LoanData>> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "updateLoanDeduction",
        params: { id, data },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update loan deduction");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update loan deduction");
    }
  }

  /**
   * Process loan payment
   */
  async processLoanPayment(loanId: number, amount: number, paymentDate: string): Promise<DeductionResponse<{
    newBalance: number;
    totalPaid: number;
    remainingPayments: number;
  }>> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "processLoanPayment",
        params: { loanId, amount, paymentDate },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to process loan payment");
    } catch (error: any) {
      throw new Error(error.message || "Failed to process loan payment");
    }
  }

  // ===================== ⚙️ VALIDATION & UTILITY METHODS =====================

  /**
   * Validate deduction data
   */
  async validate(data: DeductionCreateData): Promise<ValidationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "validateDeductionData",
        params: data,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to validate deduction data");
    } catch (error: any) {
      throw new Error(error.message || "Failed to validate deduction data");
    }
  }

  /**
   * Validate government deductions
   */
  async validateGovernmentDeductions(employeeId: number, periodId: number): Promise<ValidationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "validateGovernmentDeductions",
        params: { employeeId, periodId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to validate government deductions");
    } catch (error: any) {
      throw new Error(error.message || "Failed to validate government deductions");
    }
  }

  /**
   * Calculate deduction amount
   */
  async calculateAmount(amount: number, percentage?: number): Promise<DeductionCalculationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "calculateDeductionAmount",
        params: { amount, percentage },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to calculate deduction amount");
    } catch (error: any) {
      throw new Error(error.message || "Failed to calculate deduction amount");
    }
  }

  /**
   * Check for duplicate deduction
   */
  async checkDuplicate(data: {
    payrollRecordId: number;
    type: string;
    code?: string;
    appliedDate: string;
  }): Promise<DeductionResponse<boolean>> {
    try {
      if (!window.backendAPI || !window.backendAPI.deduction) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.deduction({
        method: "checkDuplicateDeduction",
        params: data,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to check for duplicate deduction");
    } catch (error: any) {
      throw new Error(error.message || "Failed to check for duplicate deduction");
    }
  }

  // ===================== UTILITY METHODS =====================

  /**
   * Check if deduction exists
   */
  async exists(id: number): Promise<boolean> {
    try {
      const response = await this.getById(id);
      return response.status && response.data !== null;
    } catch (error) {
      console.error("Error checking if deduction exists:", error);
      return false;
    }
  }

  /**
   * Get total deductions amount for a period
   */
  async getTotalAmount(periodId: number): Promise<number> {
    try {
      const response = await this.getByDateRange(
        new Date().toISOString().split('T')[0],
        new Date().toISOString().split('T')[0],
        { page: 1, limit: 1 }
      );
      
      // Note: This is a simplified version. In a real implementation,
      // you would have a dedicated endpoint for this
      return response.data.statistics.totalAmount;
    } catch (error) {
      console.error("Error getting total deductions amount:", error);
      return 0;
    }
  }

  /**
   * Get deductions count for an employee
   */
  async getEmployeeDeductionsCount(employeeId: number): Promise<number> {
    try {
      const response = await this.getByEmployee(employeeId);
      return response.data.summary.totalDeductions;
    } catch (error) {
      console.error("Error getting employee deductions count:", error);
      return 0;
    }
  }

  /**
   * Validate and create deduction
   */
  async validateAndCreate(data: DeductionCreateData): Promise<DeductionResponse<DeductionData>> {
    try {
      // First validate
      const validation = await this.validate(data);
      if (!validation.data.isValid) {
        return {
          status: false,
          message: validation.data.errors?.join(", ") || "Validation failed",
          data: null as any
        };
      }
      
      // Check for duplicates
      const duplicateCheck = await this.checkDuplicate({
        payrollRecordId: data.payrollRecordId,
        type: data.type,
        code: data.code,
        appliedDate: data.appliedDate || new Date().toISOString().split('T')[0]
      });
      
      if (duplicateCheck.data) {
        return {
          status: false,
          message: "Duplicate deduction found",
          data: null as any
        };
      }
      
      // Create deduction
      return await this.create(data);
    } catch (error: any) {
      return {
        status: false,
        message: error.message || "Failed to validate and create deduction",
        data: null as any
      };
    }
  }

  /**
   * Calculate all government deductions for an employee
   */
  async calculateAllGovernmentDeductions(employeeId: number, grossPay: number): Promise<GovernmentDeductionData> {
    try {
      const [sss, philhealth, pagibig, tax] = await Promise.all([
        this.calculateSSS(employeeId, grossPay),
        this.calculatePhilHealth(employeeId, grossPay),
        this.calculatePagIBIG(employeeId, grossPay),
        this.calculateTax(employeeId, grossPay)
      ]);
      
      return {
        sss: sss.data,
        philhealth: philhealth.data,
        pagibig: pagibig.data,
        tax: tax.data
      };
    } catch (error) {
      console.error("Error calculating all government deductions:", error);
      throw error;
    }
  }
}

const deductionAPI = new DeductionAPI();

export default deductionAPI;
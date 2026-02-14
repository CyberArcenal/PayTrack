// src/renderer/api/deduction.ts
// Deduction API – similar structure to attendance_log.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces (based on Deduction entity)
// ----------------------------------------------------------------------

export interface DeductionEntry {
  id: number;
  payrollRecordId: number;
  type: string; // 'tax', 'sss', 'philhealth', 'pag-ibig', 'loan', 'advance', 'other'
  code: string | null;
  description: string | null;
  amount: number; // decimal
  percentage: number | null; // decimal
  isRecurring: boolean;
  appliedDate: string; // YYYY-MM-DD
  note: string | null;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
  // Optional relation
  payrollRecord?: {
    id: number;
    periodId: number;
    employeeId: number;
    paymentStatus: string;
  };
}

export interface PaginatedDeductions {
  items: DeductionEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DeductionStats {
  totalDeductions: number;
  totalAmount: number;
  byType: Record<string, { count: number; total: number }>;
  filtered?: {
    payrollRecordId?: number;
    startDate?: string;
    endDate?: string;
  };
}

export interface DeductionCounts {
  byType: Array<{ type: string; count: number; total: number }>;
}

export interface FileOperationResult {
  filePath: string;
}

export interface DeductionReportResult {
  filePath: string;
  format: string;
  entryCount: number;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface DeductionsResponse {
  status: boolean;
  message: string;
  data: DeductionEntry[]; // For getAll, search, byPayroll, byType
}

export interface DeductionResponse {
  status: boolean;
  message: string;
  data: DeductionEntry;
}

export interface DeductionStatsResponse {
  status: boolean;
  message: string;
  data: DeductionStats;
}

export interface DeductionCountsResponse {
  status: boolean;
  message: string;
  data: DeductionCounts;
}

export interface BulkCreateResponse {
  status: boolean;
  message: string;
  data: {
    created: DeductionEntry[];
    errors: Array<{ item: any; error: string }>;
  };
}

export interface BulkUpdateResponse {
  status: boolean;
  message: string;
  data: {
    updated: DeductionEntry[];
    errors: Array<{ item: any; error: string }>;
  };
}

export interface ExportDeductionsResponse {
  status: boolean;
  message: string;
  data: FileOperationResult;
}

export interface GenerateDeductionReportResponse {
  status: boolean;
  message: string;
  data: DeductionReportResult;
}

export interface ValidationResponse {
  status: boolean;
  message: string;
  data: boolean;
}

// ----------------------------------------------------------------------
// 🧠 DeductionAPI Class
// ----------------------------------------------------------------------

class DeductionAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all deductions with optional filters.
   * @param params - Filters: payrollRecordId, type, isRecurring, startDate, endDate, page, limit
   */
  async getAll(params?: {
    payrollRecordId?: number;
    type?: string;
    isRecurring?: boolean;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<DeductionsResponse> {
    try {
      if (!window.backendAPI?.deduction) {
        throw new Error("Electron API (deduction) not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getAllDeductions",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch deductions");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch deductions");
    }
  }

  /**
   * Get a single deduction by ID.
   * @param id - Deduction ID
   */
  async getById(id: number): Promise<DeductionResponse> {
    try {
      if (!window.backendAPI?.deduction) {
        throw new Error("Electron API (deduction) not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getDeductionById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch deduction");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch deduction");
    }
  }

  /**
   * Get deductions for a specific payroll record.
   * @param payrollRecordId - Payroll record ID
   */
  async getByPayroll(payrollRecordId: number): Promise<DeductionsResponse> {
    try {
      if (!window.backendAPI?.deduction) {
        throw new Error("Electron API (deduction) not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getDeductionsByPayroll",
        params: { payrollRecordId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to fetch deductions by payroll",
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch deductions by payroll");
    }
  }

  /**
   * Get deductions by type.
   * @param type - Deduction type (e.g., 'tax', 'sss')
   */
  async getByType(type: string): Promise<DeductionsResponse> {
    try {
      if (!window.backendAPI?.deduction) {
        throw new Error("Electron API (deduction) not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getDeductionsByType",
        params: { type },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch deductions by type");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch deductions by type");
    }
  }

  /**
   * Get deduction statistics.
   * @param params - Filters: payrollRecordId, startDate, endDate
   */
  async getStats(params?: {
    payrollRecordId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<DeductionStatsResponse> {
    try {
      if (!window.backendAPI?.deduction) {
        throw new Error("Electron API (deduction) not available");
      }

      const response = await window.backendAPI.deduction({
        method: "getDeductionStats",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch deduction stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch deduction stats");
    }
  }

  /**
   * Search deductions by keyword (description, code, note).
   * @param params - searchTerm, payrollRecordId
   */
  async search(params: {
    keyword: string;
    payrollRecordId?: number;
  }): Promise<DeductionsResponse> {
    try {
      if (!window.backendAPI?.deduction) {
        throw new Error("Electron API (deduction) not available");
      }

      const response = await window.backendAPI.deduction({
        method: "searchDeductions",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search deductions");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search deductions");
    }
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATION METHODS
  // --------------------------------------------------------------------

  /**
   * Create a new deduction.
   * @param data - Deduction data (payrollRecordId, type, amount, etc.)
   * @param user - Optional username (defaults to 'system')
   */
  async create(
    data: {
      payrollRecordId: number;
      type: string;
      code?: string;
      description?: string;
      amount: number;
      percentage?: number;
      isRecurring?: boolean;
      appliedDate?: string; // YYYY-MM-DD, defaults to current date
      note?: string;
    },
    user: string = "system",
  ): Promise<DeductionResponse> {
    try {
      if (!window.backendAPI?.deduction) {
        throw new Error("Electron API (deduction) not available");
      }

      const response = await window.backendAPI.deduction({
        method: "createDeduction",
        params: { ...data, user },
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
   * Update an existing deduction.
   * @param id - Deduction ID
   * @param updates - Fields to update (partial)
   * @param user - Optional username
   */
  async update(
    id: number,
    updates: Partial<{
      type: string;
      code: string;
      description: string;
      amount: number;
      percentage: number;
      isRecurring: boolean;
      appliedDate: string;
      note: string;
    }>,
    user: string = "system",
  ): Promise<DeductionResponse> {
    try {
      if (!window.backendAPI?.deduction) {
        throw new Error("Electron API (deduction) not available");
      }

      const response = await window.backendAPI.deduction({
        method: "updateDeduction",
        params: { id, updates, user },
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
   * Delete a deduction.
   * @param id - Deduction ID
   * @param user - Optional username
   */
  async delete(
    id: number,
    user: string = "system",
  ): Promise<{ status: boolean; message: string; data: any }> {
    try {
      if (!window.backendAPI?.deduction) {
        throw new Error("Electron API (deduction) not available");
      }

      const response = await window.backendAPI.deduction({
        method: "deleteDeduction",
        params: { id, user },
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
   * Bulk create deductions for a payroll record.
   * @param payrollRecordId - Payroll record ID
   * @param deductions - Array of deduction objects (without payrollRecordId)
   * @param user - Optional username
   */
  async bulkCreate(
    payrollRecordId: number,
    deductions: Array<{
      type: string;
      code?: string;
      description?: string;
      amount: number;
      percentage?: number;
      isRecurring?: boolean;
      appliedDate?: string;
      note?: string;
    }>,
    user: string = "system",
  ): Promise<BulkCreateResponse> {
    try {
      if (!window.backendAPI?.deduction) {
        throw new Error("Electron API (deduction) not available");
      }

      const response = await window.backendAPI.deduction({
        method: "bulkCreateDeductions",
        params: { payrollRecordId, deductions, user },
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
   * Bulk update multiple deductions.
   * @param updatesList - Array of { id, updates }
   * @param user - Optional username
   */
  async bulkUpdate(
    updatesList: Array<{
      id: number;
      updates: Partial<{
        type: string;
        code: string;
        description: string;
        amount: number;
        percentage: number;
        isRecurring: boolean;
        appliedDate: string;
        note: string;
      }>;
    }>,
    user: string = "system",
  ): Promise<BulkUpdateResponse> {
    try {
      if (!window.backendAPI?.deduction) {
        throw new Error("Electron API (deduction) not available");
      }

      const response = await window.backendAPI.deduction({
        method: "bulkUpdateDeductions",
        params: { updatesList, user },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk update deductions");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk update deductions");
    }
  }

  // --------------------------------------------------------------------
  // 📁 EXPORT & REPORT METHODS
  // --------------------------------------------------------------------

  /**
   * Export filtered deductions to CSV.
   * @param params - Filters: payrollRecordId, type, isRecurring, startDate, endDate, fields
   */
  async exportCSV(params?: {
    payrollRecordId?: number;
    type?: string;
    isRecurring?: boolean;
    startDate?: string;
    endDate?: string;
    fields?: string; // comma-separated list of fields
  }): Promise<ExportDeductionsResponse> {
    try {
      if (!window.backendAPI?.deduction) {
        throw new Error("Electron API (deduction) not available");
      }

      const response = await window.backendAPI.deduction({
        method: "exportDeductionsToCSV",
        params: params || {},
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
   * Generate a deduction report.
   * @param params - Filters and format (json/html)
   */
  async generateReport(params?: {
    payrollRecordId?: number;
    type?: string;
    isRecurring?: boolean;
    startDate?: string;
    endDate?: string;
    format?: "json" | "html";
  }): Promise<GenerateDeductionReportResponse> {
    try {
      if (!window.backendAPI?.deduction) {
        throw new Error("Electron API (deduction) not available");
      }

      const response = await window.backendAPI.deduction({
        method: "generateDeductionReport",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to generate deduction report",
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate deduction report");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Get total deduction amount for a payroll record.
   * @param payrollRecordId - Payroll record ID
   */
  async getTotalByPayroll(payrollRecordId: number): Promise<number> {
    try {
      const response = await this.getAll({ payrollRecordId });
      const deductions = response.data || [];
      return deductions.reduce((sum, d) => sum + d.amount, 0);
    } catch (error) {
      console.error("Error getting total deductions by payroll:", error);
      return 0;
    }
  }

  /**
   * Check if a payroll record has any deductions.
   * @param payrollRecordId - Payroll record ID
   */
  async hasDeductions(payrollRecordId: number): Promise<boolean> {
    try {
      const response = await this.getAll({ payrollRecordId, limit: 1 });
      return (response.data?.length ?? 0) > 0;
    } catch (error) {
      console.error("Error checking deductions:", error);
      return false;
    }
  }

  /**
   * Validate if the backend API is available.
   */
  async isAvailable(): Promise<boolean> {
    return !!window.backendAPI?.deduction;
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const deductionAPI = new DeductionAPI();
export default deductionAPI;

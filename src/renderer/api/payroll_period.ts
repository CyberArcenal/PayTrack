// src/renderer/api/payrollPeriod.ts
// Payroll Period API – similar structure to attendanceLog.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces (based on PayrollPeriod entity)
// ----------------------------------------------------------------------

export interface PayrollPeriodEntry {
  id: number;
  name: string | null;               // Optional period name
  periodType: string;                 // e.g., 'weekly', 'semi-monthly', 'monthly'
  startDate: string;                  // ISO date (YYYY-MM-DD)
  endDate: string;                    // ISO date
  payDate: string;                    // ISO date
  workingDays: number;
  status: string;                      // 'open', 'processing', 'locked', 'closed'
  lockedAt: string | null;             // ISO datetime when locked
  closedAt: string | null;             // ISO datetime when closed
  totalEmployees: number;
  totalGrossPay: number | string;      // decimal stored as string or number
  totalDeductions: number | string;
  totalNetPay: number | string;
  createdAt: string;                   // ISO datetime
  updatedAt: string;                   // ISO datetime

  // Optional relations (if populated)
  payrollRecords?: Array<{
    id: number;
    employeeId: number;
    paymentStatus: string;
    netPay: number | string;
  }>;
}

export interface PaginatedPayrollPeriods {
  items: PayrollPeriodEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PayrollPeriodStats {
  totalPeriods: number;
  statusCounts: Array<{ status: string; count: number }>;
  overall: {
    grossPay: number;
    deductions: number;
    netPay: number;
    employees: number;
  };
}

export interface NextPeriodSuggestion {
  periodType: string;
  startDate: string;
  endDate: string;
  payDate: string;
  name: string;
  workingDays: number;
}

export interface FileOperationResult {
  filePath: string;
  filename?: string;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface PayrollPeriodsResponse {
  status: boolean;
  message: string;
  data: PayrollPeriodEntry[];          // For getAll, search, etc.
}

export interface PaginatedPayrollPeriodsResponse {
  status: boolean;
  message: string;
  data: PaginatedPayrollPeriods;
}

export interface PayrollPeriodResponse {
  status: boolean;
  message: string;
  data: PayrollPeriodEntry;
}

export interface PayrollPeriodStatsResponse {
  status: boolean;
  message: string;
  data: PayrollPeriodStats;
}

export interface NextPeriodResponse {
  status: boolean;
  message: string;
  data: NextPeriodSuggestion;
}

export interface DeleteResponse {
  status: boolean;
  message: string;
  data: { success: boolean; message: string } | null;
}

export interface ExportCSVResponse {
  status: boolean;
  message: string;
  data: FileOperationResult;
}

export interface ValidationResponse {
  status: boolean;
  message: string;
  data: boolean;
}

// ----------------------------------------------------------------------
// 🧠 PayrollPeriodAPI Class
// ----------------------------------------------------------------------

class PayrollPeriodAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all payroll periods with optional filters and pagination.
   * @param params - Filters: status, periodType, startDate, endDate, payDate, page, limit
   */
  async getAll(params?: {
    status?: string;
    periodType?: string;
    startDate?: string;
    endDate?: string;
    payDate?: string;
    page?: number;
    limit?: number;
  }): Promise<PayrollPeriodsResponse> {
    try {
      if (!window.backendAPI?.payrollPeriod) {
        throw new Error("Electron API (payrollPeriod) not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "getAllPayrollPeriods",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch payroll periods");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch payroll periods");
    }
  }

  /**
   * Get a single payroll period by ID.
   * @param id - Period ID
   */
  async getById(id: number): Promise<PayrollPeriodResponse> {
    try {
      if (!window.backendAPI?.payrollPeriod) {
        throw new Error("Electron API (payrollPeriod) not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "getPayrollPeriodById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch payroll period");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch payroll period");
    }
  }

  /**
   * Get the current active payroll period (based on today's date and open/processing status).
   */
  async getCurrent(): Promise<PayrollPeriodResponse> {
    try {
      if (!window.backendAPI?.payrollPeriod) {
        throw new Error("Electron API (payrollPeriod) not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "getCurrentPayrollPeriod",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch current payroll period");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch current payroll period");
    }
  }

  /**
   * Get payroll period that covers a specific date.
   * @param date - ISO date string (YYYY-MM-DD)
   */
  async getByDate(date: string): Promise<PayrollPeriodResponse> {
    try {
      if (!window.backendAPI?.payrollPeriod) {
        throw new Error("Electron API (payrollPeriod) not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "getPayrollPeriodByDate",
        params: { date },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch payroll period by date");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch payroll period by date");
    }
  }

  /**
   * Get summary statistics across all payroll periods.
   */
  async getStats(): Promise<PayrollPeriodStatsResponse> {
    try {
      if (!window.backendAPI?.payrollPeriod) {
        throw new Error("Electron API (payrollPeriod) not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "getPayrollPeriodStats",
        params: {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch payroll period stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch payroll period stats");
    }
  }

  /**
   * Get a suggested next period based on the latest period and period type.
   * @param periodType - e.g., 'semi-monthly', 'monthly' (default: 'semi-monthly')
   */
  async getNextPeriod(periodType: string = "semi-monthly"): Promise<NextPeriodResponse> {
    try {
      if (!window.backendAPI?.payrollPeriod) {
        throw new Error("Electron API (payrollPeriod) not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "getNextPayrollPeriod",
        params: { periodType },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch next period suggestion");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch next period suggestion");
    }
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATION METHODS
  // --------------------------------------------------------------------

  /**
   * Create a new payroll period.
   * @param data - Payroll period data (name, periodType, startDate, endDate, payDate, workingDays, status?)
   * @param user - Optional username (defaults to 'system')
   */
  async create(data: {
    name?: string;
    periodType: string;
    startDate: string | Date;
    endDate: string | Date;
    payDate: string | Date;
    workingDays?: number;
    status?: string;               // 'open' if not provided
  }, user: string = "system"): Promise<PayrollPeriodResponse> {
    try {
      if (!window.backendAPI?.payrollPeriod) {
        throw new Error("Electron API (payrollPeriod) not available");
      }

      // Convert Date objects to ISO strings (YYYY-MM-DD)
      const payload = {
        ...data,
        startDate: data.startDate instanceof Date ? data.startDate.toISOString().split('T')[0] : data.startDate,
        endDate: data.endDate instanceof Date ? data.endDate.toISOString().split('T')[0] : data.endDate,
        payDate: data.payDate instanceof Date ? data.payDate.toISOString().split('T')[0] : data.payDate,
      };

      const response = await window.backendAPI.payrollPeriod({
        method: "createPayrollPeriod",
        params: payload,
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create payroll period");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create payroll period");
    }
  }

  /**
   * Update an existing payroll period.
   * @param id - Period ID
   * @param data - Fields to update (any of the create fields)
   * @param user - Optional username
   */
  async update(id: number, data: Partial<{
    name: string;
    periodType: string;
    startDate: string | Date;
    endDate: string | Date;
    payDate: string | Date;
    workingDays: number;
    status: string;
  }>, user: string = "system"): Promise<PayrollPeriodResponse> {
    try {
      if (!window.backendAPI?.payrollPeriod) {
        throw new Error("Electron API (payrollPeriod) not available");
      }

      const payload: any = { ...data };
      if (payload.startDate instanceof Date) payload.startDate = payload.startDate.toISOString().split('T')[0];
      if (payload.endDate instanceof Date) payload.endDate = payload.endDate.toISOString().split('T')[0];
      if (payload.payDate instanceof Date) payload.payDate = payload.payDate.toISOString().split('T')[0];

      const response = await window.backendAPI.payrollPeriod({
        method: "updatePayrollPeriod",
        params: { id, ...payload },
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update payroll period");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update payroll period");
    }
  }

  /**
   * Delete a payroll period (only if no payroll records linked).
   * @param id - Period ID
   * @param user - Optional username
   */
  async delete(id: number, user: string = "system"): Promise<DeleteResponse> {
    try {
      if (!window.backendAPI?.payrollPeriod) {
        throw new Error("Electron API (payrollPeriod) not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "deletePayrollPeriod",
        params: { id },
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete payroll period");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete payroll period");
    }
  }

  /**
   * Open a payroll period (set status to 'open').
   * If period is locked, it unlocks it.
   * @param id - Period ID
   * @param user - Optional username
   */
  async open(id: number, user: string = "system"): Promise<PayrollPeriodResponse> {
    try {
      if (!window.backendAPI?.payrollPeriod) {
        throw new Error("Electron API (payrollPeriod) not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "openPayrollPeriod",
        params: { id },
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to open payroll period");
    } catch (error: any) {
      throw new Error(error.message || "Failed to open payroll period");
    }
  }

  /**
   * Close a payroll period (finalize, cannot be changed).
   * @param id - Period ID
   * @param user - Optional username
   */
  async close(id: number, user: string = "system"): Promise<PayrollPeriodResponse> {
    try {
      if (!window.backendAPI?.payrollPeriod) {
        throw new Error("Electron API (payrollPeriod) not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "closePayrollPeriod",
        params: { id },
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to close payroll period");
    } catch (error: any) {
      throw new Error(error.message || "Failed to close payroll period");
    }
  }

  /**
   * Lock a payroll period (prevent further changes).
   * @param id - Period ID
   * @param user - Optional username
   */
  async lock(id: number, user: string = "system"): Promise<PayrollPeriodResponse> {
    try {
      if (!window.backendAPI?.payrollPeriod) {
        throw new Error("Electron API (payrollPeriod) not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "lockPayrollPeriod",
        params: { id },
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to lock payroll period");
    } catch (error: any) {
      throw new Error(error.message || "Failed to lock payroll period");
    }
  }

  // --------------------------------------------------------------------
  // 📁 EXPORT METHODS
  // --------------------------------------------------------------------

  /**
   * Export filtered payroll periods to CSV.
   * @param params - Optional filters: status, periodType, startDate, endDate
   */
  async exportCSV(params?: {
    status?: string;
    periodType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ExportCSVResponse> {
    try {
      if (!window.backendAPI?.payrollPeriod) {
        throw new Error("Electron API (payrollPeriod) not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "exportPayrollPeriodsToCSV",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export payroll periods to CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export payroll periods to CSV");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if a payroll period exists with given ID.
   * @param id - Period ID
   */
  async exists(id: number): Promise<boolean> {
    try {
      const response = await this.getById(id);
      return response.status && !!response.data;
    } catch {
      return false;
    }
  }

  /**
   * Get the latest payroll period.
   */
  async getLatest(): Promise<PayrollPeriodEntry | null> {
    try {
      const response = await this.getAll({ limit: 1, page: 1 });
      return response.data?.[0] || null;
    } catch (error) {
      console.error("Error fetching latest payroll period:", error);
      return null;
    }
  }

  /**
   * Validate if the backend API is available.
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.payrollPeriod);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const payrollPeriodAPI = new PayrollPeriodAPI();
export default payrollPeriodAPI;
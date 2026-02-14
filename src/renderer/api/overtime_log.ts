// src/renderer/api/overtimeLog.ts
// Overtime Log API – similar structure to attendance_log.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces (based on OvertimeLog entity)
// ----------------------------------------------------------------------

export interface OvertimeLogEntry {
  id: number;
  employeeId: number;
  payrollRecordId: number | null;
  date: string;                    // YYYY-MM-DD
  startTime: string;                // HH:MM:SS
  endTime: string;                  // HH:MM:SS
  hours: number;                    // decimal
  rate: number;                     // multiplier (e.g., 1.25)
  amount: number;                   // calculated overtime pay
  type: string;                     // e.g., 'regular', 'holiday', 'rest-day'
  approvedBy: string | null;
  approvalStatus: string;           // 'pending', 'approved', 'rejected'
  note: string | null;
  createdAt: string;                // ISO datetime
  updatedAt: string;                // ISO datetime

  // Optional relations (if populated)
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    hourlyRate?: number;
  };
  payrollRecord?: {
    id: number;
    periodId: number;
    paymentStatus: string;
  };
}

export interface PaginatedOvertimeLogs {
  items: OvertimeLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OvertimeSummary {
  totalLogs: number;
  totalHours: number;
  totalAmount: number;
  averageHours: number;
  statusCounts: Array<{ status: string; count: number }>;
}

export interface OvertimeStats {
  totalLogs: number;
  totalHours: number;
  totalAmount: number;
  byType: Array<{ type: string; count: number; hours: number }>;
  byApprovalStatus: Array<{ status: string; count: number }>;
  dateRange?: { start: string; end: string };
}

export interface FileOperationResult {
  filePath: string;
}

export interface OvertimeReportResult {
  filePath: string;
  format: string;
  entryCount: number;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface OvertimeLogsResponse {
  status: boolean;
  message: string;
  data: OvertimeLogEntry[];               // For getAll, search, etc.
}

export interface PaginatedOvertimeLogsResponse {
  status: boolean;
  message: string;
  data: PaginatedOvertimeLogs;
}

export interface OvertimeLogResponse {
  status: boolean;
  message: string;
  data: OvertimeLogEntry;
}

export interface OvertimeSummaryResponse {
  status: boolean;
  message: string;
  data: OvertimeSummary;
}

export interface OvertimeStatsResponse {
  status: boolean;
  message: string;
  data: OvertimeStats;
}

export interface ExportOvertimeLogsResponse {
  status: boolean;
  message: string;
  data: FileOperationResult;
}

export interface GenerateOvertimeReportResponse {
  status: boolean;
  message: string;
  data: OvertimeReportResult;
}

export interface BulkOvertimeResponse {
  status: boolean;
  message: string;
  data: {
    created?: OvertimeLogEntry[];
    updated?: OvertimeLogEntry[];
    errors?: any[];
  };
}

// ----------------------------------------------------------------------
// 🧠 OvertimeLogAPI Class
// ----------------------------------------------------------------------

class OvertimeLogAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all overtime logs with optional filters and pagination.
   * @param params - Filters: employeeId, startDate, endDate, type, approvalStatus, payrollRecordId, page, limit
   */
  async getAll(params?: {
    employeeId?: number;
    startDate?: string;
    endDate?: string;
    type?: string;
    approvalStatus?: string;
    payrollRecordId?: number;
    page?: number;
    limit?: number;
  }): Promise<OvertimeLogsResponse> {
    try {
      if (!window.backendAPI?.overtime) {
        throw new Error("Electron API (overtime) not available");
      }

      const response = await window.backendAPI.overtime({
        method: "getAllOvertime",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch overtime logs");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch overtime logs");
    }
  }

  /**
   * Get a single overtime log by ID.
   * @param id - Overtime log ID
   */
  async getById(id: number): Promise<OvertimeLogResponse> {
    try {
      if (!window.backendAPI?.overtime) {
        throw new Error("Electron API (overtime) not available");
      }

      const response = await window.backendAPI.overtime({
        method: "getOvertimeById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch overtime log");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch overtime log");
    }
  }

  /**
   * Get overtime logs for a specific employee.
   * @param params - employeeId, startDate, endDate, type, approvalStatus, page, limit
   */
  async getByEmployee(params: {
    employeeId: number;
    startDate?: string;
    endDate?: string;
    type?: string;
    approvalStatus?: string;
    page?: number;
    limit?: number;
  }): Promise<OvertimeLogsResponse> {
    try {
      if (!window.backendAPI?.overtime) {
        throw new Error("Electron API (overtime) not available");
      }

      const response = await window.backendAPI.overtime({
        method: "getOvertimeByEmployee",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch employee overtime");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch employee overtime");
    }
  }

  /**
   * Get overtime logs linked to a specific payroll record.
   * @param payrollRecordId - Payroll record ID
   */
  async getByPayroll(payrollRecordId: number): Promise<OvertimeLogsResponse> {
    try {
      if (!window.backendAPI?.overtime) {
        throw new Error("Electron API (overtime) not available");
      }

      const response = await window.backendAPI.overtime({
        method: "getOvertimeByPayroll",
        params: { payrollRecordId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch overtime by payroll");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch overtime by payroll");
    }
  }

  /**
   * Get overtime logs within a date range.
   * @param params - startDate, endDate, employeeId?
   */
  async getByDateRange(params: {
    startDate: string;
    endDate: string;
    employeeId?: number;
  }): Promise<OvertimeLogsResponse> {
    try {
      if (!window.backendAPI?.overtime) {
        throw new Error("Electron API (overtime) not available");
      }

      const response = await window.backendAPI.overtime({
        method: "getOvertimeByDate",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch overtime by date");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch overtime by date");
    }
  }

  /**
   * Get summary statistics for overtime logs.
   * @param params - Optional filters: employeeId, startDate, endDate
   */
  async getStats(params?: {
    employeeId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<OvertimeStatsResponse> {
    try {
      if (!window.backendAPI?.overtime) {
        throw new Error("Electron API (overtime) not available");
      }

      const response = await window.backendAPI.overtime({
        method: "getOvertimeStats",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch overtime stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch overtime stats");
    }
  }

  /**
   * Search overtime logs with flexible filters.
   * @param params - searchTerm, employeeId, startDate, endDate, type, approvalStatus, page, limit
   */
  async search(params: {
    searchTerm?: string;
    employeeId?: number;
    startDate?: string;
    endDate?: string;
    type?: string;
    approvalStatus?: string;
    page?: number;
    limit?: number;
  }): Promise<OvertimeLogsResponse> {
    try {
      if (!window.backendAPI?.overtime) {
        throw new Error("Electron API (overtime) not available");
      }

      const response = await window.backendAPI.overtime({
        method: "searchOvertime",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search overtime");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search overtime");
    }
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATION METHODS
  // --------------------------------------------------------------------

  /**
   * Create a new overtime log.
   * @param data - Overtime data
   * @param user - Optional username (defaults to 'system')
   */
  async create(data: {
    employeeId: number;
    date: string | Date;
    startTime: string;          // HH:MM:SS
    endTime: string;            // HH:MM:SS
    type?: string;
    rate?: number;
    approvedBy?: string;
    note?: string;
  }, user: string = "system"): Promise<OvertimeLogResponse> {
    try {
      if (!window.backendAPI?.overtime) {
        throw new Error("Electron API (overtime) not available");
      }

      // Convert Date to YYYY-MM-DD if needed
      const payload = {
        ...data,
        date: data.date instanceof Date ? data.date.toISOString().split('T')[0] : data.date,
      };

      const response = await window.backendAPI.overtime({
        method: "createOvertime",
        params: payload,
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create overtime log");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create overtime log");
    }
  }

  /**
   * Update an existing overtime log.
   * @param id - Overtime log ID
   * @param data - Fields to update
   * @param user - Optional username
   */
  async update(id: number, data: Partial<{
    employeeId: number;
    date: string | Date;
    startTime: string;
    endTime: string;
    type: string;
    rate: number;
    approvedBy: string;
    approvalStatus: string;
    note: string;
  }>, user: string = "system"): Promise<OvertimeLogResponse> {
    try {
      if (!window.backendAPI?.overtime) {
        throw new Error("Electron API (overtime) not available");
      }

      const payload = { ...data };
      if (payload.date instanceof Date) {
        payload.date = payload.date.toISOString().split('T')[0];
      }

      const response = await window.backendAPI.overtime({
        method: "updateOvertime",
        params: { id, ...payload },
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update overtime log");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update overtime log");
    }
  }

  /**
   * Delete an overtime log.
   * @param id - Overtime log ID
   * @param user - Optional username
   */
  async delete(id: number, user: string = "system"): Promise<{ status: boolean; message: string; data: any }> {
    try {
      if (!window.backendAPI?.overtime) {
        throw new Error("Electron API (overtime) not available");
      }

      const response = await window.backendAPI.overtime({
        method: "deleteOvertime",
        params: { id },
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete overtime log");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete overtime log");
    }
  }

  /**
   * Bulk create overtime logs.
   * @param records - Array of overtime log data
   * @param user - Optional username
   */
  async bulkCreate(records: Array<{
    employeeId: number;
    date: string | Date;
    startTime: string;
    endTime: string;
    type?: string;
    rate?: number;
    approvedBy?: string;
    note?: string;
  }>, user: string = "system"): Promise<BulkOvertimeResponse> {
    try {
      if (!window.backendAPI?.overtime) {
        throw new Error("Electron API (overtime) not available");
      }

      const processedRecords = records.map(rec => ({
        ...rec,
        date: rec.date instanceof Date ? rec.date.toISOString().split('T')[0] : rec.date,
      }));

      const response = await window.backendAPI.overtime({
        method: "bulkCreateOvertime",
        params: { items: processedRecords },
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk create overtime");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk create overtime");
    }
  }

  /**
   * Bulk update overtime logs.
   * @param updates - Array of { id, data } objects
   * @param user - Optional username
   */
  async bulkUpdate(updates: Array<{ id: number; data: Partial<{
    employeeId: number;
    date: string | Date;
    startTime: string;
    endTime: string;
    type: string;
    rate: number;
    approvedBy: string;
    approvalStatus: string;
    note: string;
  }> }>, user: string = "system"): Promise<BulkOvertimeResponse> {
    try {
      if (!window.backendAPI?.overtime) {
        throw new Error("Electron API (overtime) not available");
      }

      const processedUpdates = updates.map(({ id, data }) => ({
        id,
        data: {
          ...data,
          date: data.date instanceof Date ? data.date.toISOString().split('T')[0] : data.date,
        },
      }));

      const response = await window.backendAPI.overtime({
        method: "bulkUpdateOvertime",
        params: { updates: processedUpdates },
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk update overtime");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk update overtime");
    }
  }

  /**
   * Approve an overtime log.
   * @param id - Overtime log ID
   * @param approver - Approver name/ID
   * @param user - Optional username
   */
  async approve(id: number, approver: string, user: string = "system"): Promise<OvertimeLogResponse> {
    try {
      if (!window.backendAPI?.overtime) {
        throw new Error("Electron API (overtime) not available");
      }

      const response = await window.backendAPI.overtime({
        method: "approveOvertime",
        params: { id, approver },
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to approve overtime log");
    } catch (error: any) {
      throw new Error(error.message || "Failed to approve overtime log");
    }
  }

  /**
   * Reject an overtime log with a reason.
   * @param id - Overtime log ID
   * @param reason - Rejection reason
   * @param user - Optional username
   */
  async reject(id: number, reason: string, user: string = "system"): Promise<OvertimeLogResponse> {
    try {
      if (!window.backendAPI?.overtime) {
        throw new Error("Electron API (overtime) not available");
      }

      const response = await window.backendAPI.overtime({
        method: "rejectOvertime",
        params: { id, reason },
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to reject overtime log");
    } catch (error: any) {
      throw new Error(error.message || "Failed to reject overtime log");
    }
  }

  // --------------------------------------------------------------------
  // 📁 EXPORT & REPORT METHODS
  // --------------------------------------------------------------------

  /**
   * Export filtered overtime logs to CSV.
   * @param params - Filters: employeeId, startDate, endDate, type, approvalStatus, limit?
   */
  async exportCSV(params?: {
    employeeId?: number;
    startDate?: string;
    endDate?: string;
    type?: string;
    approvalStatus?: string;
    limit?: number;
  }): Promise<ExportOvertimeLogsResponse> {
    try {
      if (!window.backendAPI?.overtime) {
        throw new Error("Electron API (overtime) not available");
      }

      const response = await window.backendAPI.overtime({
        method: "exportOvertimeToCSV",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export overtime to CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export overtime to CSV");
    }
  }

  /**
   * Generate an overtime report (JSON or plain text).
   * @param params - filters and format ('json' | 'text')
   */
  async generateReport(params?: {
    employeeId?: number;
    startDate?: string;
    endDate?: string;
    type?: string;
    approvalStatus?: string;
    format?: "json" | "text";
  }): Promise<GenerateOvertimeReportResponse> {
    try {
      if (!window.backendAPI?.overtime) {
        throw new Error("Electron API (overtime) not available");
      }

      const response = await window.backendAPI.overtime({
        method: "generateOvertimeReport",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to generate overtime report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate overtime report");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if an employee has overtime logs in a given date range.
   * @param employeeId - Employee ID
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   */
  async hasLogs(employeeId: number, startDate?: string, endDate?: string): Promise<boolean> {
    try {
      const response = await this.getAll({
        employeeId,
        startDate,
        endDate,
        limit: 1,
      });
      return (response.data?.length ?? 0) > 0;
    } catch (error) {
      console.error("Error checking overtime logs:", error);
      return false;
    }
  }

  /**
   * Get the latest overtime log for an employee.
   * @param employeeId - Employee ID
   */
  async getLatestEntry(employeeId: number): Promise<OvertimeLogEntry | null> {
    try {
      const response = await this.getAll({
        employeeId,
        limit: 1,
        page: 1,
      });
      return response.data?.[0] || null;
    } catch (error) {
      console.error("Error fetching latest overtime entry:", error);
      return null;
    }
  }

  /**
   * Validate if the backend API is available.
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.overtime);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const overtimeLogAPI = new OvertimeLogAPI();
export default overtimeLogAPI;
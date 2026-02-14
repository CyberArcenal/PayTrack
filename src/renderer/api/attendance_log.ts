// src/renderer/api/attendanceLog.ts
// Attendance Log API – similar structure to audit.ts

// ----------------------------------------------------------------------
// 📦 Types & Interfaces (based on AttendanceLog entity)
// ----------------------------------------------------------------------

export interface AttendanceLogEntry {
  id: number;
  employeeId: number;
  timestamp: string;            // ISO datetime
  source: string;               // e.g., 'manual', 'rfid', 'biometric'
  status: string;               // 'present', 'absent', 'late', 'half-day'
  hoursWorked: number;          // decimal
  overtimeHours: number;        // decimal
  lateMinutes: number;
  note: string | null;
  createdAt: string;            // ISO datetime
  updatedAt: string;            // ISO datetime
  // Optional relations (if populated)
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeNumber: string;
  };
  payrollRecord?: {
    id: number;
    periodId: number;
    paymentStatus: string;
  };
}

export interface PaginatedAttendanceLogs {
  items: AttendanceLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AttendanceSummary {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  totalHoursWorked: number;
  totalOvertimeHours: number;
  totalLateMinutes: number;
}

export interface AttendanceStats {
  // Extend as needed; currently we can reuse summary or define additional fields
  totalRecords: number;
  byStatus: Array<{ status: string; count: number }>;
  bySource: Array<{ source: string; count: number }>;
  dateRange?: { start: string; end: string };
}

export interface AttendanceCounts {
  byStatus: Array<{ status: string; count: number }>;
  bySource: Array<{ source: string; count: number }>;
  // Possibly by employee, etc.
}

export interface TopAttendanceActivities {
  topEmployees: Array<{ employeeId: number; count: number; name?: string }>;
  topStatuses: Array<{ status: string; count: number }>;
  // etc.
}

export interface FileOperationResult {
  filePath: string;
}

export interface AttendanceReportResult {
  filePath: string;
  format: string;
  entryCount: number;
}

// ----------------------------------------------------------------------
// 📨 Response Interfaces (mirror IPC response format)
// ----------------------------------------------------------------------

export interface AttendanceLogsResponse {
  status: boolean;
  message: string;
  data: AttendanceLogEntry[];               // For getAll, search, etc.
}

export interface PaginatedAttendanceLogsResponse {
  status: boolean;
  message: string;
  data: PaginatedAttendanceLogs;
}

export interface AttendanceLogResponse {
  status: boolean;
  message: string;
  data: AttendanceLogEntry;
}

export interface AttendanceSummaryResponse {
  status: boolean;
  message: string;
  data: AttendanceSummary;
}

export interface AttendanceStatsResponse {
  status: boolean;
  message: string;
  data: AttendanceStats;
}

export interface AttendanceCountsResponse {
  status: boolean;
  message: string;
  data: AttendanceCounts;
}

export interface TopAttendanceActivitiesResponse {
  status: boolean;
  message: string;
  data: TopAttendanceActivities;
}

export interface RecentAttendanceResponse {
  status: boolean;
  message: string;
  data: {
    items: AttendanceLogEntry[];
    limit: number;
  };
}

export interface ExportAttendanceLogsResponse {
  status: boolean;
  message: string;
  data: FileOperationResult;
}

export interface GenerateAttendanceReportResponse {
  status: boolean;
  message: string;
  data: AttendanceReportResult;
}

export interface ValidationResponse {
  status: boolean;
  message: string;
  data: boolean;
}

// ----------------------------------------------------------------------
// 🧠 AttendanceLogAPI Class
// ----------------------------------------------------------------------

class AttendanceLogAPI {
  // --------------------------------------------------------------------
  // 🔎 READ-ONLY METHODS
  // --------------------------------------------------------------------

  /**
   * Get all attendance logs with optional filters and pagination.
   * @param params - Filters: employeeId, startDate, endDate, status, source, page, limit
   */
  async getAll(params?: {
    employeeId?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    source?: string;
    page?: number;
    limit?: number;
  }): Promise<AttendanceLogsResponse> {
    try {
      if (!window.backendAPI?.attendance) {
        throw new Error("Electron API (attendance) not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAllAttendance",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch attendance logs");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch attendance logs");
    }
  }

  /**
   * Get a single attendance log by ID.
   * @param id - Attendance log ID
   */
  async getById(id: number): Promise<AttendanceLogResponse> {
    try {
      if (!window.backendAPI?.attendance) {
        throw new Error("Electron API (attendance) not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAttendanceById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch attendance log");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch attendance log");
    }
  }

  /**
   * Get attendance logs for a specific employee.
   * @param params - employeeId, startDate, endDate, status, source, page, limit
   */
  async getByEmployee(params: {
    employeeId: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    source?: string;
    page?: number;
    limit?: number;
  }): Promise<AttendanceLogsResponse> {
    try {
      if (!window.backendAPI?.attendance) {
        throw new Error("Electron API (attendance) not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAttendanceByEmployee",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch employee attendance");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch employee attendance");
    }
  }

  /**
   * Get attendance logs within a date range.
   * @param params - startDate, endDate, employeeId?, status?, source?, page?, limit?
   */
  async getByDateRange(params: {
    startDate: string;
    endDate: string;
    employeeId?: number;
    status?: string;
    source?: string;
    page?: number;
    limit?: number;
  }): Promise<AttendanceLogsResponse> {
    try {
      if (!window.backendAPI?.attendance) {
        throw new Error("Electron API (attendance) not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAttendanceByDate",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch attendance by date");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch attendance by date");
    }
  }

  /**
   * Get attendance summary for an employee over a date range.
   * @param params - employeeId, startDate, endDate
   */
  async getSummary(params: {
    employeeId: number;
    startDate: string;
    endDate: string;
  }): Promise<AttendanceSummaryResponse> {
    try {
      if (!window.backendAPI?.attendance) {
        throw new Error("Electron API (attendance) not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAttendanceSummary",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch attendance summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch attendance summary");
    }
  }

  /**
   * Get attendance statistics (optional date range, employeeId).
   * @param params - employeeId?, startDate?, endDate?
   */
  async getStats(params?: {
    employeeId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<AttendanceStatsResponse> {
    try {
      if (!window.backendAPI?.attendance) {
        throw new Error("Electron API (attendance) not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAttendanceStats",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch attendance stats");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch attendance stats");
    }
  }

  /**
   * Search attendance logs with flexible filters.
   * @param params - searchTerm, employeeId, startDate, endDate, status, source, page, limit
   */
  async search(params: {
    searchTerm?: string;
    employeeId?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    source?: string;
    page?: number;
    limit?: number;
  }): Promise<AttendanceLogsResponse> {
    try {
      if (!window.backendAPI?.attendance) {
        throw new Error("Electron API (attendance) not available");
      }

      const response = await window.backendAPI.attendance({
        method: "searchAttendance",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to search attendance");
    } catch (error: any) {
      throw new Error(error.message || "Failed to search attendance");
    }
  }

  /**
   * Get attendance logs for a payroll period (unprocessed).
   * @param params - employeeId, startDate, endDate, processed? (false for unprocessed)
   */
  async getForPayroll(params: {
    employeeId: number;
    startDate: string;
    endDate: string;
    processed?: boolean; // if false, get unprocessed
  }): Promise<AttendanceLogsResponse> {
    try {
      if (!window.backendAPI?.attendance) {
        throw new Error("Electron API (attendance) not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAttendanceForPayroll",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to fetch attendance for payroll");
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch attendance for payroll");
    }
  }

  // --------------------------------------------------------------------
  // ✏️ WRITE OPERATION METHODS
  // --------------------------------------------------------------------

  /**
   * Create a new attendance log.
   * @param data - Attendance data (employeeId, timestamp, status, source?, hoursWorked?, overtimeHours?, lateMinutes?, note?)
   * @param user - Optional username (defaults to 'system')
   */
  async create(data: {
    employeeId: number;
    timestamp: string | Date;
    source?: string;
    status: string;
    hoursWorked?: number;
    overtimeHours?: number;
    lateMinutes?: number;
    note?: string;
  }, user: string = "system"): Promise<AttendanceLogResponse> {
    try {
      if (!window.backendAPI?.attendance) {
        throw new Error("Electron API (attendance) not available");
      }

      // Convert Date to ISO string if needed
      const payload = {
        ...data,
        timestamp: data.timestamp instanceof Date ? data.timestamp.toISOString() : data.timestamp,
      };

      const response = await window.backendAPI.attendance({
        method: "createAttendance",
        params: payload,
        user, // may be sent as part of params or separately; handler expects user param
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create attendance log");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create attendance log");
    }
  }

  /**
   * Update an existing attendance log.
   * @param id - Attendance log ID
   * @param data - Fields to update (any of the create fields)
   * @param user - Optional username
   */
  async update(id: number, data: Partial<{
    employeeId: number;
    timestamp: string | Date;
    source: string;
    status: string;
    hoursWorked: number;
    overtimeHours: number;
    lateMinutes: number;
    note: string;
  }>, user: string = "system"): Promise<AttendanceLogResponse> {
    try {
      if (!window.backendAPI?.attendance) {
        throw new Error("Electron API (attendance) not available");
      }

      // Convert Date if present
      const payload = { ...data };
      if (payload.timestamp instanceof Date) {
        payload.timestamp = payload.timestamp.toISOString();
      }

      const response = await window.backendAPI.attendance({
        method: "updateAttendance",
        params: { id, ...payload },
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update attendance log");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update attendance log");
    }
  }

  /**
   * Delete an attendance log.
   * @param id - Attendance log ID
   * @param user - Optional username
   */
  async delete(id: number, user: string = "system"): Promise<{ status: boolean; message: string; data: any }> {
    try {
      if (!window.backendAPI?.attendance) {
        throw new Error("Electron API (attendance) not available");
      }

      const response = await window.backendAPI.attendance({
        method: "deleteAttendance",
        params: { id },
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete attendance log");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete attendance log");
    }
  }

  /**
   * Mark multiple attendance logs as processed for a payroll record.
   * @param attendanceIds - Array of attendance log IDs
   * @param payrollRecordId - Payroll record ID
   * @param user - Optional username
   */
  async markAsProcessed(attendanceIds: number[], payrollRecordId: number, user: string = "system"): Promise<AttendanceLogsResponse> {
    try {
      if (!window.backendAPI?.attendance) {
        throw new Error("Electron API (attendance) not available");
      }

      const response = await window.backendAPI.attendance({
        method: "markAttendanceAsProcessed",
        params: { attendanceIds, payrollRecordId },
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to mark attendance as processed");
    } catch (error: any) {
      throw new Error(error.message || "Failed to mark attendance as processed");
    }
  }

  /**
   * Bulk create attendance logs.
   * @param records - Array of attendance log data (each as in create)
   * @param user - Optional username
   */
  async bulkCreate(records: Array<{
    employeeId: number;
    timestamp: string | Date;
    source?: string;
    status: string;
    hoursWorked?: number;
    overtimeHours?: number;
    lateMinutes?: number;
    note?: string;
  }>, user: string = "system"): Promise<{ status: boolean; message: string; data: { created: any[], errors: any[] } }> {
    try {
      if (!window.backendAPI?.attendance) {
        throw new Error("Electron API (attendance) not available");
      }

      // Convert timestamps
      const processedRecords = records.map(rec => ({
        ...rec,
        timestamp: rec.timestamp instanceof Date ? rec.timestamp.toISOString() : rec.timestamp,
      }));

      const response = await window.backendAPI.attendance({
        method: "bulkCreateAttendance",
        params: { records: processedRecords },
        user,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk create attendance");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk create attendance");
    }
  }

  // --------------------------------------------------------------------
  // 📁 EXPORT & REPORT METHODS
  // --------------------------------------------------------------------

  /**
   * Export filtered attendance logs to CSV.
   * @param params - Filters: employeeId, startDate, endDate, status, source, limit?
   */
  async exportCSV(params?: {
    employeeId?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    source?: string;
    limit?: number;
  }): Promise<ExportAttendanceLogsResponse> {
    try {
      if (!window.backendAPI?.attendance) {
        throw new Error("Electron API (attendance) not available");
      }

      const response = await window.backendAPI.attendance({
        method: "exportAttendanceToCSV",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export attendance to CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export attendance to CSV");
    }
  }

  /**
   * Generate an attendance report (JSON, HTML, etc.).
   * @param params - employeeId?, startDate?, endDate?, format? ('json' | 'html')
   */
  async generateReport(params?: {
    employeeId?: number;
    startDate?: string;
    endDate?: string;
    format?: "json" | "html";
  }): Promise<GenerateAttendanceReportResponse> {
    try {
      if (!window.backendAPI?.attendance) {
        throw new Error("Electron API (attendance) not available");
      }

      const response = await window.backendAPI.attendance({
        method: "generateAttendanceReport",
        params: params || {},
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to generate attendance report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate attendance report");
    }
  }

  // --------------------------------------------------------------------
  // 🧰 UTILITY METHODS
  // --------------------------------------------------------------------

  /**
   * Check if an employee has attendance logs in a given date range.
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
      console.error("Error checking attendance logs:", error);
      return false;
    }
  }

  /**
   * Get the latest attendance log for an employee.
   * @param employeeId - Employee ID
   */
  async getLatestEntry(employeeId: number): Promise<AttendanceLogEntry | null> {
    try {
      const response = await this.getAll({
        employeeId,
        limit: 1,
        page: 1,
      });
      return response.data?.[0] || null;
    } catch (error) {
      console.error("Error fetching latest attendance entry:", error);
      return null;
    }
  }

  /**
   * Validate if the backend API is available.
   */
  async isAvailable(): Promise<boolean> {
    return !!(window.backendAPI?.attendance);
  }
}

// ----------------------------------------------------------------------
// 📤 Export singleton instance
// ----------------------------------------------------------------------

const attendanceLogAPI = new AttendanceLogAPI();
export default attendanceLogAPI;
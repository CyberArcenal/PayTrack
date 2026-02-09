// overtimeAPI.ts - Comprehensive Overtime Management API
export interface OvertimeLogData {
  id: number;
  employeeId: number;
  payrollRecordId: number | null;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  hours: number;
  rate: number;
  amount: number;
  type: string; // 'regular', 'holiday', 'special-holiday', 'rest-day'
  approvedBy: string | null;
  approvalStatus: "pending" | "approved" | "rejected";
  note: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    employeeNumber: string;
    department: string;
    hourlyRate: number;
  };
}

export interface OvertimeFilters {
  employeeId?: number;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  type?: string;
  department?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  order?: "ASC" | "DESC";
  [key: string]: any;
}

export interface OvertimeReportData {
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  logs: OvertimeLogData[];
  summary: {
    totalLogs: number;
    totalHours: number;
    totalAmount: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byDepartment: Record<string, number>;
  };
  dailyBreakdown?: Array<{
    date: string;
    totalHours: number;
    totalAmount: number;
    employeeCount: number;
    logs: OvertimeLogData[];
  }>;
  employeeBreakdown?: Array<{
    employeeId: number;
    employeeName: string;
    employeeNumber: string;
    department: string;
    totalHours: number;
    totalAmount: number;
    logs: OvertimeLogData[];
  }>;
  departmentBreakdown?: Array<{
    department: string;
    totalHours: number;
    totalAmount: number;
    employeeCount: number;
  }>;
}

export interface OvertimeCalculationResult {
  hours: number;
  minutes: number;
  totalMinutes: number;
  formatted: string;
}

export interface OvertimeAmountCalculation {
  baseAmount: number;
  overtimePremium: number;
  totalAmount: number;
  hourlyRate: number;
  hours: number;
  appliedRate: number;
  rateMultiplier: number;
  type: string;
  calculation: string;
}

export interface OverlapCheckResult {
  message: any;
  hasOverlap: boolean;
  overlappingLogs: Array<{
    id: number;
    startTime: string;
    endTime: string;
    overlapMinutes: number;
  }>;
  count: number;
}

export interface OvertimeValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface OvertimeDuplicateCheck {
  isDuplicate: boolean;
  message: string;
  duplicateLog?: OvertimeLogData | null;
  existingLogs?: OvertimeLogData[];
  count?: number;
}

export interface OvertimeType {
  type: string;
  name: string;
  description: string;
  defaultRate: number;
  minRate: number;
  maxRate: number;
  category: string;
  requiresApproval: boolean;
  taxable: boolean;
}

export interface OvertimeStatusInfo {
  value: string;
  label: string;
  description: string;
  color: string;
  icon: string;
  canEdit: boolean;
  canDelete: boolean;
  count: number;
  totalHours: number;
  totalAmount: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number | null;
  offset: number;
  page?: number;
  totalPages?: number;
}

// Response Interfaces
export interface OvertimeResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
}

export interface OvertimeListResponse extends OvertimeResponse<
  PaginatedResponse<OvertimeLogData>
> {}
export interface OvertimeSingleResponse extends OvertimeResponse<OvertimeLogData> {}
export interface OvertimeReportResponse extends OvertimeResponse<OvertimeReportData> {}
export interface OvertimeCalculationResponse extends OvertimeResponse<OvertimeCalculationResult> {}
export interface OvertimeAmountResponse extends OvertimeResponse<OvertimeAmountCalculation> {}
export interface OverlapCheckResponse extends OvertimeResponse<OverlapCheckResult> {}
export interface ValidationResponse extends OvertimeResponse<OvertimeValidationResult> {}
export interface DuplicateCheckResponse extends OvertimeResponse<OvertimeDuplicateCheck> {}
export interface OvertimeTypesResponse extends OvertimeResponse<{
  types: OvertimeType[];
  categories: string[];
  total: number;
  defaultType: string;
}> {}
export interface OvertimeStatusesResponse extends OvertimeResponse<{
  statuses: OvertimeStatusInfo[];
  totals: {
    totalCount: number;
    totalHours: number;
    totalAmount: number;
  };
  summary: {
    pendingApproval: number;
    approvedThisMonth: number;
    rejectionRate: number;
  };
}> {}

class OvertimeAPI {
  private async callOvertimeAPI<T>(
    method: string,
    params: Record<string, any> = {},
  ): Promise<OvertimeResponse<T>> {
    try {
      if (!window.backendAPI || !window.backendAPI.overtime) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.overtime({
        method,
        params,
      });

      if (response.status) {
        return response as OvertimeResponse<T>;
      }

      throw new Error(response.message || `Failed to execute ${method}`);
    } catch (error: any) {
      console.error(`OvertimeAPI.${method} error:`, error);
      throw new Error(error.message || `Failed to execute ${method}`);
    }
  }

  // 📋 BASIC OVERTIME OPERATIONS

  /** Get all overtime logs with optional filters */
  async getAllOvertimeLogs(
    filters?: OvertimeFilters,
  ): Promise<OvertimeListResponse> {
    return this.callOvertimeAPI("getAllOvertimeLogs", { filters });
  }

  /** Get overtime log by ID */
  async getOvertimeLogById(id: number): Promise<OvertimeSingleResponse> {
    return this.callOvertimeAPI("getOvertimeLogById", { id });
  }

  /** Get overtime logs by employee ID */
  async getOvertimeLogsByEmployee(
    employeeId: number,
    dateRange?: { startDate?: string; endDate?: string },
  ): Promise<OvertimeListResponse> {
    return this.callOvertimeAPI("getOvertimeLogsByEmployee", {
      employeeId,
      dateRange,
    });
  }

  /** Get overtime logs by specific date */
  async getOvertimeLogsByDate(
    date: string,
    filters?: OvertimeFilters,
  ): Promise<OvertimeListResponse> {
    return this.callOvertimeAPI("getOvertimeLogsByDate", { date, filters });
  }

  /** Get overtime logs by date range */
  async getOvertimeLogsByDateRange(
    startDate: string,
    endDate: string,
    filters?: OvertimeFilters,
  ): Promise<OvertimeListResponse> {
    return this.callOvertimeAPI("getOvertimeLogsByDateRange", {
      startDate,
      endDate,
      filters,
    });
  }

  /** Get overtime logs by approval status */
  async getOvertimeLogsByStatus(
    status: string,
    filters?: OvertimeFilters,
  ): Promise<OvertimeListResponse> {
    return this.callOvertimeAPI("getOvertimeLogsByStatus", { status, filters });
  }

  /** Get pending overtime logs awaiting approval */
  async getPendingOvertimeLogs(
    filters?: OvertimeFilters,
  ): Promise<OvertimeListResponse> {
    return this.callOvertimeAPI("getPendingOvertimeLogs", { filters });
  }

  /** Get approved overtime logs */
  async getApprovedOvertimeLogs(
    dateRange?: { startDate?: string; endDate?: string },
    filters?: OvertimeFilters,
  ): Promise<OvertimeListResponse> {
    return this.callOvertimeAPI("getApprovedOvertimeLogs", {
      dateRange,
      filters,
    });
  }

  /** Get rejected overtime logs */
  async getRejectedOvertimeLogs(
    dateRange?: { startDate?: string; endDate?: string },
    filters?: OvertimeFilters,
  ): Promise<OvertimeListResponse> {
    return this.callOvertimeAPI("getRejectedOvertimeLogs", {
      dateRange,
      filters,
    });
  }

  // ✏️ WRITE OPERATIONS

  /** Create a new overtime log */
  async createOvertimeLog(data: {
    employeeId: number;
    date: string;
    startTime: string;
    endTime: string;
    hours: number;
    rate?: number;
    type?: string;
    note?: string;
  }): Promise<OvertimeSingleResponse> {
    return this.callOvertimeAPI("createOvertimeLog", data);
  }

  /** Update an existing overtime log */
  async updateOvertimeLog(
    id: number,
    data: Partial<{
      employeeId: number;
      date: string;
      startTime: string;
      endTime: string;
      hours: number;
      rate: number;
      type: string;
      note: string;
    }>,
  ): Promise<OvertimeSingleResponse> {
    return this.callOvertimeAPI("updateOvertimeLog", { id, ...data });
  }

  /** Delete an overtime log */
  async deleteOvertimeLog(
    id: number,
  ): Promise<OvertimeResponse<{ id: number }>> {
    return this.callOvertimeAPI("deleteOvertimeLog", { id });
  }

  /** Approve an overtime log */
  async approveOvertime(
    id: number,
    approvedBy: string,
    note?: string,
  ): Promise<OvertimeSingleResponse> {
    return this.callOvertimeAPI("approveOvertime", { id, approvedBy, note });
  }

  /** Reject an overtime log */
  async rejectOvertime(
    id: number,
    rejectedBy: string,
    reason: string,
  ): Promise<OvertimeSingleResponse> {
    return this.callOvertimeAPI("rejectOvertime", { id, rejectedBy, reason });
  }

  /** Update overtime hours */
  async updateOvertimeHours(
    id: number,
    hours: number,
    recalculateAmount: boolean = true,
  ): Promise<OvertimeSingleResponse> {
    return this.callOvertimeAPI("updateOvertimeHours", {
      id,
      hours,
      recalculateAmount,
    });
  }

  /** Update overtime rate */
  async updateOvertimeRate(
    id: number,
    rate: number,
    recalculateAmount: boolean = true,
  ): Promise<OvertimeSingleResponse> {
    return this.callOvertimeAPI("updateOvertimeRate", {
      id,
      rate,
      recalculateAmount,
    });
  }

  /** Recalculate overtime amount */
  async recalculateOvertimeAmount(id: number): Promise<OvertimeSingleResponse> {
    return this.callOvertimeAPI("recalculateOvertimeAmount", { id });
  }

  // 📊 REPORTS

  /** Generate comprehensive overtime report */
  async getOvertimeReport(
    dateRange?: { startDate?: string; endDate?: string },
    filters?: OvertimeFilters,
  ): Promise<OvertimeReportResponse> {
    return this.callOvertimeAPI("getOvertimeReport", { dateRange, filters });
  }

  /** Generate daily overtime report */
  async getDailyOvertimeReport(
    date?: string,
    filters?: OvertimeFilters,
  ): Promise<OvertimeReportResponse> {
    return this.callOvertimeAPI("getDailyOvertimeReport", { date, filters });
  }

  /** Generate monthly overtime report */
  async getMonthlyOvertimeReport(
    year?: number,
    month?: number,
    filters?: OvertimeFilters,
  ): Promise<OvertimeReportResponse> {
    return this.callOvertimeAPI("getMonthlyOvertimeReport", {
      year,
      month,
      filters,
    });
  }

  // ⏰ OVERTIME CALCULATION

  /** Calculate overtime hours between start and end times */
  async calculateOvertimeHours(
    startTime: string,
    endTime: string,
    breakHours: number = 0,
  ): Promise<OvertimeCalculationResponse> {
    return this.callOvertimeAPI("calculateOvertimeHours", {
      startTime,
      endTime,
      breakHours,
    });
  }

  /** Calculate overtime amount */
  async calculateOvertimeAmount(
    hours: number,
    hourlyRate: number,
    overtimeRate: number,
    type: string = "regular",
  ): Promise<OvertimeAmountResponse> {
    return this.callOvertimeAPI("calculateOvertimeAmount", {
      hours,
      hourlyRate,
      overtimeRate,
      type,
    });
  }

  /** Check for overlapping overtime logs */
  async checkOvertimeOverlap(
    employeeId: number,
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: number,
  ): Promise<OverlapCheckResponse> {
    return this.callOvertimeAPI("checkOvertimeOverlap", {
      employeeId,
      date,
      startTime,
      endTime,
      excludeId,
    });
  }

  // ⚙️ VALIDATION & UTILITY

  /** Validate overtime data */
  async validateOvertimeData(data: any): Promise<ValidationResponse> {
    return this.callOvertimeAPI("validateOvertimeData", data);
  }

  /** Check for duplicate overtime */
  async checkDuplicateOvertime(data: {
    employeeId: number;
    date: string;
    startTime?: string;
    endTime?: string;
  }): Promise<DuplicateCheckResponse> {
    return this.callOvertimeAPI("checkDuplicateOvertime", data);
  }

  /** Get available overtime types */
  async getOvertimeTypes(category?: string): Promise<OvertimeTypesResponse> {
    return this.callOvertimeAPI("getOvertimeTypes", { category });
  }

  /** Get overtime approval statuses with counts */
  async getOvertimeStatuses(): Promise<OvertimeStatusesResponse> {
    return this.callOvertimeAPI("getOvertimeStatuses", {});
  }

  // 🛠️ UTILITY METHODS

  /** Get employee's overtime summary */
  async getEmployeeOvertimeSummary(
    employeeId: number,
    dateRange?: { startDate?: string; endDate?: string },
  ) {
    try {
      const response = await this.getOvertimeLogsByEmployee(
        employeeId,
        dateRange,
      );
      if (!response.status) {
        throw new Error(response.message);
      }

      const logs = response.data.data;
      const summary = logs.reduce(
        (acc, log) => {
          acc.totalHours += log.hours || 0;
          acc.totalAmount += log.amount || 0;
          acc[log.approvalStatus] = (acc[log.approvalStatus] || 0) + 1;
          acc.byType[log.type] = (acc.byType[log.type] || 0) + 1;
          return acc;
        },
        {
          totalHours: 0,
          totalAmount: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          byType: {} as Record<string, number>,
        },
      );

      return {
        status: true,
        message: "Employee overtime summary retrieved",
        data: {
          employeeId,
          logs,
          summary,
          totalLogs: logs.length,
          dateRange,
        },
      };
    } catch (error: any) {
      return {
        status: false,
        message: error.message || "Failed to get employee overtime summary",
        data: null,
      };
    }
  }

  /** Get department overtime summary */
  async getDepartmentOvertimeSummary(
    department: string,
    dateRange?: { startDate?: string; endDate?: string },
  ) {
    try {
      const response = await this.getOvertimeReport(dateRange, { department });
      if (!response.status) {
        throw new Error(response.message);
      }

      return {
        status: true,
        message: "Department overtime summary retrieved",
        data: {
          department,
          summary: response.data.summary,
          departmentBreakdown: response.data.departmentBreakdown?.find(
            (d) => d.department === department,
          ),
          dateRange,
        },
      };
    } catch (error: any) {
      return {
        status: false,
        message: error.message || "Failed to get department overtime summary",
        data: null,
      };
    }
  }

  /** Calculate overtime cost for payroll period */
  async calculatePayrollOvertimeCost(
    employeeId: number,
    periodStart: string,
    periodEnd: string,
  ) {
    try {
      const response = await this.getOvertimeLogsByDateRange(
        periodStart,
        periodEnd,
        {
          employeeId,
          status: "approved",
        },
      );

      if (!response.status) {
        throw new Error(response.message);
      }

      const logs = response.data.data;
      const totalCost = logs.reduce((sum, log) => sum + (log.amount || 0), 0);
      const totalHours = logs.reduce((sum, log) => sum + (log.hours || 0), 0);

      return {
        status: true,
        message: "Payroll overtime cost calculated",
        data: {
          employeeId,
          periodStart,
          periodEnd,
          totalCost,
          totalHours,
          logsCount: logs.length,
          averageHourlyCost: totalHours > 0 ? totalCost / totalHours : 0,
          breakdownByType: logs.reduce(
            (acc, log) => {
              acc[log.type] = (acc[log.type] || 0) + (log.amount || 0);
              return acc;
            },
            {} as Record<string, number>,
          ),
        },
      };
    } catch (error: any) {
      return {
        status: false,
        message: error.message || "Failed to calculate payroll overtime cost",
        data: null,
      };
    }
  }

  /** Bulk approve overtime logs */
  async bulkApproveOvertime(
    logIds: number[],
    approvedBy: string,
    note?: string,
  ) {
    try {
      const results = await Promise.allSettled(
        logIds.map((id) => this.approveOvertime(id, approvedBy, note)),
      );

      const approved: number[] = [];
      const failed: Array<{ id: number; error: string }> = [];

      results.forEach((result, index) => {
        const id = logIds[index];
        if (result.status === "fulfilled" && result.value.status) {
          approved.push(id);
        } else {
          const error =
            result.status === "rejected"
              ? result.reason?.message || "Unknown error"
              : result.value?.message || "Unknown error";
          failed.push({ id, error });
        }
      });

      return {
        status: true,
        message: "Bulk approve completed",
        data: {
          total: logIds.length,
          approved: approved.length,
          failed: failed.length,
          approvedIds: approved,
          failedLogs: failed,
        },
      };
    } catch (error: any) {
      return {
        status: false,
        message: error.message || "Failed to bulk approve overtime logs",
        data: null,
      };
    }
  }

  /** Bulk reject overtime logs */
  async bulkRejectOvertime(
    logIds: number[],
    rejectedBy: string,
    reason: string,
  ) {
    try {
      const results = await Promise.allSettled(
        logIds.map((id) => this.rejectOvertime(id, rejectedBy, reason)),
      );

      const rejected: number[] = [];
      const failed: Array<{ id: number; error: string }> = [];

      results.forEach((result, index) => {
        const id = logIds[index];
        if (result.status === "fulfilled" && result.value.status) {
          rejected.push(id);
        } else {
          const error =
            result.status === "rejected"
              ? result.reason?.message || "Unknown error"
              : result.value?.message || "Unknown error";
          failed.push({ id, error });
        }
      });

      return {
        status: true,
        message: "Bulk reject completed",
        data: {
          total: logIds.length,
          rejected: rejected.length,
          failed: failed.length,
          rejectedIds: rejected,
          failedLogs: failed,
        },
      };
    } catch (error: any) {
      return {
        status: false,
        message: error.message || "Failed to bulk reject overtime logs",
        data: null,
      };
    }
  }

  /** Validate and create overtime log with comprehensive checks */
  async validateAndCreateOvertimeLog(data: {
    employeeId: number;
    date: string;
    startTime: string;
    endTime: string;
    hours: number;
    rate?: number;
    type?: string;
    note?: string;
  }) {
    try {
      // Step 1: Validate data format
      const validation = await this.validateOvertimeData(data);
      if (!validation.data.isValid) {
        return {
          status: false,
          message: "Validation failed",
          data: { errors: validation.data.errors },
        };
      }

      // Step 2: Check for duplicates
      const duplicateCheck = await this.checkDuplicateOvertime({
        employeeId: data.employeeId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
      });

      if (duplicateCheck.data.isDuplicate) {
        return {
          status: false,
          message: duplicateCheck.data.message,
          data: { duplicateLog: duplicateCheck.data.duplicateLog },
        };
      }

      // Step 3: Check for time overlap
      const overlapCheck = await this.checkOvertimeOverlap(
        data.employeeId,
        data.date,
        data.startTime,
        data.endTime,
      );

      if (overlapCheck.data.hasOverlap) {
        return {
          status: false,
          message: overlapCheck.data.message,
          data: { overlappingLogs: overlapCheck.data.overlappingLogs },
        };
      }

      // Step 4: Create the overtime log
      return await this.createOvertimeLog(data);
    } catch (error: any) {
      return {
        status: false,
        message: error.message || "Failed to validate and create overtime log",
        data: null,
      };
    }
  }

  /** Get pending approval count */
  async getPendingApprovalCount(): Promise<number> {
    try {
      const response = await this.getPendingOvertimeLogs({ limit: 1 });
      return response.data.total || 0;
    } catch (error) {
      console.error("Error getting pending approval count:", error);
      return 0;
    }
  }

  /** Get overtime trends for the last N days */
  async getOvertimeTrends(days: number = 30) {
    try {
      const endDate = new Date().toISOString().split("T")[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split("T")[0];

      const response = await this.getOvertimeReport(
        { startDate: startDateStr, endDate },
        { status: "approved" },
      );

      if (!response.status) {
        throw new Error(response.message);
      }

      // Process daily trends
      const dailyTrends =
        response.data.dailyBreakdown?.map((day) => ({
          date: day.date,
          hours: day.totalHours,
          amount: day.totalAmount,
          employeeCount: day.employeeCount,
        })) || [];

      return {
        status: true,
        message: "Overtime trends retrieved",
        data: {
          period: { startDate: startDateStr, endDate },
          days,
          dailyTrends,
          totalHours: response.data.summary.totalHours,
          totalAmount: response.data.summary.totalAmount,
          averageDailyHours: response.data.summary.totalHours / days,
          averageDailyAmount: response.data.summary.totalAmount / days,
        },
      };
    } catch (error: any) {
      return {
        status: false,
        message: error.message || "Failed to get overtime trends",
        data: null,
      };
    }
  }

  // 📅 CONVENIENCE METHODS

  /** Get today's overtime logs */
  async getTodaysOvertimeLogs(filters?: OvertimeFilters) {
    const today = new Date().toISOString().split("T")[0];
    return this.getOvertimeLogsByDate(today, filters);
  }

  /** Get this week's overtime logs */
  async getThisWeeksOvertimeLogs(filters?: OvertimeFilters) {
    const today = new Date();
    const firstDay = new Date(today);
    firstDay.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    const lastDay = new Date(today);
    lastDay.setDate(today.getDate() + (6 - today.getDay())); // End of week (Saturday)

    return this.getOvertimeLogsByDateRange(
      firstDay.toISOString().split("T")[0],
      lastDay.toISOString().split("T")[0],
      filters,
    );
  }

  /** Get this month's overtime logs */
  async getThisMonthsOvertimeLogs(filters?: OvertimeFilters) {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return this.getOvertimeLogsByDateRange(
      firstDay.toISOString().split("T")[0],
      lastDay.toISOString().split("T")[0],
      filters,
    );
  }

  /** Check if employee has pending overtime */
  async hasPendingOvertime(employeeId: number): Promise<boolean> {
    try {
      const response = await this.getOvertimeLogsByStatus("pending", {
        employeeId,
        limit: 1,
      });
      return (response.data.total || 0) > 0;
    } catch (error) {
      console.error("Error checking pending overtime:", error);
      return false;
    }
  }

  /** Get total overtime hours for employee in period */
  async getEmployeeOvertimeHours(
    employeeId: number,
    startDate: string,
    endDate: string,
  ): Promise<number> {
    try {
      const response = await this.getOvertimeLogsByDateRange(
        startDate,
        endDate,
        {
          employeeId,
          status: "approved",
        },
      );
      return response.data.data.reduce((sum, log) => sum + (log.hours || 0), 0);
    } catch (error) {
      console.error("Error getting employee overtime hours:", error);
      return 0;
    }
  }
}

// Singleton instance
const overtimeAPI = new OvertimeAPI();

export default overtimeAPI;

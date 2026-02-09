// attendance.ts placeholder
export interface AttendanceLogData {
  id: number;
  employeeId: number;
  timestamp: string;
  source: string;
  status: string;
  hoursWorked: number;
  overtimeHours: number;
  lateMinutes: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: number;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    department?: string;
    position?: string;
  };
  payrollRecordId?: number;
}

export interface OvertimeLogData {
  id: number;
  employeeId: number;
  payrollRecordId?: number;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  rate: number;
  amount: number;
  type: string;
  approvedBy?: string;
  approvalStatus: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  employee?: {
    id: number;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    department?: string;
    position?: string;
  };
}

export interface AttendanceSummaryData {
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  totalRecords: number;
  totalHours: number;
  totalOvertime: number;
  totalLateMinutes: number;
  totalEmployees: number;
  statusDistribution: Record<string, number>;
  sourceDistribution: Record<string, number>;
  dailySummary?: Array<{
    date: string;
    total: number;
    byStatus: Record<string, number>;
    totalHours: number;
    overtimeHours: number;
  }>;
}

export interface AttendanceReportData {
  reportDate: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  filters?: any;
  summary: {
    reportPeriod: string;
    totalDays: number;
    totalActiveEmployees: number;
    overallAttendanceRate: number;
    totalHoursWorked: number;
    totalOvertimeHours: number;
    attendanceDistribution: Record<string, number>;
  };
  departmentStatistics: Record<string, any>;
  employeeReports: Array<any>;
  dailyAttendance: Array<{
    date: string;
    presentCount: number;
    absentCount: number;
  }>;
  topPerformers: Array<any>;
  attendanceConcerns: Array<any>;
}

export interface DailyReportData {
  reportDate: string;
  generatedAt: string;
  filters?: any;
  summary: {
    totalEmployees: number;
    presentEmployees: number;
    attendanceRate: string;
    totalHoursWorked: number;
    totalOvertimeHours: number;
    averageLateMinutes: number;
    statusDistribution: Record<string, number>;
  };
  departmentBreakdown: Record<string, any>;
  detailedReport: Array<{
    employee: any;
    attendance: {
      status: string;
      totalHours: number;
      overtimeHours: number;
      lateMinutes: number;
      logs: AttendanceLogData[];
      clockIn: string | null;
      clockOut: string | null;
    };
  }>;
  lateArrivals: Array<any>;
  absentEmployees: Array<{
    id: number;
    employeeNumber: string;
    name: string;
    department?: string;
  }>;
}

export interface MonthlyReportData {
  reportPeriod: {
    year: number;
    month: number;
    monthName: string;
    dateRange: {
      startDate: string;
      endDate: string;
    };
  };
  generatedAt: string;
  filters?: any;
  summary: {
    totalEmployees: number;
    totalWorkingDays: number;
    totalPresentDays: number;
    overallAttendanceRate: number;
    totalHoursWorked: number;
    totalOvertimeHours: number;
    averageLateMinutes: number;
    attendanceDistribution: Record<string, number>;
    trend: {
      previousMonth: number;
      currentMonth: number;
      percentageChange: number;
    };
  };
  departmentStatistics: Record<string, any>;
  employeeReports: Array<any>;
  dailyAttendanceTrend: Array<{
    date: string;
    dayOfWeek: string;
    presentCount: number;
    absentCount: number;
    attendanceRate: number;
  }>;
  topPerformers: Array<any>;
  attendanceConcerns: Array<any>;
  overtimeAnalysis: Array<any>;
}

export interface EmployeeAttendanceSummaryData {
  employee: {
    id: number;
    employeeNumber: string;
    fullName: string;
    department?: string;
    position?: string;
    hireDate?: string;
    status: string;
    rates: {
      daily: number;
      hourly: number;
      overtime: number;
    };
  };
  dateRange?: {
    startDate: string | null;
    endDate: string | null;
  };
  summary: {
    totalRecords: number;
    workingDays: number;
    presentDays: number;
    absentDays: number;
    attendanceRate: number;
    statusDistribution: Record<string, number>;
    sourceDistribution: Record<string, number>;
    hours: {
      total: number;
      averageDaily: number;
      overtime: number;
    };
    late: {
      count: number;
      totalMinutes: number;
      averageMinutes: number;
    };
  };
  overtimeSummary: {
    totalRecords: number;
    totalHours: number;
    totalAmount: number;
    statusDistribution: Record<string, number>;
    typeDistribution: Record<string, number>;
    approvalRate: number;
  };
  monthlyTrends: Array<{
    month: string;
    present: number;
    late: number;
    absent: number;
    totalHours: number;
    overtimeHours: number;
  }>;
  recentAttendance: Array<{
    id: number;
    date: string;
    time: string;
    status: string;
    hoursWorked: number;
    overtimeHours: number;
    lateMinutes: number;
    source: string;
    note?: string;
  }>;
  recentOvertime: Array<{
    id: number;
    date: string;
    hours: number;
    amount: number;
    type: string;
    approvalStatus: string;
    approvedBy?: string;
  }>;
  metrics: {
    reliabilityScore: number;
    punctualityScore: number;
    productivityScore: number;
  };
  insights: string[];
}

export interface BulkOperationResult {
  successful: Array<{
    employeeId: number;
    employeeNumber?: string;
    name?: string;
    attendanceId?: number;
    timestamp?: string;
    status?: string;
    lateMinutes?: number;
    clockInTime?: string;
    clockOutTime?: string;
    hoursWorked?: number;
    overtimeHours?: number;
    action?: string;
  }>;
  failed: Array<{
    employeeId?: number;
    employeeNumber?: string;
    name?: string;
    error: string;
    attendanceId?: number;
    record?: any;
  }>;
  skipped?: Array<{
    employeeId?: number;
    employeeNumber?: string;
    name?: string;
    reason: string;
    existingId?: number;
  }>;
  notFound?: Array<{
    employeeId: number;
    reason: string;
  }>;
}

export interface CSVImportResult {
  summary: {
    file: string;
    importDate: string;
    totalRows: number;
    validRecords: number;
    existingEmployees: number;
    imported: number;
    skipped: number;
    failed: number;
    validationErrors: number;
    statistics: {
      byStatus: Record<string, number>;
      dateRange?: {
        start: string;
        end: string;
      } | null;
    };
  };
  details: {
    imported: Array<any>;
    skipped: Array<any>;
    failed: Array<any>;
  };
  errors?: Array<{
    row: number;
    error: string;
    data: any;
  }>;
}

export interface CSVExportResult {
  summary: {
    filePath: string;
    fileSize: number;
    recordsExported: number;
    exportDate: string;
    dateRange?: {
      start: string;
      end: string;
    } | null;
    statistics: {
      byStatus: Record<string, number>;
      bySource: Record<string, number>;
      byDepartment: Record<string, number>;
    };
  };
  sampleData?: Array<any>;
  fileInfo: {
    path: string;
    size: number;
    records: number;
  };
}

export interface DeviceSyncResult {
  summary: {
    deviceId: string;
    deviceType: string;
    syncDate: string;
    totalRecords: number;
    synced: number;
    failed: number;
    skipped: number;
    newEmployees: number;
    statistics: {
      clockIns: number;
      clockOuts: number;
      byStatus: Record<string, number>;
    };
  };
  details: BulkOperationResult;
  deviceInfo: {
    id: string;
    type: string;
    location: string;
    timezone: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
  suggestions: Array<{
    field: string;
    suggestion: string;
  }>;
  score: number;
  summary: {
    errors: number;
    warnings: number;
    suggestions: number;
    isValid: boolean;
  };
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateType: "none" | "exact" | "same-day" | "similar";
  analysis: {
    exactDuplicates: Array<{
      id: number;
      timestamp: string;
      status: string;
      source: string;
    }>;
    sameDayDuplicates: Array<{
      id: number;
      timestamp: string;
      status: string;
      source: string;
      timeDifference: number;
    }>;
    similarRecords: Array<{
      id: number;
      timestamp: string;
      status: string;
      source: string;
      timeDifference: number;
    }>;
  };
  statusConflicts?: Array<{
    existingId: number;
    existingStatus: string;
    newStatus: string;
    timestamp: string;
  }>;
  recommendations: Array<{
    severity: "high" | "medium" | "low" | "info";
    message: string;
    actions: string[];
  }>;
}

export interface HoursCalculationResult {
  calculations: {
    totalHours?: number;
    clockIn?: string;
    clockOut?: string;
  };
  breakdown: {
    regularHours?: number;
    overtimeHours?: number;
    lateMinutes?: number;
    lateHours?: number;
    breakHours?: number;
    totalBreakMinutes?: number;
    regularHoursAfterBreak?: number;
    nightHours?: number;
    nightRate?: number;
    overtimeType?: string;
    overtimeRate?: number;
  };
  compliance: {
    isCompliant: boolean;
    violations: Array<{
      rule: string;
      limit?: number;
      actual?: number;
      severity: string;
      message?: string;
      requirement?: string;
    }>;
    checkedRules: number;
  };
  warnings: Array<{
    field: string;
    message: string;
  }>;
  payroll?: {
    regularPay: number;
    overtimePay?: number;
    nightDiffPay?: number;
    totalPay: number;
    hourlyRate: number;
    overtimeRate?: number;
  };
  summary: {
    calculationMethod: "clock-in-out" | "duration";
    totalHours: number;
    effectiveHours: number;
    overtimePercentage: number;
  };
}

export interface ScheduleData {
  employee: {
    id: number;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    department?: string;
    position?: string;
    employmentType: string;
    status: string;
  };
  schedule: {
    type: string;
    description: string;
    workDays: string[];
    startTime: string;
    endTime: string;
    breakDuration: number;
    overtimeEligible: boolean;
    flexible: boolean;
  };
  compliance: {
    compliantDays: number;
    nonCompliantDays: number;
    complianceRate: string;
    details: Array<{
      date: string;
      dayOfWeek: string;
      isWorkDay: boolean;
      expectedStart: string | null;
      expectedEnd: string | null;
      attendanceCount: number;
      status: string;
      firstRecordTime?: string;
      lastRecordTime?: string;
      totalHours?: number;
      lateMinutes?: number;
      isLate?: boolean;
      isCompliant: boolean;
    }>;
    violations: Array<{
      date: string;
      type: string;
      minutes?: number;
      severity: string;
      expected?: number;
      actual?: number;
      hours?: number;
    }>;
  };
  upcoming: Array<{
    date: string;
    dayOfWeek: string;
    isWorkDay: boolean;
    startTime: string | null;
    endTime: string | null;
    breakDuration: number | null;
  }>;
  holidays: Array<any>;
  statistics: {
    totalDaysAnalyzed: number;
    workDays: number;
    nonWorkDays: number;
    daysWithAttendance: number;
    complianceRate: string;
    lateDays: number;
    averageHoursPerDay: number;
    violationCount: number;
    violationTypes: Record<string, number>;
  };
  recommendations: Array<{
    type: string;
    priority: "high" | "medium" | "low";
    message: string;
    action: string;
  }>;
}

// Request Interfaces
export interface AttendanceFilters {
  employeeId?: number;
  status?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  department?: string;
  limit?: number;
  offset?: number;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface OvertimeFilters {
  employeeId?: number;
  approvalStatus?: string;
  overtimeType?: string;
  department?: string;
}

export interface AttendanceReportFilters extends AttendanceFilters {
  includeDetails?: boolean;
  groupBy?: "day" | "week" | "month" | "employee" | "department";
}

export interface CreateAttendanceParams {
  employeeId: number;
  timestamp: string | Date;
  status?: string;
  source?: string;
  hoursWorked?: number | string;
  overtimeHours?: number | string;
  lateMinutes?: number | string;
  note?: string;
}

export interface UpdateAttendanceParams {
  id: number;
  timestamp?: string | Date;
  status?: string;
  source?: string;
  hoursWorked?: number | string;
  overtimeHours?: number | string;
  lateMinutes?: number | string;
  note?: string;
}

export interface DeleteAttendanceParams {
  id: number;
  reason?: string;
}

export interface BulkClockInParams {
  employeeIds: number[];
  timestamp: string | Date;
  source?: string;
  status?: string;
  note?: string;
  calculateLate?: boolean;
}

export interface BulkClockOutParams {
  employeeIds: number[];
  timestamp: string | Date;
  note?: string;
}

export interface UpdateAttendanceStatusParams {
  id: number;
  status: string;
  lateMinutes?: number | string;
  note?: string;
  updatedBy?: string;
}

export interface UpdateHoursWorkedParams {
  id: number;
  hoursWorked?: number | string;
  overtimeHours?: number | string;
  recalculateOvertime?: boolean;
  autoAdjustStatus?: boolean;
  note?: string;
  updatedBy?: string;
}

export interface AddNoteParams {
  id: number;
  note: string;
  addedBy?: string;
}

export interface ApproveOvertimeParams {
  id: number;
  approvalStatus: "approved" | "rejected" | "pending";
  approvedBy?: string;
  note?: string;
  updateAttendance?: boolean;
}

export interface BulkCreateAttendanceParams {
  records: CreateAttendanceParams[];
  skipDuplicates?: boolean;
  overwriteDuplicates?: boolean;
}

export interface ImportCSVParams {
  filePath: string;
  delimiter?: string;
  skipHeaders?: number;
  dateFormat?: string;
  employeeIdField?: string;
  timestampField?: string;
  statusField?: string;
  hoursField?: string;
  overtimeField?: string;
  lateField?: string;
  sourceField?: string;
  noteField?: string;
  stopOnError?: boolean;
  overwriteDuplicates?: boolean;
  batchSize?: number;
  keepRawData?: boolean;
  keepFailedRecords?: boolean;
  createUnknownEmployees?: boolean;
}

export interface ExportCSVParams {
  filePath: string;
  filters?: AttendanceFilters;
  delimiter?: string;
  encoding?: string;
  limit?: number;
  includeAllFields?: boolean;
  includeSample?: boolean;
}

export interface SyncDeviceParams {
  deviceId: string;
  deviceType?: "rfid" | "biometric" | "mobile";
  deviceLocation?: string;
  timezone?: string;
  records: DeviceAttendanceRecord[];
  markAsProcessed?: boolean;
  acknowledgeCallback?: (processedIds: string[]) => Promise<void>;
  createUnknownEmployees?: boolean;
}

export interface DeviceAttendanceRecord {
  employeeCode?: string;
  cardNumber?: string;
  timestamp: string | Date;
  recordId?: string;
}

export interface ValidateAttendanceDataParams {
  data: CreateAttendanceParams | UpdateAttendanceParams;
  checkEmployeeExistence?: boolean;
  checkDuplicates?: boolean;
}

export interface CheckDuplicateParams {
  employeeId: number;
  timestamp: string | Date;
  status?: string;
  timeWindow?: number;
}

export interface CalculateHoursParams {
  clockIn?: string | Date;
  clockOut?: string | Date;
  duration?: number | string;
  standardHoursPerDay?: number;
  standardStartTime?: string;
  hourlyRate?: number | string;
  overtimeRate?: number | string;
  overtimeRules?: {
    dailyOvertimeThreshold?: number;
    nightDiffStart?: string;
    nightDiffEnd?: string;
    nightDiffRate?: number;
    holidayRate?: number;
    restDayRate?: number;
  };
  breaks?: Array<{
    start?: string | Date;
    end?: string | Date;
    duration?: number;
  }>;
  isRestDay?: boolean;
  isHoliday?: boolean;
  complianceRules?: {
    maxDailyHours?: number;
    maxOvertimeHours?: number;
    minRestBetweenShifts?: number;
    nightShiftRestrictions?: boolean;
  };
}

export interface GetScheduleParams {
  employeeId: number;
  startDate?: string;
  endDate?: string;
  days?: number;
}

// Response Interfaces
export interface AttendanceResponse<T = any> {
  status: boolean;
  message: string;
  data: T;
  error?: string;
}

export interface GetAllAttendanceResponse extends AttendanceResponse<{
  logs: AttendanceLogData[];
  total: number;
  count: number;
}> {}

export interface GetAttendanceByIdResponse extends AttendanceResponse<AttendanceLogData> {}

export interface GetAttendanceByEmployeeResponse extends AttendanceResponse<{
  logs: AttendanceLogData[];
  count: number;
  employeeId: number;
}> {}

export interface GetAttendanceByDateResponse extends AttendanceResponse<{
  logs: AttendanceLogData[];
  date: string;
  count: number;
  summary: Record<string, number>;
  totalEmployees: number;
}> {}

export interface GetAttendanceByDateRangeResponse extends AttendanceResponse<{
  logs: AttendanceLogData[];
  dateRange: DateRange;
  count: number;
  dailySummary: Record<string, any>;
  summary: {
    totalDays: number;
    totalRecords: number;
    uniqueEmployees: number;
  };
}> {}

export interface GetAttendanceByStatusResponse extends AttendanceResponse<{
  logs: AttendanceLogData[];
  status: string;
  count: number;
  summary: {
    totalRecords: number;
    uniqueEmployees: number;
    averageHoursWorked: number;
  };
}> {}

export interface GetAttendanceBySourceResponse extends AttendanceResponse<{
  logs: AttendanceLogData[];
  source: string;
  count: number;
  dailyStats: Array<{
    date: string;
    count: number;
    byStatus: Record<string, number>;
  }>;
  summary: {
    totalRecords: number;
    dateRange: { start: string; end: string } | null;
    statusDistribution: Record<string, number>;
  };
}> {}

export interface GetTodaysAttendanceResponse extends AttendanceResponse<{
  logs: AttendanceLogData[];
  date: string;
  summary: {
    totalRecords: number;
    totalActiveEmployees: number;
    presentCount: number;
    absentCount: number;
    statusDistribution: Record<string, number>;
    attendanceRate: string;
  };
  absentEmployees: Array<{
    id: number;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    department?: string;
  }>;
}> {}

export interface GetAttendanceSummaryResponse extends AttendanceResponse<AttendanceSummaryData> {}

export interface GetLateEmployeesResponse extends AttendanceResponse<{
  logs: AttendanceLogData[];
  date: string;
  count: number;
  statistics: {
    totalLateEmployees: number;
    totalLateMinutes: number;
    averageLateMinutes: number;
    byDuration: Record<string, number>;
  };
  summary: {
    totalLateEmployees: number;
    totalLateMinutes: number;
    averageLateMinutes: number;
    lateDistribution: Record<string, number>;
  };
}> {}

export interface GetAbsentEmployeesResponse extends AttendanceResponse<{
  absentEmployees: Array<any>;
  date: string;
  count: number;
  summary: {
    totalActiveEmployees: number;
    presentCount: number;
    onLeaveCount: number;
    absentCount: number;
    absenceRate: string;
  };
  statistics: {
    byDepartment: Record<string, number>;
    frequentAbsentees: Array<any>;
  };
}> {}

export interface GetOvertimeLogsResponse extends AttendanceResponse<{
  logs: OvertimeLogData[];
  dateRange?: DateRange;
  count: number;
  statistics: {
    totalRecords: number;
    totalHours: number;
    totalAmount: number;
    averageHoursPerRecord: number;
    uniqueEmployees: number;
    typeDistribution: Record<string, number>;
    statusDistribution: Record<string, number>;
    approvalRate: number;
    pendingCount: number;
  };
  dailyStats: Array<{
    date: string;
    count: number;
    totalHours: number;
    totalAmount: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }>;
  pendingApprovals: OvertimeLogData[];
}> {}

export interface GetAttendanceReportResponse extends AttendanceResponse<AttendanceReportData> {}

export interface GetDailyAttendanceReportResponse extends AttendanceResponse<DailyReportData> {}

export interface GetMonthlyAttendanceReportResponse extends AttendanceResponse<MonthlyReportData> {}

export interface GetEmployeeAttendanceSummaryResponse extends AttendanceResponse<EmployeeAttendanceSummaryData> {}

export interface CreateAttendanceResponse extends AttendanceResponse<AttendanceLogData> {}

export interface UpdateAttendanceResponse extends AttendanceResponse<AttendanceLogData> {}

export interface DeleteAttendanceResponse extends AttendanceResponse<{
  id: number;
  employeeId: number;
  timestamp: string;
  status: string;
  hoursWorked: number;
  source: string;
}> {}

export interface BulkClockInResponse extends AttendanceResponse<BulkOperationResult> {}

export interface BulkClockOutResponse extends AttendanceResponse<BulkOperationResult> {}

export interface UpdateAttendanceStatusResponse extends AttendanceResponse<AttendanceLogData> {}

export interface UpdateHoursWorkedResponse extends AttendanceResponse<AttendanceLogData> {}

export interface AddNoteResponse extends AttendanceResponse<AttendanceLogData> {}

export interface ApproveOvertimeResponse extends AttendanceResponse<OvertimeLogData> {}

export interface BulkCreateAttendanceResponse extends AttendanceResponse<{
  summary: {
    totalProcessed: number;
    created: number;
    skipped: number;
    failed: number;
  };
  details: BulkOperationResult;
  validationErrors?: Array<{
    index: number;
    error: string;
    record: any;
  }>;
  statistics: {
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
  };
}> {}

export interface ImportCSVResponse extends AttendanceResponse<CSVImportResult> {}

export interface ExportCSVResponse extends AttendanceResponse<CSVExportResult> {}

export interface SyncDeviceResponse extends AttendanceResponse<DeviceSyncResult> {}

export interface ValidateAttendanceDataResponse extends AttendanceResponse<ValidationResult> {}

export interface CheckDuplicateResponse extends AttendanceResponse<DuplicateCheckResult> {}

export interface CalculateHoursResponse extends AttendanceResponse<HoursCalculationResult> {}

export interface GetScheduleResponse extends AttendanceResponse<ScheduleData> {}

export interface AttendancePayload {
  method: string;
  params?: Record<string, any>;
}

class AttendanceAPI {
  // 🔎 Read-only methods
  async getAllAttendanceLogs(
    filters?: AttendanceFilters,
  ): Promise<GetAllAttendanceResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAllAttendanceLogs",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get all attendance logs");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get all attendance logs");
    }
  }

  async getAttendanceLogById(id: number): Promise<GetAttendanceByIdResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAttendanceLogById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get attendance log by ID");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get attendance log by ID");
    }
  }

  async getAttendanceLogsByEmployee(
    employeeId: number,
    dateRange?: DateRange,
  ): Promise<GetAttendanceByEmployeeResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAttendanceLogsByEmployee",
        params: { employeeId, dateRange },
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to get attendance logs by employee",
      );
    } catch (error: any) {
      throw new Error(
        error.message || "Failed to get attendance logs by employee",
      );
    }
  }

  async getAttendanceLogsByDate(
    date: string,
    filters?: AttendanceFilters,
  ): Promise<GetAttendanceByDateResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAttendanceLogsByDate",
        params: { date, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to get attendance logs by date",
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to get attendance logs by date");
    }
  }

  async getAttendanceLogsByDateRange(
    startDate: string,
    endDate: string,
    filters?: AttendanceFilters,
  ): Promise<GetAttendanceByDateRangeResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAttendanceLogsByDateRange",
        params: { startDate, endDate, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to get attendance logs by date range",
      );
    } catch (error: any) {
      throw new Error(
        error.message || "Failed to get attendance logs by date range",
      );
    }
  }

  async getAttendanceLogsByStatus(
    status: string,
    filters?: AttendanceFilters,
  ): Promise<GetAttendanceByStatusResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAttendanceLogsByStatus",
        params: { status, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to get attendance logs by status",
      );
    } catch (error: any) {
      throw new Error(
        error.message || "Failed to get attendance logs by status",
      );
    }
  }

  async getAttendanceLogsBySource(
    source: string,
    filters?: AttendanceFilters,
  ): Promise<GetAttendanceBySourceResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAttendanceLogsBySource",
        params: { source, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to get attendance logs by source",
      );
    } catch (error: any) {
      throw new Error(
        error.message || "Failed to get attendance logs by source",
      );
    }
  }

  async getTodaysAttendance(
    filters?: AttendanceFilters,
  ): Promise<GetTodaysAttendanceResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getTodaysAttendance",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get today's attendance");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get today's attendance");
    }
  }

  async getAttendanceSummary(
    dateRange?: DateRange,
    employeeId?: number,
  ): Promise<GetAttendanceSummaryResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAttendanceSummary",
        params: { dateRange, employeeId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get attendance summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get attendance summary");
    }
  }

  async getLateEmployees(
    date: string,
    filters?: AttendanceFilters,
  ): Promise<GetLateEmployeesResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getLateEmployees",
        params: { date, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get late employees");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get late employees");
    }
  }

  async getAbsentEmployees(
    date: string,
    filters?: AttendanceFilters,
  ): Promise<GetAbsentEmployeesResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAbsentEmployees",
        params: { date, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get absent employees");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get absent employees");
    }
  }

  async getOvertimeLogs(
    dateRange?: DateRange,
    filters?: OvertimeFilters,
  ): Promise<GetOvertimeLogsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getOvertimeLogs",
        params: { dateRange, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get overtime logs");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get overtime logs");
    }
  }

  async getAttendanceReport(
    dateRange: DateRange,
    filters?: AttendanceReportFilters,
  ): Promise<GetAttendanceReportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getAttendanceReport",
        params: { dateRange, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get attendance report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get attendance report");
    }
  }

  async getDailyAttendanceReport(
    date: string,
    filters?: AttendanceReportFilters,
  ): Promise<GetDailyAttendanceReportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getDailyAttendanceReport",
        params: { date, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to get daily attendance report",
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to get daily attendance report");
    }
  }

  async getMonthlyAttendanceReport(
    year: number,
    month: number,
    filters?: AttendanceReportFilters,
  ): Promise<GetMonthlyAttendanceReportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getMonthlyAttendanceReport",
        params: { year, month, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to get monthly attendance report",
      );
    } catch (error: any) {
      throw new Error(
        error.message || "Failed to get monthly attendance report",
      );
    }
  }

  async getEmployeeAttendanceSummary(
    employeeId: number,
    dateRange?: DateRange,
  ): Promise<GetEmployeeAttendanceSummaryResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getEmployeeAttendanceSummary",
        params: { employeeId, dateRange },
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to get employee attendance summary",
      );
    } catch (error: any) {
      throw new Error(
        error.message || "Failed to get employee attendance summary",
      );
    }
  }

  // 🔒 Mutating methods
  async createAttendanceLog(
    params: CreateAttendanceParams,
  ): Promise<CreateAttendanceResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "createAttendanceLog",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to create attendance log");
    } catch (error: any) {
      throw new Error(error.message || "Failed to create attendance log");
    }
  }

  async updateAttendanceLog(
    params: UpdateAttendanceParams,
  ): Promise<UpdateAttendanceResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "updateAttendanceLog",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update attendance log");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update attendance log");
    }
  }

  async deleteAttendanceLog(
    params: DeleteAttendanceParams,
  ): Promise<DeleteAttendanceResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "deleteAttendanceLog",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to delete attendance log");
    } catch (error: any) {
      throw new Error(error.message || "Failed to delete attendance log");
    }
  }

  async bulkClockIn(params: BulkClockInParams): Promise<BulkClockInResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "bulkClockIn",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk clock in");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk clock in");
    }
  }

  async bulkClockOut(
    params: BulkClockOutParams,
  ): Promise<BulkClockOutResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "bulkClockOut",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to bulk clock out");
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk clock out");
    }
  }

  async updateAttendanceStatus(
    params: UpdateAttendanceStatusParams,
  ): Promise<UpdateAttendanceStatusResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "updateAttendanceStatus",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update attendance status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update attendance status");
    }
  }

  async updateHoursWorked(
    params: UpdateHoursWorkedParams,
  ): Promise<UpdateHoursWorkedResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "updateHoursWorked",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update hours worked");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update hours worked");
    }
  }

  async addAttendanceNote(params: AddNoteParams): Promise<AddNoteResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "addAttendanceNote",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to add attendance note");
    } catch (error: any) {
      throw new Error(error.message || "Failed to add attendance note");
    }
  }

  async approveOvertime(
    params: ApproveOvertimeParams,
  ): Promise<ApproveOvertimeResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "approveOvertime",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to approve overtime");
    } catch (error: any) {
      throw new Error(error.message || "Failed to approve overtime");
    }
  }

  async bulkCreateAttendanceLogs(
    params: BulkCreateAttendanceParams,
  ): Promise<BulkCreateAttendanceResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "bulkCreateAttendanceLogs",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to bulk create attendance logs",
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to bulk create attendance logs");
    }
  }

  async importAttendanceFromCSV(
    params: ImportCSVParams,
  ): Promise<ImportCSVResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "importAttendanceFromCSV",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to import attendance from CSV",
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to import attendance from CSV");
    }
  }

  async exportAttendanceToCSV(
    params: ExportCSVParams,
  ): Promise<ExportCSVResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "exportAttendanceToCSV",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to export attendance to CSV");
    } catch (error: any) {
      throw new Error(error.message || "Failed to export attendance to CSV");
    }
  }

  async syncAttendanceFromDevice(
    params: SyncDeviceParams,
  ): Promise<SyncDeviceResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "syncAttendanceFromDevice",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to sync attendance from device",
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to sync attendance from device");
    }
  }

  // ⚙️ Validation & Utility methods
  async validateAttendanceData(
    params: ValidateAttendanceDataParams,
  ): Promise<ValidateAttendanceDataResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "validateAttendanceData",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to validate attendance data");
    } catch (error: any) {
      throw new Error(error.message || "Failed to validate attendance data");
    }
  }

  async checkDuplicateAttendance(
    params: CheckDuplicateParams,
  ): Promise<CheckDuplicateResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "checkDuplicateAttendance",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(
        response.message || "Failed to check duplicate attendance",
      );
    } catch (error: any) {
      throw new Error(error.message || "Failed to check duplicate attendance");
    }
  }

  async calculateHoursWorked(
    params: CalculateHoursParams,
  ): Promise<CalculateHoursResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "calculateHoursWorked",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to calculate hours worked");
    } catch (error: any) {
      throw new Error(error.message || "Failed to calculate hours worked");
    }
  }

  async getEmployeeSchedule(
    params: GetScheduleParams,
  ): Promise<GetScheduleResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.attendance) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.attendance({
        method: "getEmployeeSchedule",
        params,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get employee schedule");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get employee schedule");
    }
  }

  // Utility methods
  async clockIn(
    employeeId: number,
    timestamp?: string | Date,
  ): Promise<CreateAttendanceResponse> {
    try {
      return await this.createAttendanceLog({
        employeeId,
        timestamp: timestamp || new Date().toISOString(),
        status: "present",
        source: "manual",
        hoursWorked: 0,
        overtimeHours: 0,
        lateMinutes: 0,
        note: "Clock in",
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to clock in");
    }
  }

  async clockOut(
    employeeId: number,
    timestamp?: string | Date,
  ): Promise<UpdateAttendanceResponse> {
    try {
      // First, get today's attendance record
      const today = new Date().toISOString().split("T")[0];
      const todayAttendance = await this.getAttendanceLogsByDate(today, {
        employeeId,
      });

      if (
        !todayAttendance.data.logs ||
        todayAttendance.data.logs.length === 0
      ) {
        throw new Error("No clock in record found for today");
      }

      // Find the most recent clock in record (without hours worked)
      const clockInRecord = todayAttendance.data.logs
        .filter((log) => log.hoursWorked === 0)
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )[0];

      if (!clockInRecord) {
        throw new Error("No active clock in record found");
      }

      // Calculate hours worked
      const clockInTime = new Date(clockInRecord.timestamp);
      const clockOutTime = timestamp ? new Date(timestamp) : new Date();
      const hoursWorked =
        (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
      const overtimeHours = Math.max(0, hoursWorked - 8);

      return await this.updateAttendanceLog({
        id: clockInRecord.id,
        hoursWorked: parseFloat(hoursWorked.toFixed(2)),
        overtimeHours: parseFloat(overtimeHours.toFixed(2)),
        note: clockInRecord.note
          ? `${clockInRecord.note}; Clock out`
          : "Clock out",
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to clock out");
    }
  }

  async markAbsent(
    employeeId: number,
    date: string,
    note?: string,
  ): Promise<CreateAttendanceResponse> {
    try {
      return await this.createAttendanceLog({
        employeeId,
        timestamp: `${date}T00:00:00.000Z`,
        status: "absent",
        source: "manual",
        hoursWorked: 0,
        overtimeHours: 0,
        lateMinutes: 0,
        note: note || "Marked absent",
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to mark absent");
    }
  }

  async markLate(
    employeeId: number,
    timestamp: string | Date,
    lateMinutes: number,
    note?: string,
  ): Promise<CreateAttendanceResponse> {
    try {
      return await this.createAttendanceLog({
        employeeId,
        timestamp,
        status: "late",
        source: "manual",
        hoursWorked: 8,
        overtimeHours: 0,
        lateMinutes,
        note: note || `Late by ${lateMinutes} minutes`,
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to mark late");
    }
  }

  async getEmployeeAttendanceRate(
    employeeId: number,
    startDate: string,
    endDate: string,
  ): Promise<number> {
    try {
      const summary = await this.getEmployeeAttendanceSummary(employeeId, {
        startDate,
        endDate,
      });
      return summary.data.summary.attendanceRate || 0;
    } catch (error) {
      console.error("Error getting employee attendance rate:", error);
      return 0;
    }
  }

  async getDepartmentAttendanceSummary(
    department: string,
    dateRange: DateRange,
  ): Promise<AttendanceSummaryData> {
    try {
      const response = await this.getAttendanceSummary(dateRange);
      const departmentData = {
        ...response.data,
        // Filter and calculate department-specific stats
        totalEmployees: 0, // You would need to filter by department
        statusDistribution: {}, // Filter by department
      };
      return departmentData;
    } catch (error) {
      console.error("Error getting department attendance summary:", error);
      throw error;
    }
  }

  async getAttendanceTrend(
    startDate: string,
    endDate: string,
    interval: "daily" | "weekly" | "monthly" = "daily",
  ): Promise<Array<{ date: string; attendanceRate: number }>> {
    try {
      const response = await this.getAttendanceReport({ startDate, endDate });

      if (interval === "daily" && response.data.dailyAttendance) {
        return response.data.dailyAttendance.map((day) => ({
          date: day.date,
          attendanceRate:
            (day.presentCount / (day.presentCount + day.absentCount)) * 100,
        }));
      }

      // For weekly/monthly, you would need to aggregate the data
      return [];
    } catch (error) {
      console.error("Error getting attendance trend:", error);
      return [];
    }
  }

  async checkEmployeeAttendanceCompliance(
    employeeId: number,
    month: number,
    year: number,
  ): Promise<{
    compliant: boolean;
    attendanceRate: number;
    lateCount: number;
    absentCount: number;
    recommendations: string[];
  }> {
    try {
      const summary = await this.getEmployeeAttendanceSummary(employeeId, {
        startDate: `${year}-${month.toString().padStart(2, "0")}-01`,
        endDate: `${year}-${month.toString().padStart(2, "0")}-${new Date(year, month, 0).getDate()}`,
      });

      const data = summary.data;
      const compliant =
        data.metrics.reliabilityScore >= 80 &&
        data.metrics.punctualityScore >= 70 &&
        data.summary.attendanceRate >= 85;

      return {
        compliant,
        attendanceRate: data.summary.attendanceRate,
        lateCount: data.summary.late.count,
        absentCount: data.summary.absentDays,
        recommendations: data.insights,
      };
    } catch (error) {
      console.error("Error checking employee attendance compliance:", error);
      throw error;
    }
  }

  async generateAttendanceCertificate(
    employeeId: number,
    period: { startDate: string; endDate: string },
  ): Promise<{
    employee: any;
    period: { startDate: string; endDate: string };
    attendanceRate: number;
    totalHours: number;
    overtimeHours: number;
    status: "Excellent" | "Good" | "Fair" | "Poor";
  }> {
    try {
      const summary = await this.getEmployeeAttendanceSummary(
        employeeId,
        period,
      );
      const data = summary.data;

      let status: "Excellent" | "Good" | "Fair" | "Poor" = "Fair";
      if (data.summary.attendanceRate >= 95) status = "Excellent";
      else if (data.summary.attendanceRate >= 90) status = "Good";
      else if (data.summary.attendanceRate >= 80) status = "Fair";
      else status = "Poor";

      return {
        employee: data.employee,
        period,
        attendanceRate: data.summary.attendanceRate,
        totalHours: data.summary.hours.total,
        overtimeHours: data.summary.hours.overtime,
        status,
      };
    } catch (error) {
      console.error("Error generating attendance certificate:", error);
      throw error;
    }
  }
}

const attendanceAPI = new AttendanceAPI();

export default attendanceAPI;

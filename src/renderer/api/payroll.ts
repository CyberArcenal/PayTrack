// payroll.ts placeholder
// payrollPeriodAPI.ts
export interface PayrollPeriodData {
  id?: number;
  name: string;
  periodType: 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly';
  startDate: string;
  endDate: string;
  payDate: string;
  workingDays: number;
  status: 'open' | 'processing' | 'locked' | 'closed';
  totalEmployees?: number;
  totalGrossPay?: number;
  totalDeductions?: number;
  totalNetPay?: number;
  lockedAt?: string | null;
  closedAt?: string | null;
}

export interface PayrollPeriodFilters {
  status?: string;
  periodType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PayrollPeriodSummary {
  periodId: number;
  periodName: string;
  startDate: string;
  endDate: string;
  payDate: string;
  status: string;
  totalEmployees: number;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  breakdown: {
    byDepartment: Record<string, { count: number; totalGross: number; totalNet: number }>;
    byPaymentStatus: Record<string, number>;
  };
  averages: {
    grossPay: number;
    netPay: number;
    deductions: number;
  };
}

export interface PayrollPeriodReport {
  type: 'summary' | 'detailed' | 'export';
  generatedAt: string;
  data: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  checks: Array<{
    name: string;
    required: boolean;
    passed: boolean;
    message: string;
  }>;
  summary?: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    errorCount: number;
    warningCount: number;
  };
}

export interface OverlapCheckResult {
  hasOverlap: boolean;
  overlappingPeriods: PayrollPeriodData[];
  overlapCount: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface WorkingDaysResult {
  workingDays: number;
  startDate: string;
  endDate: string;
  excludeHolidays: boolean;
  holidayCount: number;
}

export interface PeriodNameResult {
  periodName: string;
  alternativeNames: string[];
  periodType: string;
  startDate: string;
  endDate: string;
  suggestedNames: string[];
}

export interface DateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  dates: {
    startDate?: Date;
    endDate?: Date;
    payDate?: Date;
  };
  duration?: {
    days: number;
    weeks: number;
    months: number;
  };
  formattedDates?: {
    startDate: string;
    endDate: string;
    payDate: string;
    startISO: string;
    endISO: string;
    payISO: string;
  };
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicatePeriods: PayrollPeriodData[];
  duplicateCount: number;
  criteria: string[];
}

export interface DataValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validatedData: Record<string, any>;
}

export interface PayrollPeriodResponse {
  status: boolean;
  message: string;
  data: PayrollPeriodData | PayrollPeriodData[] | any;
}

export interface PayrollPeriodsResponse {
  status: boolean;
  message: string;
  data: {
    periods: PayrollPeriodData[];
    total: number;
    limit: number;
    offset: number;
  };
}

export interface PayrollPeriodSummaryResponse {
  status: boolean;
  message: string;
  data: PayrollPeriodSummary;
}

export interface PayrollPeriodReportResponse {
  status: boolean;
  message: string;
  data: PayrollPeriodReport;
}

export interface ValidationResponse {
  status: boolean;
  message: string;
  data: ValidationResult;
}

export interface OverlapCheckResponse {
  status: boolean;
  message: string;
  data: OverlapCheckResult;
}

export interface WorkingDaysResponse {
  status: boolean;
  message: string;
  data: WorkingDaysResult;
}

export interface PeriodNameResponse {
  status: boolean;
  message: string;
  data: PeriodNameResult;
}

export interface DateValidationResponse {
  status: boolean;
  message: string;
  data: DateValidationResult;
}

export interface DuplicateCheckResponse {
  status: boolean;
  message: string;
  data: DuplicateCheckResult;
}

export interface DataValidationResponse {
  status: boolean;
  message: string;
  data: DataValidationResult;
}

export interface CurrentPeriodResponse {
  status: boolean;
  message: string;
  data: PayrollPeriodData;
  isOpen?: boolean;
}

export interface PayrollPeriodPayload {
  method: string;
  params?: Record<string, any>;
}

class PayrollPeriodAPI {
  // 📋 BASIC PAYROLL PERIOD OPERATIONS

  /**
   * Get all payroll periods with optional filters
   */
  async getAll(filters: PayrollPeriodFilters = {}): Promise<PayrollPeriodsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "getAllPayrollPeriods",
        params: { filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get payroll periods");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get payroll periods");
    }
  }

  /**
   * Get payroll period by ID
   */
  async getById(id: number): Promise<PayrollPeriodResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "getPayrollPeriodById",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get payroll period");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get payroll period");
    }
  }

  /**
   * Get payroll periods by date (find period that contains the date)
   */
  async getByDate(date: string, filters: PayrollPeriodFilters = {}): Promise<PayrollPeriodsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "getPayrollPeriodsByDate",
        params: { date, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get payroll periods by date");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get payroll periods by date");
    }
  }

  /**
   * Get payroll periods within a date range
   */
  async getByDateRange(startDate: string, endDate: string, filters: PayrollPeriodFilters = {}): Promise<PayrollPeriodsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "getPayrollPeriodsByDateRange",
        params: { startDate, endDate, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get payroll periods by date range");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get payroll periods by date range");
    }
  }

  /**
   * Get payroll periods by status
   */
  async getByStatus(status: string, filters: PayrollPeriodFilters = {}): Promise<PayrollPeriodsResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "getPayrollPeriodsByStatus",
        params: { status, filters },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get payroll periods by status");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get payroll periods by status");
    }
  }

  /**
   * Get current payroll period (open period that contains current date)
   */
  async getCurrent(date?: string): Promise<CurrentPeriodResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "getCurrentPayrollPeriod",
        params: { date },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get current payroll period");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get current payroll period");
    }
  }

  /**
   * Get payroll period summary with aggregated data
   */
  async getSummary(periodId: number): Promise<PayrollPeriodSummaryResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "getPayrollPeriodSummary",
        params: { periodId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to get payroll period summary");
    } catch (error: any) {
      throw new Error(error.message || "Failed to get payroll period summary");
    }
  }

  // ✏️ WRITE OPERATIONS

  /**
   * Create a new payroll period
   */
  async create(periodData: Partial<PayrollPeriodData>): Promise<PayrollPeriodResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "createPayrollPeriod",
        params: periodData,
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
   * Update an existing payroll period
   */
  async update(id: number, updates: Partial<PayrollPeriodData>): Promise<PayrollPeriodResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "updatePayrollPeriod",
        params: { id, ...updates },
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
   * Delete a payroll period
   */
  async delete(id: number): Promise<PayrollPeriodResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "deletePayrollPeriod",
        params: { id },
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
   * Open a payroll period (set status to open)
   */
  async open(id: number): Promise<PayrollPeriodResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "openPayrollPeriod",
        params: { id },
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
   * Lock a payroll period (set status to locked)
   */
  async lock(id: number): Promise<PayrollPeriodResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "lockPayrollPeriod",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to lock payroll period");
    } catch (error: any) {
      throw new Error(error.message || "Failed to lock payroll period");
    }
  }

  /**
   * Close a payroll period (set status to closed)
   */
  async close(id: number): Promise<PayrollPeriodResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "closePayrollPeriod",
        params: { id },
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
   * Update period dates
   */
  async updateDates(id: number, dates: { startDate?: string; endDate?: string; payDate?: string }): Promise<PayrollPeriodResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "updatePeriodDates",
        params: { id, ...dates },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update period dates");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update period dates");
    }
  }

  /**
   * Update period totals from payroll records
   */
  async updateTotals(id: number): Promise<PayrollPeriodResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "updatePeriodTotals",
        params: { id },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to update period totals");
    } catch (error: any) {
      throw new Error(error.message || "Failed to update period totals");
    }
  }

  // 📊 REPORT OPERATIONS

  /**
   * Generate payroll period report
   */
  async getReport(periodId: number, reportType: 'summary' | 'detailed' | 'export' = 'summary'): Promise<PayrollPeriodReportResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "getPayrollPeriodReport",
        params: { periodId, reportType },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to generate payroll period report");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate payroll period report");
    }
  }

  // 📅 PERIOD MANAGEMENT OPERATIONS

  /**
   * Validate a payroll period for processing
   */
  async validate(periodId: number, validationType: 'process' | 'lock' | 'close' = 'process'): Promise<ValidationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "validatePayrollPeriod",
        params: { periodId, validationType },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to validate payroll period");
    } catch (error: any) {
      throw new Error(error.message || "Failed to validate payroll period");
    }
  }

  /**
   * Check if a date range overlaps with existing payroll periods
   */
  async checkOverlap(startDate: string, endDate: string, excludePeriodId?: number): Promise<OverlapCheckResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "checkPeriodOverlap",
        params: { startDate, endDate, excludePeriodId },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to check period overlap");
    } catch (error: any) {
      throw new Error(error.message || "Failed to check period overlap");
    }
  }

  /**
   * Calculate working days between two dates
   */
  async calculateWorkingDays(startDate: string, endDate: string, excludeHolidays: boolean = false): Promise<WorkingDaysResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "calculateWorkingDays",
        params: { startDate, endDate, excludeHolidays },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to calculate working days");
    } catch (error: any) {
      throw new Error(error.message || "Failed to calculate working days");
    }
  }

  // ⚙️ VALIDATION & UTILITY OPERATIONS

  /**
   * Validate payroll period data
   */
  async validateData(periodData: Partial<PayrollPeriodData>): Promise<DataValidationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "validatePayrollPeriodData",
        params: periodData,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to validate payroll period data");
    } catch (error: any) {
      throw new Error(error.message || "Failed to validate payroll period data");
    }
  }

  /**
   * Check for duplicate payroll period
   */
  async checkDuplicate(periodData: Partial<PayrollPeriodData>): Promise<DuplicateCheckResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "checkDuplicatePeriod",
        params: periodData,
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to check for duplicate period");
    } catch (error: any) {
      throw new Error(error.message || "Failed to check for duplicate period");
    }
  }

  /**
   * Generate a period name based on type and dates
   */
  async generateName(periodType: string, startDate: string, endDate: string): Promise<PeriodNameResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "generatePeriodName",
        params: { periodType, startDate, endDate },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to generate period name");
    } catch (error: any) {
      throw new Error(error.message || "Failed to generate period name");
    }
  }

  /**
   * Validate period dates
   */
  async validateDates(startDate: string, endDate: string, payDate: string): Promise<DateValidationResponse> {
    try {
      if (!window.backendAPI || !window.backendAPI.payrollPeriod) {
        throw new Error("Electron API not available");
      }

      const response = await window.backendAPI.payrollPeriod({
        method: "validatePeriodDates",
        params: { startDate, endDate, payDate },
      });

      if (response.status) {
        return response;
      }
      throw new Error(response.message || "Failed to validate period dates");
    } catch (error: any) {
      throw new Error(error.message || "Failed to validate period dates");
    }
  }

  // 🔧 UTILITY METHODS

  /**
   * Get open payroll periods
   */
  async getOpenPeriods(filters: PayrollPeriodFilters = {}): Promise<PayrollPeriodsResponse> {
    return this.getByStatus('open', filters);
  }

  /**
   * Get locked payroll periods
   */
  async getLockedPeriods(filters: PayrollPeriodFilters = {}): Promise<PayrollPeriodsResponse> {
    return this.getByStatus('locked', filters);
  }

  /**
   * Get closed payroll periods
   */
  async getClosedPeriods(filters: PayrollPeriodFilters = {}): Promise<PayrollPeriodsResponse> {
    return this.getByStatus('closed', filters);
  }

  /**
   * Check if a period exists for a specific date
   */
  async periodExistsForDate(date: string): Promise<boolean> {
    try {
      const response = await this.getByDate(date);
      return response.data.periods.length > 0;
    } catch (error) {
      console.error("Error checking if period exists for date:", error);
      return false;
    }
  }

  /**
   * Get the latest payroll period
   */
  async getLatest(filters: PayrollPeriodFilters = {}): Promise<PayrollPeriodData | null> {
    try {
      const response = await this.getAll({
        ...filters,
        sortBy: 'startDate',
        sortOrder: 'DESC',
        limit: 1
      });
      
      return response.data.periods.length > 0 ? response.data.periods[0] : null;
    } catch (error) {
      console.error("Error getting latest payroll period:", error);
      return null;
    }
  }

  /**
   * Check if a period can be processed
   */
  async canProcess(periodId: number): Promise<boolean> {
    try {
      const validation = await this.validate(periodId, 'process');
      return validation.data.isValid;
    } catch (error) {
      console.error("Error checking if period can be processed:", error);
      return false;
    }
  }

  /**
   * Check if a period can be locked
   */
  async canLock(periodId: number): Promise<boolean> {
    try {
      const validation = await this.validate(periodId, 'lock');
      return validation.data.isValid;
    } catch (error) {
      console.error("Error checking if period can be locked:", error);
      return false;
    }
  }

  /**
   * Check if a period can be closed
   */
  async canClose(periodId: number): Promise<boolean> {
    try {
      const validation = await this.validate(periodId, 'close');
      return validation.data.isValid;
    } catch (error) {
      console.error("Error checking if period can be closed:", error);
      return false;
    }
  }

  /**
   * Get period status
   */
  async getStatus(periodId: number): Promise<string | null> {
    try {
      const response = await this.getById(periodId);
      return response.data.status;
    } catch (error) {
      console.error("Error getting period status:", error);
      return null;
    }
  }

  /**
   * Check if period is open
   */
  async isOpen(periodId: number): Promise<boolean> {
    try {
      const status = await this.getStatus(periodId);
      return status === 'open';
    } catch (error) {
      console.error("Error checking if period is open:", error);
      return false;
    }
  }

  /**
   * Check if period is locked
   */
  async isLocked(periodId: number): Promise<boolean> {
    try {
      const status = await this.getStatus(periodId);
      return status === 'locked';
    } catch (error) {
      console.error("Error checking if period is locked:", error);
      return false;
    }
  }

  /**
   * Check if period is closed
   */
  async isClosed(periodId: number): Promise<boolean> {
    try {
      const status = await this.getStatus(periodId);
      return status === 'closed';
    } catch (error) {
      console.error("Error checking if period is closed:", error);
      return false;
    }
  }

  /**
   * Validate and create payroll period with proper error handling
   */
  async validateAndCreate(periodData: Partial<PayrollPeriodData>): Promise<PayrollPeriodResponse> {
    try {
      // Validate data first
      const validation = await this.validateData(periodData);
      
      if (!validation.data.isValid) {
        return {
          status: false,
          message: "Data validation failed",
          data: {
            ...periodData,
            validationErrors: validation.data.errors
          }
        };
      }

      // Check for duplicates
      const duplicateCheck = await this.checkDuplicate(periodData);
      
      if (duplicateCheck.data.isDuplicate) {
        return {
          status: false,
          message: "Duplicate period found",
          data: {
            ...periodData,
            duplicatePeriods: duplicateCheck.data.duplicatePeriods
          }
        };
      }

      // Check for overlap
      if (periodData.startDate && periodData.endDate) {
        const overlapCheck = await this.checkOverlap(periodData.startDate, periodData.endDate);
        
        if (overlapCheck.data.hasOverlap) {
          return {
            status: false,
            message: "Period overlaps with existing period",
            data: {
              ...periodData,
              overlappingPeriods: overlapCheck.data.overlappingPeriods
            }
          };
        }
      }

      // Validate dates
      if (periodData.startDate && periodData.endDate && periodData.payDate) {
        const dateValidation = await this.validateDates(
          periodData.startDate,
          periodData.endDate,
          periodData.payDate
        );
        
        if (!dateValidation.data.isValid) {
          return {
            status: false,
            message: "Date validation failed",
            data: {
              ...periodData,
              dateValidationErrors: dateValidation.data.errors
            }
          };
        }
      }

      // Generate name if not provided
      if (!periodData.name && periodData.periodType && periodData.startDate && periodData.endDate) {
        const nameResult = await this.generateName(
          periodData.periodType,
          periodData.startDate,
          periodData.endDate
        );
        
        if (nameResult.status) {
          periodData.name = nameResult.data.periodName;
        }
      }

      // Calculate working days if not provided
      if (!periodData.workingDays && periodData.startDate && periodData.endDate) {
        const workingDaysResult = await this.calculateWorkingDays(
          periodData.startDate,
          periodData.endDate
        );
        
        if (workingDaysResult.status) {
          periodData.workingDays = workingDaysResult.data.workingDays;
        }
      }

      // Create the period
      return await this.create(periodData);
    } catch (error: any) {
      return {
        status: false,
        message: error.message || "Failed to validate and create period",
        data: periodData
      };
    }
  }

  /**
   * Get CSV export for a period
   */
  async exportToCSV(periodId: number): Promise<PayrollPeriodReportResponse> {
    return this.getReport(periodId, 'export');
  }

  /**
   * Get detailed report for a period
   */
  async getDetailedReport(periodId: number): Promise<PayrollPeriodReportResponse> {
    return this.getReport(periodId, 'detailed');
  }

  /**
   * Get summary report for a period
   */
  async getSummaryReport(periodId: number): Promise<PayrollPeriodReportResponse> {
    return this.getReport(periodId, 'summary');
  }

  /**
   * Batch update multiple periods
   */
  async batchUpdate(updates: Array<{ id: number; updates: Partial<PayrollPeriodData> }>): Promise<PayrollPeriodResponse[]> {
    const results: PayrollPeriodResponse[] = [];
    
    for (const update of updates) {
      try {
        const result = await this.update(update.id, update.updates);
        results.push(result);
      } catch (error: any) {
        results.push({
          status: false,
          message: error.message || "Failed to update period",
          data: update
        });
      }
    }
    
    return results;
  }

  /**
   * Get periods for a specific month
   */
  async getPeriodsForMonth(year: number, month: number, filters: PayrollPeriodFilters = {}): Promise<PayrollPeriodsResponse> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of month
      
      return await this.getByDateRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        filters
      );
    } catch (error: any) {
      throw new Error(`Failed to get periods for month: ${error.message}`);
    }
  }

  /**
   * Get periods for a specific year
   */
  async getPeriodsForYear(year: number, filters: PayrollPeriodFilters = {}): Promise<PayrollPeriodsResponse> {
    try {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      
      return await this.getByDateRange(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        filters
      );
    } catch (error: any) {
      throw new Error(`Failed to get periods for year: ${error.message}`);
    }
  }
}

const payrollPeriodAPI = new PayrollPeriodAPI();

export default payrollPeriodAPI;
// ===================== dashboard.ipc.js =====================
// src/ipc/handlers/dashboard.ipc.js - Dashboard Management Handler
// @ts-check
const { ipcMain } = require("electron");
const { logger } = require("../../../utils/logger");
const { AppDataSource } = require("../../db/datasource");
const { withErrorHandling } = require("../../../middlewares/errorHandler");

class DashboardHandler {
  constructor() {
    // Initialize all handlers
    this.initializeHandlers();
  }

  initializeHandlers() {
    // 📊 MAIN DASHBOARD HANDLERS
    this.getMainDashboard = this.importHandler("./get/main_dashboard.ipc");
    this.getHRDashboard = this.importHandler("./get/hr_dashboard.ipc");
    this.getPayrollDashboard = this.importHandler("./get/payroll_dashboard.ipc");
    this.getAttendanceDashboard = this.importHandler("./get/attendance_dashboard.ipc");
    this.getExecutiveDashboard = this.importHandler("./get/executive_dashboard.ipc");
    this.getManagerDashboard = this.importHandler("./get/manager_dashboard.ipc");
    this.getEmployeeDashboard = this.importHandler("./get/employee_dashboard.ipc");
    this.getAdminDashboard = this.importHandler("./get/admin_dashboard.ipc");
    this.getRealTimeDashboard = this.importHandler("./get/realtime_dashboard.ipc");

    // 📈 OVERVIEW & SUMMARY HANDLERS
    this.getSystemOverview = this.importHandler("./overview/system_overview.ipc");
    this.getPayrollOverview = this.importHandler("./overview/payroll_overview.ipc");
    this.getAttendanceOverview = this.importHandler("./overview/attendance_overview.ipc");
    this.getEmployeeOverview = this.importHandler("./overview/employee_overview.ipc");
    this.getFinancialOverview = this.importHandler("./overview/financial_overview.ipc");
    this.getComplianceOverview = this.importHandler("./overview/compliance_overview.ipc");
    this.getPerformanceOverview = this.importHandler("./overview/performance_overview.ipc");
    this.getTodayOverview = this.importHandler("./overview/today_overview.ipc");
    this.getMonthlyOverview = this.importHandler("./overview/monthly_overview.ipc");

    // 📊 KPI & METRICS HANDLERS
    this.getKPIMetrics = this.importHandler("./metrics/kpi_metrics.ipc");
    this.getAttendanceMetrics = this.importHandler("./metrics/attendance_metrics.ipc");
    this.getPayrollMetrics = this.importHandler("./metrics/payroll_metrics.ipc");
    this.getHRMetrics = this.importHandler("./metrics/hr_metrics.ipc");
    this.getFinancialMetrics = this.importHandler("./metrics/financial_metrics.ipc");
    this.getComplianceMetrics = this.importHandler("./metrics/compliance_metrics.ipc");
    this.getProductivityMetrics = this.importHandler("./metrics/productivity_metrics.ipc");
    this.getCostMetrics = this.importHandler("./metrics/cost_metrics.ipc");
    this.getTurnoverMetrics = this.importHandler("./metrics/turnover_metrics.ipc");
    this.getHeadcountMetrics = this.importHandler("./metrics/headcount_metrics.ipc");

    // 📅 TIME-BASED ANALYTICS HANDLERS
    this.getDailyAnalytics = this.importHandler("./analytics/daily_analytics.ipc");
    this.getWeeklyAnalytics = this.importHandler("./analytics/weekly_analytics.ipc");
    this.getMonthlyAnalytics = this.importHandler("./analytics/monthly_analytics.ipc");
    this.getQuarterlyAnalytics = this.importHandler("./analytics/quarterly_analytics.ipc");
    this.getYearlyAnalytics = this.importHandler("./analytics/yearly_analytics.ipc");
    this.getPeriodComparison = this.importHandler("./analytics/period_comparison.ipc");
    this.getTrendAnalysis = this.importHandler("./analytics/trend_analysis.ipc");
    this.getSeasonalAnalysis = this.importHandler("./analytics/seasonal_analysis.ipc");
    this.getYTDSummary = this.importHandler("./analytics/ytd_summary.ipc");

    // 👥 EMPLOYEE ANALYTICS HANDLERS
    this.getEmployeeAnalytics = this.importHandler("./employee/employee_analytics.ipc");
    this.getDepartmentAnalytics = this.importHandler("./employee/department_analytics.ipc");
    this.getTeamAnalytics = this.importHandler("./employee/team_analytics.ipc");
    this.getPositionAnalytics = this.importHandler("./employee/position_analytics.ipc");
    this.getTenureAnalytics = this.importHandler("./employee/tenure_analytics.ipc");
    this.getGenderAnalytics = this.importHandler("./employee/gender_analytics.ipc");
    this.getAgeGroupAnalytics = this.importHandler("./employee/age_group_analytics.ipc");
    this.getEmploymentTypeAnalytics = this.importHandler("./employee/employment_type_analytics.ipc");
    this.getEmployeeDistribution = this.importHandler("./employee/employee_distribution.ipc");

    // 💰 PAYROLL ANALYTICS HANDLERS
    this.getPayrollAnalytics = this.importHandler("./payroll/payroll_analytics.ipc");
    this.getSalaryAnalytics = this.importHandler("./payroll/salary_analytics.ipc");
    this.getDeductionAnalytics = this.importHandler("./payroll/deduction_analytics.ipc");
    this.getAllowanceAnalytics = this.importHandler("./payroll/allowance_analytics.ipc");
    this.getTaxAnalytics = this.importHandler("./payroll/tax_analytics.ipc");
    this.getGovernmentContributionsAnalytics = this.importHandler("./payroll/govt_contributions_analytics.ipc");
    this.getOvertimeCostAnalytics = this.importHandler("./payroll/overtime_cost_analytics.ipc");
    this.getBonusAnalytics = this.importHandler("./payroll/bonus_analytics.ipc");
    this.getCostCenterAnalytics = this.importHandler("./payroll/cost_center_analytics.ipc");
    this.getBudgetAnalytics = this.importHandler("./payroll/budget_analytics.ipc");

    // ⏰ ATTENDANCE ANALYTICS HANDLERS
    this.getAttendanceAnalytics = this.importHandler("./attendance/attendance_analytics.ipc");
    this.getPunctualityAnalytics = this.importHandler("./attendance/punctuality_analytics.ipc");
    this.getAbsenteeismAnalytics = this.importHandler("./attendance/absenteeism_analytics.ipc");
    this.getOvertimeAnalytics = this.importHandler("./attendance/overtime_analytics.ipc");
    this.getLateArrivalAnalytics = this.importHandler("./attendance/late_arrival_analytics.ipc");
    this.getEarlyDepartureAnalytics = this.importHandler("./attendance/early_departure_analytics.ipc");
    this.getAttendancePatterns = this.importHandler("./attendance/attendance_patterns.ipc");
    this.getShiftAnalytics = this.importHandler("./attendance/shift_analytics.ipc");
    this.getLeaveAnalytics = this.importHandler("./attendance/leave_analytics.ipc");

    // 🏢 ORGANIZATION ANALYTICS HANDLERS
    this.getOrganizationAnalytics = this.importHandler("./organization/org_analytics.ipc");
    this.getDepartmentPerformance = this.importHandler("./organization/department_performance.ipc");
    this.getTeamPerformance = this.importHandler("./organization/team_performance.ipc");
    this.getLocationAnalytics = this.importHandler("./organization/location_analytics.ipc");
    this.getHierarchyAnalytics = this.importHandler("./organization/hierarchy_analytics.ipc");
    this.getSpanOfControlAnalytics = this.importHandler("./organization/span_of_control_analytics.ipc");
    this.getCostPerDepartment = this.importHandler("./organization/cost_per_department.ipc");
    this.getProductivityPerDepartment = this.importHandler("./organization/productivity_per_department.ipc");

    // 📊 VISUALIZATION DATA HANDLERS
    this.getChartData = this.importHandler("./visualization/chart_data.ipc");
    this.getGraphData = this.importHandler("./visualization/graph_data.ipc");
    this.getTableData = this.importHandler("./visualization/table_data.ipc");
    this.getHeatmapData = this.importHandler("./visualization/heatmap_data.ipc");
    this.getGeographicData = this.importHandler("./visualization/geographic_data.ipc");
    this.getTimelineData = this.importHandler("./visualization/timeline_data.ipc");
    this.getGaugeData = this.importHandler("./visualization/gauge_data.ipc");
    this.getPieChartData = this.importHandler("./visualization/pie_chart_data.ipc");
    this.getBarChartData = this.importHandler("./visualization/bar_chart_data.ipc");
    this.getLineChartData = this.importHandler("./visualization/line_chart_data.ipc");

    // 🚨 ALERT & NOTIFICATION HANDLERS
    this.getSystemAlerts = this.importHandler("./alerts/system_alerts.ipc");
    this.getPayrollAlerts = this.importHandler("./alerts/payroll_alerts.ipc");
    this.getAttendanceAlerts = this.importHandler("./alerts/attendance_alerts.ipc");
    this.getComplianceAlerts = this.importHandler("./alerts/compliance_alerts.ipc");
    this.getFinancialAlerts = this.importHandler("./alerts/financial_alerts.ipc");
    this.getHRAlerts = this.importHandler("./alerts/hr_alerts.ipc");
    this.getCriticalAlerts = this.importHandler("./alerts/critical_alerts.ipc");
    this.getWarningAlerts = this.importHandler("./alerts/warning_alerts.ipc");
    this.getNotificationCount = this.importHandler("./alerts/notification_count.ipc");
    this.getUnresolvedAlerts = this.importHandler("./alerts/unresolved_alerts.ipc");

    // 🔄 REAL-TIME DATA HANDLERS
    this.getRealTimeData = this.importHandler("./realtime/realtime_data.ipc");
    this.getLiveAttendance = this.importHandler("./realtime/live_attendance.ipc");
    this.getLivePayroll = this.importHandler("./realtime/live_payroll.ipc");
    this.getLiveSystemStatus = this.importHandler("./realtime/live_system_status.ipc");
    this.getLiveEmployeeStatus = this.importHandler("./realtime/live_employee_status.ipc");
    this.getLiveFinancialData = this.importHandler("./realtime/live_financial_data.ipc");
    this.getLiveUpdates = this.importHandler("./realtime/live_updates.ipc");
    this.subscribeToLiveData = this.importHandler("./realtime/subscribe_live_data.ipc");
    this.unsubscribeFromLiveData = this.importHandler("./realtime/unsubscribe_live_data.ipc");

    // ⚙️ DASHBOARD CUSTOMIZATION HANDLERS
    this.getUserDashboardConfig = this.importHandler("./customization/get_user_config.ipc");
    this.saveUserDashboardConfig = this.importHandler("./customization/save_user_config.ipc");
    this.resetDashboardConfig = this.importHandler("./customization/reset_config.ipc");
    this.getWidgets = this.importHandler("./customization/get_widgets.ipc");
    this.addWidget = this.importHandler("./customization/add_widget.ipc");
    this.removeWidget = this.importHandler("./customization/remove_widget.ipc");
    this.updateWidgetPosition = this.importHandler("./customization/update_widget_position.ipc");
    this.updateWidgetSettings = this.importHandler("./customization/update_widget_settings.ipc");
    this.getAvailableWidgets = this.importHandler("./customization/get_available_widgets.ipc");
    this.createCustomWidget = this.importHandler("./customization/create_custom_widget.ipc");

    // 📋 REPORT & EXPORT HANDLERS
    this.generateDashboardReport = this.importHandler("./reports/generate_report.ipc");
    this.exportDashboardData = this.importHandler("./reports/export_data.ipc");
    this.printDashboard = this.importHandler("./reports/print_dashboard.ipc");
    this.saveDashboardSnapshot = this.importHandler("./reports/save_snapshot.ipc");
    this.getReportHistory = this.importHandler("./reports/get_report_history.ipc");
    this.scheduleDashboardReport = this.importHandler("./reports/schedule_report.ipc");
    this.getScheduledReports = this.importHandler("./reports/get_scheduled_reports.ipc");
    this.cancelScheduledReport = this.importHandler("./reports/cancel_scheduled_report.ipc");

    // ⚙️ VALIDATION & UTILITY HANDLERS
    this.validateDashboardData = this.importHandler("./validation/validate_data.ipc");
    this.getDataRefreshStatus = this.importHandler("./utility/get_refresh_status.ipc");
    this.refreshDashboardData = this.importHandler("./utility/refresh_data.ipc");
    this.clearDashboardCache = this.importHandler("./utility/clear_cache.ipc");
    this.getDashboardVersion = this.importHandler("./utility/get_version.ipc");
    this.getSystemHealth = this.importHandler("./utility/get_system_health.ipc");
    this.getDataSources = this.importHandler("./utility/get_data_sources.ipc");
    this.testDataConnection = this.importHandler("./utility/test_data_connection.ipc");
  }

  /**
   * @param {string} path
   */
  importHandler(path) {
    try {
      return require(path);
    } catch (error) {
      console.warn(
        `[DashboardHandler] Failed to load handler: ${path}`,
        // @ts-ignore
        error.message,
      );
      return async () => ({
        status: false,
        message: `Handler not found: ${path}`,
        data: null,
      });
    }
  }

  /** @param {Electron.IpcMainInvokeEvent} event @param {{ method: any; params: {}; }} payload */
  async handleRequest(event, payload) {
    try {
      const method = payload.method;
      const params = payload.params || {};

      // Log the request
      if (logger) {
        // @ts-ignore
        logger.info(`DashboardHandler: ${method}`, { params });
      }

      // ROUTE REQUESTS
      switch (method) {
        // 📊 MAIN DASHBOARD OPERATIONS
        case "getMainDashboard":
          // @ts-ignore
          return await this.getMainDashboard(params.userId);

        case "getHRDashboard":
          // @ts-ignore
          return await this.getHRDashboard(params.userId, params.filters);

        case "getPayrollDashboard":
          // @ts-ignore
          return await this.getPayrollDashboard(params.userId, params.filters);

        case "getAttendanceDashboard":
          // @ts-ignore
          return await this.getAttendanceDashboard(params.userId, params.filters);

        case "getExecutiveDashboard":
          // @ts-ignore
          return await this.getExecutiveDashboard(params.userId);

        case "getManagerDashboard":
          // @ts-ignore
          return await this.getManagerDashboard(params.userId, params.departmentId);

        case "getEmployeeDashboard":
          // @ts-ignore
          return await this.getEmployeeDashboard(params.userId, params.employeeId);

        case "getAdminDashboard":
          // @ts-ignore
          return await this.getAdminDashboard(params.userId);

        case "getRealTimeDashboard":
          // @ts-ignore
          return await this.getRealTimeDashboard(params.userId);

        // 📈 OVERVIEW & SUMMARY OPERATIONS
        case "getSystemOverview":
          // @ts-ignore
          return await this.getSystemOverview(params.dateRange);

        case "getPayrollOverview":
          // @ts-ignore
          return await this.getPayrollOverview(params.periodId);

        case "getAttendanceOverview":
          // @ts-ignore
          return await this.getAttendanceOverview(params.date);

        case "getEmployeeOverview":
          // @ts-ignore
          return await this.getEmployeeOverview(params.filters);

        case "getFinancialOverview":
          // @ts-ignore
          return await this.getFinancialOverview(params.periodId);

        case "getComplianceOverview":
          // @ts-ignore
          return await this.getComplianceOverview(params.complianceType);

        case "getPerformanceOverview":
          // @ts-ignore
          return await this.getPerformanceOverview(params.departmentId);

        case "getTodayOverview":
          // @ts-ignore
          return await this.getTodayOverview(params.userId);

        case "getMonthlyOverview":
          // @ts-ignore
          return await this.getMonthlyOverview(params.year, params.month);

        // 📊 KPI & METRICS OPERATIONS
        case "getKPIMetrics":
          // @ts-ignore
          return await this.getKPIMetrics(params.kpiType);

        case "getAttendanceMetrics":
          // @ts-ignore
          return await this.getAttendanceMetrics(params.dateRange);

        case "getPayrollMetrics":
          // @ts-ignore
          return await this.getPayrollMetrics(params.periodId);

        case "getHRMetrics":
          // @ts-ignore
          return await this.getHRMetrics(params.metricType);

        case "getFinancialMetrics":
          // @ts-ignore
          return await this.getFinancialMetrics(params.dateRange);

        case "getComplianceMetrics":
          // @ts-ignore
          return await this.getComplianceMetrics(params.complianceType);

        case "getProductivityMetrics":
          // @ts-ignore
          return await this.getProductivityMetrics(params.departmentId);

        case "getCostMetrics":
          // @ts-ignore
          return await this.getCostMetrics(params.costType);

        case "getTurnoverMetrics":
          // @ts-ignore
          return await this.getTurnoverMetrics(params.dateRange);

        case "getHeadcountMetrics":
          // @ts-ignore
          return await this.getHeadcountMetrics(params.departmentId);

        // 📅 TIME-BASED ANALYTICS OPERATIONS
        case "getDailyAnalytics":
          // @ts-ignore
          return await this.getDailyAnalytics(params.date);

        case "getWeeklyAnalytics":
          // @ts-ignore
          return await this.getWeeklyAnalytics(params.weekNumber, params.year);

        case "getMonthlyAnalytics":
          return await this.getMonthlyAnalytics(
            // @ts-ignore
            params.year,
            // @ts-ignore
            params.month,
          );

        case "getQuarterlyAnalytics":
          return await this.getQuarterlyAnalytics(
            // @ts-ignore
            params.year,
            // @ts-ignore
            params.quarter,
          );

        case "getYearlyAnalytics":
          // @ts-ignore
          return await this.getYearlyAnalytics(params.year);

        case "getPeriodComparison":
          return await this.getPeriodComparison(
            // @ts-ignore
            params.period1,
            // @ts-ignore
            params.period2,
          );

        case "getTrendAnalysis":
          return await this.getTrendAnalysis(
            // @ts-ignore
            params.startDate,
            // @ts-ignore
            params.endDate,
            // @ts-ignore
            params.metric,
          );

        case "getSeasonalAnalysis":
          // @ts-ignore
          return await this.getSeasonalAnalysis(params.year);

        case "getYTDSummary":
          // @ts-ignore
          return await this.getYTDSummary(params.asOfDate);

        // 👥 EMPLOYEE ANALYTICS OPERATIONS
        case "getEmployeeAnalytics":
          // @ts-ignore
          return await this.getEmployeeAnalytics(params.employeeId);

        case "getDepartmentAnalytics":
          // @ts-ignore
          return await this.getDepartmentAnalytics(params.departmentId);

        case "getTeamAnalytics":
          // @ts-ignore
          return await this.getTeamAnalytics(params.teamId);

        case "getPositionAnalytics":
          // @ts-ignore
          return await this.getPositionAnalytics(params.position);

        case "getTenureAnalytics":
          // @ts-ignore
          return await this.getTenureAnalytics(params.tenureRange);

        case "getGenderAnalytics":
          // @ts-ignore
          return await this.getGenderAnalytics(params.departmentId);

        case "getAgeGroupAnalytics":
          // @ts-ignore
          return await this.getAgeGroupAnalytics(params.ageGroups);

        case "getEmploymentTypeAnalytics":
          // @ts-ignore
          return await this.getEmploymentTypeAnalytics(params.employmentType);

        case "getEmployeeDistribution":
          // @ts-ignore
          return await this.getEmployeeDistribution(params.groupBy);

        // 💰 PAYROLL ANALYTICS OPERATIONS
        case "getPayrollAnalytics":
          // @ts-ignore
          return await this.getPayrollAnalytics(params.periodId);

        case "getSalaryAnalytics":
          // @ts-ignore
          return await this.getSalaryAnalytics(params.salaryRange);

        case "getDeductionAnalytics":
          // @ts-ignore
          return await this.getDeductionAnalytics(params.deductionType);

        case "getAllowanceAnalytics":
          // @ts-ignore
          return await this.getAllowanceAnalytics(params.allowanceType);

        case "getTaxAnalytics":
          // @ts-ignore
          return await this.getTaxAnalytics(params.taxType);

        case "getGovernmentContributionsAnalytics":
          // @ts-ignore
          return await this.getGovernmentContributionsAnalytics(params.agency);

        case "getOvertimeCostAnalytics":
          // @ts-ignore
          return await this.getOvertimeCostAnalytics(params.dateRange);

        case "getBonusAnalytics":
          // @ts-ignore
          return await this.getBonusAnalytics(params.bonusType);

        case "getCostCenterAnalytics":
          // @ts-ignore
          return await this.getCostCenterAnalytics(params.costCenter);

        case "getBudgetAnalytics":
          // @ts-ignore
          return await this.getBudgetAnalytics(params.budgetId);

        // ⏰ ATTENDANCE ANALYTICS OPERATIONS
        case "getAttendanceAnalytics":
          // @ts-ignore
          return await this.getAttendanceAnalytics(params.dateRange);

        case "getPunctualityAnalytics":
          // @ts-ignore
          return await this.getPunctualityAnalytics(params.departmentId);

        case "getAbsenteeismAnalytics":
          // @ts-ignore
          return await this.getAbsenteeismAnalytics(params.dateRange);

        case "getOvertimeAnalytics":
          // @ts-ignore
          return await this.getOvertimeAnalytics(params.overtimeType);

        case "getLateArrivalAnalytics":
          // @ts-ignore
          return await this.getLateArrivalAnalytics(params.dateRange);

        case "getEarlyDepartureAnalytics":
          // @ts-ignore
          return await this.getEarlyDepartureAnalytics(params.dateRange);

        case "getAttendancePatterns":
          // @ts-ignore
          return await this.getAttendancePatterns(params.employeeId);

        case "getShiftAnalytics":
          // @ts-ignore
          return await this.getShiftAnalytics(params.shiftType);

        case "getLeaveAnalytics":
          // @ts-ignore
          return await this.getLeaveAnalytics(params.leaveType);

        // 🏢 ORGANIZATION ANALYTICS OPERATIONS
        case "getOrganizationAnalytics":
          // @ts-ignore
          return await this.getOrganizationAnalytics(params.organizationId);

        case "getDepartmentPerformance":
          // @ts-ignore
          return await this.getDepartmentPerformance(params.departmentId);

        case "getTeamPerformance":
          // @ts-ignore
          return await this.getTeamPerformance(params.teamId);

        case "getLocationAnalytics":
          // @ts-ignore
          return await this.getLocationAnalytics(params.location);

        case "getHierarchyAnalytics":
          // @ts-ignore
          return await this.getHierarchyAnalytics(params.level);

        case "getSpanOfControlAnalytics":
          // @ts-ignore
          return await this.getSpanOfControlAnalytics(params.managerId);

        case "getCostPerDepartment":
          // @ts-ignore
          return await this.getCostPerDepartment(params.costType);

        case "getProductivityPerDepartment":
          // @ts-ignore
          return await this.getProductivityPerDepartment(params.metric);

        // 📊 VISUALIZATION DATA OPERATIONS
        case "getChartData":
          // @ts-ignore
          return await this.getChartData(params.chartType, params.filters);

        case "getGraphData":
          // @ts-ignore
          return await this.getGraphData(params.graphType, params.filters);

        case "getTableData":
          // @ts-ignore
          return await this.getTableData(params.tableType, params.filters);

        case "getHeatmapData":
          // @ts-ignore
          return await this.getHeatmapData(params.heatmapType, params.filters);

        case "getGeographicData":
          // @ts-ignore
          return await this.getGeographicData(params.geographicType, params.filters);

        case "getTimelineData":
          // @ts-ignore
          return await this.getTimelineData(params.timelineType, params.filters);

        case "getGaugeData":
          // @ts-ignore
          return await this.getGaugeData(params.gaugeType, params.filters);

        case "getPieChartData":
          // @ts-ignore
          return await this.getPieChartData(params.pieChartType, params.filters);

        case "getBarChartData":
          // @ts-ignore
          return await this.getBarChartData(params.barChartType, params.filters);

        case "getLineChartData":
          // @ts-ignore
          return await this.getLineChartData(params.lineChartType, params.filters);

        // 🚨 ALERT & NOTIFICATION OPERATIONS
        case "getSystemAlerts":
          // @ts-ignore
          return await this.getSystemAlerts(params.alertLevel);

        case "getPayrollAlerts":
          // @ts-ignore
          return await this.getPayrollAlerts(params.periodId);

        case "getAttendanceAlerts":
          // @ts-ignore
          return await this.getAttendanceAlerts(params.date);

        case "getComplianceAlerts":
          // @ts-ignore
          return await this.getComplianceAlerts(params.complianceType);

        case "getFinancialAlerts":
          // @ts-ignore
          return await this.getFinancialAlerts(params.alertType);

        case "getHRAlerts":
          // @ts-ignore
          return await this.getHRAlerts(params.hrCategory);

        case "getCriticalAlerts":
          // @ts-ignore
          return await this.getCriticalAlerts(params.unresolvedOnly);

        case "getWarningAlerts":
          // @ts-ignore
          return await this.getWarningAlerts(params.departmentId);

        case "getNotificationCount":
          // @ts-ignore
          return await this.getNotificationCount(params.userId);

        case "getUnresolvedAlerts":
          // @ts-ignore
          return await this.getUnresolvedAlerts(params.alertType);

        // 🔄 REAL-TIME DATA OPERATIONS
        case "getRealTimeData":
          // @ts-ignore
          return await this.getRealTimeData(params.dataType);

        case "getLiveAttendance":
          // @ts-ignore
          return await this.getLiveAttendance(params.departmentId);

        case "getLivePayroll":
          // @ts-ignore
          return await this.getLivePayroll(params.periodId);

        case "getLiveSystemStatus":
          // @ts-ignore
          return await this.getLiveSystemStatus();

        case "getLiveEmployeeStatus":
          // @ts-ignore
          return await this.getLiveEmployeeStatus(params.employeeId);

        case "getLiveFinancialData":
          // @ts-ignore
          return await this.getLiveFinancialData(params.financialType);

        case "getLiveUpdates":
          // @ts-ignore
          return await this.getLiveUpdates(params.updateType);

        case "subscribeToLiveData":
          // @ts-ignore
          return await this.subscribeToLiveData(params.subscriptionId, params.dataType);

        case "unsubscribeFromLiveData":
          // @ts-ignore
          return await this.unsubscribeFromLiveData(params.subscriptionId);

        // ⚙️ DASHBOARD CUSTOMIZATION OPERATIONS
        case "getUserDashboardConfig":
          // @ts-ignore
          return await this.getUserDashboardConfig(params.userId);

        case "saveUserDashboardConfig":
          return await this.handleWithTransaction(
            this.saveUserDashboardConfig,
            // @ts-ignore
            params,
          );

        case "resetDashboardConfig":
          return await this.handleWithTransaction(
            this.resetDashboardConfig,
            // @ts-ignore
            params,
          );

        case "getWidgets":
          // @ts-ignore
          return await this.getWidgets(params.userId);

        case "addWidget":
          return await this.handleWithTransaction(
            this.addWidget,
            // @ts-ignore
            params,
          );

        case "removeWidget":
          return await this.handleWithTransaction(
            this.removeWidget,
            // @ts-ignore
            params,
          );

        case "updateWidgetPosition":
          return await this.handleWithTransaction(
            this.updateWidgetPosition,
            // @ts-ignore
            params,
          );

        case "updateWidgetSettings":
          return await this.handleWithTransaction(
            this.updateWidgetSettings,
            // @ts-ignore
            params,
          );

        case "getAvailableWidgets":
          // @ts-ignore
          return await this.getAvailableWidgets(params.userRole);

        case "createCustomWidget":
          return await this.handleWithTransaction(
            this.createCustomWidget,
            // @ts-ignore
            params,
          );

        // 📋 REPORT & EXPORT OPERATIONS
        case "generateDashboardReport":
          return await this.generateDashboardReport(
            // @ts-ignore
            params.reportType,
            // @ts-ignore
            params.filters,
          );

        case "exportDashboardData":
          return await this.exportDashboardData(
            // @ts-ignore
            params.dataType,
            // @ts-ignore
            params.format,
            // @ts-ignore
            params.filters,
          );

        case "printDashboard":
          // @ts-ignore
          return await this.printDashboard(params.dashboardType, params.filters);

        case "saveDashboardSnapshot":
          return await this.handleWithTransaction(
            this.saveDashboardSnapshot,
            // @ts-ignore
            params,
          );

        case "getReportHistory":
          // @ts-ignore
          return await this.getReportHistory(params.userId, params.limit);

        case "scheduleDashboardReport":
          return await this.handleWithTransaction(
            this.scheduleDashboardReport,
            // @ts-ignore
            params,
          );

        case "getScheduledReports":
          // @ts-ignore
          return await this.getScheduledReports(params.userId);

        case "cancelScheduledReport":
          return await this.handleWithTransaction(
            this.cancelScheduledReport,
            // @ts-ignore
            params,
          );

        // ⚙️ VALIDATION & UTILITY OPERATIONS
        case "validateDashboardData":
          return await this.validateDashboardData(params);

        case "getDataRefreshStatus":
          // @ts-ignore
          return await this.getDataRefreshStatus(params.dataType);

        case "refreshDashboardData":
          return await this.handleWithTransaction(
            this.refreshDashboardData,
            // @ts-ignore
            params,
          );

        case "clearDashboardCache":
          // @ts-ignore
          return await this.clearDashboardCache(params.cacheType);

        case "getDashboardVersion":
          // @ts-ignore
          return await this.getDashboardVersion();

        case "getSystemHealth":
          // @ts-ignore
          return await this.getSystemHealth();

        case "getDataSources":
          // @ts-ignore
          return await this.getDataSources();

        case "testDataConnection":
          // @ts-ignore
          return await this.testDataConnection(params.dataSource);

        default:
          return {
            status: false,
            message: `Unknown method: ${method}`,
            data: null,
          };
      }
    } catch (error) {
      console.error("DashboardHandler error:", error);
      if (logger) {
        // @ts-ignore
        logger.error("DashboardHandler error:", error);
      }
      return {
        status: false,
        // @ts-ignore
        message: error.message || "Internal server error",
        data: null,
      };
    }
  }

  /**
   * Wrap critical operations in a database transaction
   * @param {(arg0: any, arg1: import("typeorm").QueryRunner) => any} handler
   * @param {any} params
   */
  async handleWithTransaction(handler, params) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await handler(params, queryRunner);

      if (result.status) {
        await queryRunner.commitTransaction();
      } else {
        await queryRunner.rollbackTransaction();
      }

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

// Register IPC handler
const dashboardHandler = new DashboardHandler();

ipcMain.handle(
  "dashboard",
  withErrorHandling(
    // @ts-ignore
    dashboardHandler.handleRequest.bind(dashboardHandler),
    "IPC:dashboard",
  ),
);

module.exports = { DashboardHandler, dashboardHandler };
const overtimeLogService = require("../../../services/OvertimeLog");

/**
 * Generate a simple text report of overtime logs (can be extended to PDF).
 * @param {Object} params - Request parameters.
 * @param {Object} [params.filters] - Filters for the report.
 * @param {string} [params.format] - Report format (text, json). Default 'text'.
 * @returns {Promise<{ success: boolean, message?: string, data?: any }>}
 */
module.exports = async (params) => {
  try {
    const { filters = {}, format = 'text' } = params;

    const logs = await overtimeLogService.findAll(filters);
    const summary = await overtimeLogService.getSummary(filters);

    if (format === 'json') {
      return { success: true, data: { logs, summary } };
    }

    // Plain text report
    const lines = [];
    lines.push('OVERTIME REPORT');
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push(`Filters: ${JSON.stringify(filters)}`);
    lines.push('='.repeat(50));
    lines.push(`Total Logs: ${summary.totalLogs}`);
    lines.push(`Total Hours: ${summary.totalHours}`);
    lines.push(`Total Amount: ${summary.totalAmount}`);
    lines.push(`Average Hours: ${summary.averageHours}`);
    lines.push('\nStatus Breakdown:');
    summary.statusCounts.forEach(({ status, count }) => {
      lines.push(`  ${status}: ${count}`);
    });
    lines.push('='.repeat(50));
    lines.push('\nDetails:');
    logs.forEach((log) => {
      lines.push(
        `ID: ${log.id} | Employee: ${log.employee?.firstName} ${log.employee?.lastName} | Date: ${log.date} | Hours: ${log.hours} | Amount: ${log.amount} | Status: ${log.approvalStatus}`
      );
    });

    return {
      success: true,
      data: { report: lines.join('\n'), summary, logsCount: logs.length },
    };
  } catch (error) {
    console.error('[generate_report.ipc] Error:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to generate overtime report',
    };
  }
};

const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');
const overtimeLogService = require("../../../services/OvertimeLog");

/**
 * Export overtime logs to a CSV file.
 * @param {Object} params - Request parameters.
 * @param {Object} [params.filters] - Filters to apply (same as findAll).
 * @param {string} [params.filePath] - Custom output file path (optional).
 * @returns {Promise<{ success: boolean, message?: string, data?: { filePath: string } }>}
 */
module.exports = async (params) => {
  try {
    const { filters = {}, filePath } = params;

    // Fetch the data
    const logs = await overtimeLogService.findAll(filters);

    if (!logs.length) {
      return { success: true, data: { filePath: null, count: 0 }, message: 'No data to export' };
    }

    // Define CSV headers
    const headers = [
      'ID',
      'Employee ID',
      'Employee Name',
      'Date',
      'Start Time',
      'End Time',
      'Hours',
      'Rate',
      'Amount',
      'Type',
      'Approval Status',
      'Approved By',
      'Note',
      'Payroll Record ID',
      'Created At',
      'Updated At',
    ];

    // Build CSV rows
    const rows = logs.map((log) => [
      log.id,
      log.employeeId,
      log.employee ? `${log.employee.firstName} ${log.employee.lastName}` : '',
      log.date,
      log.startTime,
      log.endTime,
      log.hours,
      log.rate,
      log.amount,
      log.type,
      log.approvalStatus,
      log.approvedBy || '',
      log.note ? `"${log.note.replace(/"/g, '""')}"` : '',
      log.payrollRecordId || '',
      log.createdAt ? new Date(log.createdAt).toLocaleString() : '',
      log.updatedAt ? new Date(log.updatedAt).toLocaleString() : '',
    ]);

    // Generate CSV content
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

    // Determine output path
    let outputPath = filePath;
    if (!outputPath) {
      const downloads = app.getPath('downloads');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      outputPath = path.join(downloads, `overtime_export_${timestamp}.csv`);
    }

    // Write file
    await fs.writeFile(outputPath, csvContent, 'utf8');

    return {
      success: true,
      data: { filePath: outputPath, count: logs.length },
      message: `Exported ${logs.length} records to ${outputPath}`,
    };
  } catch (error) {
    console.error('[export_csv.ipc] Error:', error.message);
    return {
      success: false,
      message: error.message || 'Failed to export overtime logs to CSV',
    };
  }
};
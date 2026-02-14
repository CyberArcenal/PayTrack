// generate_report.ipc - Generate a deduction report (PDF placeholder)
// @ts-check
// In a real implementation you would use a PDF library like pdfkit

const deductionService = require("../../../services/Deduction");

/**
 * Generate a report (currently returns summary data, ready for PDF generation)
 * @param {Object} params - Same filters as getDeductionStats
 * @param {string} [params.format] - "pdf" or "html" (default: "pdf")
 * @returns {Promise<{status: boolean, message: string, data: Object}>}
 */
module.exports = async (params) => {
  try {
    const { format = "pdf", ...filters } = params;

    // Reuse stats logic to get summary data
    const deductions = await deductionService.findAll(filters);

    // Calculate totals and group by type (similar to stats)
    // @ts-ignore
    const totalAmount = deductions.reduce((sum, d) => sum + parseFloat(d.amount), 0);
    const byType = {};
    deductions.forEach((d) => {
      const t = d.type;
      // @ts-ignore
      if (!byType[t]) byType[t] = { count: 0, total: 0 };
      // @ts-ignore
      byType[t].count++;
      // @ts-ignore
      byType[t].total += parseFloat(d.amount);
    });

    const reportData = {
      generatedAt: new Date().toISOString(),
      filters,
      summary: {
        totalRecords: deductions.length,
        totalAmount,
        byType,
      },
      details: deductions, // include full list if needed
    };

    // In a full implementation, you would generate a PDF buffer or file path here
    // For now, return the data so the frontend can render or pass to another service

    return {
      status: true,
      message: `Report data generated (format: ${format})`,
      data: reportData,
    };
  } catch (error) {
    console.error("Error in generateDeductionReport:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to generate report",
      // @ts-ignore
      data: null,
    };
  }
};
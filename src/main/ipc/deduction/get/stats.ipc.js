// get/stats.ipc - Get deduction statistics (total per type, per payroll, etc.)
// @ts-check

const deductionService = require("../../../../services/Deduction");

/**
 * Get aggregated statistics about deductions
 * @param {Object} params
 * @param {number} [params.payrollRecordId] - Filter by payroll record ID
 * @param {string} [params.startDate] - Start date (YYYY-MM-DD)
 * @param {string} [params.endDate] - End date (YYYY-MM-DD)
 * @returns {Promise<{status: boolean, message: string, data: Object}>}
 */
module.exports = async (params) => {
  try {
    const { payrollRecordId, startDate, endDate } = params;

    // Build filter options
    const options = { payrollRecordId, startDate, endDate };

    // Get all deductions matching filters (no pagination)
    const deductions = await deductionService.findAll(options);

    // Calculate statistics
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

    const stats = {
      totalDeductions: deductions.length,
      totalAmount,
      byType,
      filtered: { payrollRecordId, startDate, endDate },
    };

    return {
      status: true,
      message: "Deduction statistics retrieved",
      data: stats,
    };
  } catch (error) {
    console.error("Error in getDeductionStats:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to retrieve deduction statistics",
      // @ts-ignore
      data: null,
    };
  }
};

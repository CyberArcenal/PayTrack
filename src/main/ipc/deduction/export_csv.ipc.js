// export_csv.ipc - Export deductions to CSV format
// @ts-check
const { Parser } = require("json2csv");
const deductionService = require("../../../services/Deduction");

/**
 * Export deductions matching filters as CSV string
 * @param {Object} params - Same filters as getAllDeductions
 * @param {number} [params.payrollRecordId]
 * @param {string} [params.type]
 * @param {boolean} [params.isRecurring]
 * @param {string} [params.startDate]
 * @param {string} [params.endDate]
 * @param {string} [params.fields] - Comma-separated list of fields to include (default: all)
 * @returns {Promise<{status: boolean, message: string, data: { csv: string }|null}>}
 */
module.exports = async (params) => {
  try {
    const options = {
      payrollRecordId: params.payrollRecordId,
      type: params.type,
      isRecurring: params.isRecurring,
      startDate: params.startDate,
      endDate: params.endDate,
    };

    const deductions = await deductionService.findAll(options);

    if (!deductions.length) {
      return {
        status: true,
        message: "No deductions to export",
        data: { csv: "" },
      };
    }

    // Determine fields to export
    let fields = [];
    if (params.fields) {
      fields = params.fields.split(",").map((f) => f.trim());
    } else {
      // Default fields (omit relations to keep it flat)
      fields = [
        "id",
        "payrollRecordId",
        "type",
        "code",
        "description",
        "amount",
        "percentage",
        "isRecurring",
        "appliedDate",
        "note",
        "createdAt",
        "updatedAt",
      ];
    }

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(deductions);

    return {
      status: true,
      message: "CSV generated successfully",
      data: { csv },
    };
  } catch (error) {
    console.error("Error in exportDeductionsToCSV:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Failed to generate CSV",
      data: null,
    };
  }
};
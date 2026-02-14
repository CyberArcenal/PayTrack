// search.ipc - Search deductions by keyword (description, code, note)
// @ts-check
const Deduction = require("../../../entities/Deduction");
const { AppDataSource } = require("../../db/datasource");

/**
 * Search deductions using a text keyword
 * @param {Object} params
 * @param {string} params.keyword - Search term
 * @param {number} [params.payrollRecordId] - Optional filter by payroll
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const { keyword, payrollRecordId } = params;
    if (!keyword || typeof keyword !== "string") {
      throw new Error("Valid search keyword is required");
    }

    if (!AppDataSource.isInitialized) await AppDataSource.initialize();
    const repo = AppDataSource.getRepository(Deduction);

    const query = repo
      .createQueryBuilder("deduction")
      .leftJoinAndSelect("deduction.payrollRecord", "payrollRecord")
      .where(
        "deduction.description LIKE :keyword OR deduction.code LIKE :keyword OR deduction.note LIKE :keyword",
        { keyword: `%${keyword}%` },
      );

    if (payrollRecordId) {
      query.andWhere("deduction.payrollRecordId = :payrollRecordId", { payrollRecordId });
    }

    const results = await query.getMany();

    return {
      status: true,
      message: "Search completed",
      data: results,
    };
  } catch (error) {
    console.error("Error in searchDeductions:", error);
    return {
      status: false,
      // @ts-ignore
      message: error.message || "Search failed",
      data: null,
    };
  }
};
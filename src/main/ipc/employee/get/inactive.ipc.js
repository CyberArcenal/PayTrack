// ===================== inactive.ipc.js =====================
// @ts-check
const { logger } = require("../../../../utils/logger");
const getEmployeesByStatus = require("./by_status.ipc");

/**
 * Get inactive employees
 * @param {Object} filters
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getInactiveEmployees(filters = {}) {
  return await getEmployeesByStatus("inactive", filters);
};
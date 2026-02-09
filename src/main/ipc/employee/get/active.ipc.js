// ===================== active.ipc.js =====================
// @ts-check
const { logger } = require("../../../../utils/logger");
const getEmployeesByStatus = require("./by_status.ipc");

/**
 * Get active employees
 * @param {Object} filters
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getActiveEmployees(filters = {}) {
  return await getEmployeesByStatus("active", filters);
};
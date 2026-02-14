// src/main/ipc/payrollPeriod/open.ipc.js
const payrollPeriodService = require("../../../services/PayrollPeriod");

/**
 * Open a payroll period (set status to 'open')
 * If period is locked, unlocks it. If period is in another state, updates to open.
 * @param {Object} params
 * @param {number} params.id - Period ID
 * @param {string} [params.user] - User performing the action
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async (params) => {
  try {
    const { id, user = "system" } = params || {};
    if (!id) {
      throw new Error("Missing required parameter: id");
    }

    const period = await payrollPeriodService.findById(parseInt(id));
    if (!period) {
      throw new Error(`Payroll period with ID ${id} not found`);
    }

    let updated;
    if (period.status === "locked") {
      updated = await payrollPeriodService.unlockPeriod(parseInt(id), user);
    } else if (period.status === "open") {
      updated = period;
    } else if (period.status === "processing") {
      updated = await payrollPeriodService.update(parseInt(id), { status: "open" }, user);
    } else if (period.status === "closed") {
      throw new Error("Cannot open a closed period");
    } else {
      updated = await payrollPeriodService.update(parseInt(id), { status: "open" }, user);
    }

    return {
      status: true,
      message: "Payroll period opened successfully",
      data: updated,
    };
  } catch (error) {
    console.error("Error in openPayrollPeriod:", error);
    return {
      status: false,
      message: error.message || "Failed to open payroll period",
      data: null,
    };
  }
};
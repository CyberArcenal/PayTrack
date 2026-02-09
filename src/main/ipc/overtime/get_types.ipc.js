// src/ipc/handlers/overtime/get_types.ipc.js
const { logger } = require("../../../../utils/logger");

/**
 * Get available overtime types
 * @param {string} [category] - Optional category filter
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getOvertimeTypes(category) {
  try {
    const overtimeTypes = [
      {
        type: "regular",
        name: "Regular Overtime",
        description: "Overtime on regular working days",
        defaultRate: 1.25,
        minRate: 1.25,
        maxRate: 2.0,
        category: "standard",
        requiresApproval: true,
        taxable: true,
      },
      {
        type: "holiday",
        name: "Holiday Overtime",
        description: "Overtime on regular holidays",
        defaultRate: 2.0,
        minRate: 2.0,
        maxRate: 3.0,
        category: "premium",
        requiresApproval: true,
        taxable: true,
      },
      {
        type: "special-holiday",
        name: "Special Holiday Overtime",
        description: "Overtime on special non-working days",
        defaultRate: 1.3,
        minRate: 1.3,
        maxRate: 2.0,
        category: "premium",
        requiresApproval: true,
        taxable: true,
      },
      {
        type: "rest-day",
        name: "Rest Day Overtime",
        description: "Overtime on scheduled rest days",
        defaultRate: 1.3,
        minRate: 1.3,
        maxRate: 2.5,
        category: "premium",
        requiresApproval: true,
        taxable: true,
      },
      {
        type: "emergency",
        name: "Emergency Overtime",
        description: "Unscheduled emergency work",
        defaultRate: 1.5,
        minRate: 1.25,
        maxRate: 3.0,
        category: "special",
        requiresApproval: false, // Might auto-approve
        taxable: true,
      },
      {
        type: "weekend",
        name: "Weekend Overtime",
        description: "Overtime on weekends",
        defaultRate: 1.5,
        minRate: 1.25,
        maxRate: 2.5,
        category: "premium",
        requiresApproval: true,
        taxable: true,
      },
    ];

    // Filter by category if provided
    let filteredTypes = overtimeTypes;
    if (category) {
      filteredTypes = overtimeTypes.filter(type => type.category === category);
    }

    // Get statistics if needed
    const categories = [...new Set(overtimeTypes.map(type => type.category))];

    logger.debug(`Retrieved ${filteredTypes.length} overtime types${category ? ` for category: ${category}` : ''}`);

    return {
      status: true,
      message: "Overtime types retrieved successfully",
      data: {
        types: filteredTypes,
        categories,
        total: filteredTypes.length,
        defaultType: "regular",
      },
    };
  } catch (error) {
    logger.error("Error in getOvertimeTypes:", error);
    
    return {
      status: false,
      message: error.message || "Failed to retrieve overtime types",
      data: null,
    };
  }
};
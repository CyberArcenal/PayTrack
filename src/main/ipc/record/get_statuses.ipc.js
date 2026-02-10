// src/ipc/handlers/payroll-record/get_statuses.ipc.js
// @ts-check
const { logger } = require("../../../utils/logger");

/**
 * Get all available payroll record statuses
 */
async function getPayrollRecordStatuses() {
    try {
        const statuses = [
            {
                value: "unpaid",
                label: "Unpaid",
                description: "Payroll record created but not yet paid",
                color: "#ff6b6b",
                icon: "❌"
            },
            {
                value: "paid",
                label: "Paid",
                description: "Payment has been processed and completed",
                color: "#51cf66",
                icon: "✅"
            },
            {
                value: "partially-paid",
                label: "Partially Paid",
                description: "Partial payment has been made",
                color: "#ffd43b",
                icon: "⚠️"
            },
            {
                value: "cancelled",
                label: "Cancelled",
                description: "Payroll record has been cancelled",
                color: "#868e96",
                icon: "🗑️"
            }
        ];

        return {
            status: true,
            message: "Payroll statuses retrieved successfully",
            data: statuses
        };

    } catch (error) {
        logger.error("Failed to get payroll statuses:", error);
        return {
            status: false,
            message: `Failed to retrieve statuses: ${error.message}`,
            data: []
        };
    }
}

module.exports = getPayrollRecordStatuses;
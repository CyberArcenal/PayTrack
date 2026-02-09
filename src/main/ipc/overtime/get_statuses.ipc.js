// src/ipc/handlers/overtime/get_statuses.ipc.js
const { logger } = require("../../../../utils/logger");
const { AppDataSource } = require("../../../db/datasource");

/**
 * Get overtime approval statuses with counts
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getOvertimeStatuses() {
  try {
    const overtimeLogRepo = AppDataSource.getRepository("OvertimeLog");
    
    // Get counts for each status
    const statusCounts = await overtimeLogRepo
      .createQueryBuilder("overtime")
      .select("overtime.approvalStatus", "status")
      .addSelect("COUNT(*)", "count")
      .addSelect("SUM(overtime.hours)", "totalHours")
      .addSelect("SUM(overtime.amount)", "totalAmount")
      .groupBy("overtime.approvalStatus")
      .getRawMany();

    // Define all possible statuses
    const allStatuses = [
      {
        value: "pending",
        label: "Pending",
        description: "Awaiting approval",
        color: "warning",
        icon: "clock",
        canEdit: true,
        canDelete: true,
      },
      {
        value: "approved",
        label: "Approved",
        description: "Approved for payroll",
        color: "success",
        icon: "check-circle",
        canEdit: false,
        canDelete: false,
      },
      {
        value: "rejected",
        label: "Rejected",
        description: "Not approved",
        color: "danger",
        icon: "x-circle",
        canEdit: true, // Can be resubmitted
        canDelete: true,
      },
      {
        value: "cancelled",
        label: "Cancelled",
        description: "Cancelled by employee",
        color: "secondary",
        icon: "slash",
        canEdit: false,
        canDelete: true,
      },
    ];

    // Merge counts with status definitions
    const statusesWithCounts = allStatuses.map(status => {
      const countData = statusCounts.find(s => s.status === status.value) || {
        count: 0,
        totalHours: 0,
        totalAmount: 0,
      };

      return {
        ...status,
        count: parseInt(countData.count) || 0,
        totalHours: parseFloat(countData.totalHours) || 0,
        totalAmount: parseFloat(countData.totalAmount) || 0,
      };
    });

    // Calculate totals
    const totals = statusesWithCounts.reduce(
      (acc, status) => {
        acc.totalCount += status.count;
        acc.totalHours += status.totalHours;
        acc.totalAmount += status.totalAmount;
        return acc;
      },
      { totalCount: 0, totalHours: 0, totalAmount: 0 }
    );

    // Get recent status changes (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentChanges = await overtimeLogRepo
      .createQueryBuilder("overtime")
      .select("overtime.approvalStatus", "status")
      .addSelect("DATE(overtime.updatedAt)", "date")
      .addSelect("COUNT(*)", "count")
      .where("overtime.updatedAt >= :date", { date: sevenDaysAgo })
      .groupBy("DATE(overtime.updatedAt), overtime.approvalStatus")
      .orderBy("DATE(overtime.updatedAt)", "DESC")
      .getRawMany();

    // Format recent changes for chart
    const statusTrends = {};
    statusesWithCounts.forEach(status => {
      statusTrends[status.value] = {
        label: status.label,
        data: [],
      };
    });

    recentChanges.forEach(change => {
      if (statusTrends[change.status]) {
        statusTrends[change.status].data.push({
          date: change.date,
          count: parseInt(change.count),
        });
      }
    });

    logger.debug("Retrieved overtime statuses with counts");

    return {
      status: true,
      message: "Overtime statuses retrieved successfully",
      data: {
        statuses: statusesWithCounts,
        totals,
        trends: statusTrends,
        summary: {
          pendingApproval: statusesWithCounts.find(s => s.value === "pending")?.count || 0,
          approvedThisMonth: statusesWithCounts.find(s => s.value === "approved")?.count || 0,
          rejectionRate: totals.totalCount > 0 
            ? ((statusesWithCounts.find(s => s.value === "rejected")?.count || 0) / totals.totalCount * 100).toFixed(2)
            : 0,
        },
      },
    };
  } catch (error) {
    logger.error("Error in getOvertimeStatuses:", error);
    
    return {
      status: false,
      message: error.message || "Failed to retrieve overtime statuses",
      data: null,
    };
  }
};
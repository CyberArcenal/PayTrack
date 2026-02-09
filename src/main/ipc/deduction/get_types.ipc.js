// ===================== src/ipc/handlers/deduction/get_types.ipc.js =====================
// @ts-nocheck

const { AppDataSource } = require("../../db/datasource");

/**
 * Get available deduction types
 * @param {Object} [params]
 * @param {string} [params.category] - Optional category filter
 * @returns {Promise<{status: boolean, message: string, data: any}>}
 */
module.exports = async function getDeductionTypes(params = {}) {
  try {
    const deductionRepo = AppDataSource.getRepository("Deduction");
    
    // Get distinct deduction types from database
    const result = await deductionRepo
      .createQueryBuilder("deduction")
      .select("DISTINCT deduction.type", "type")
      .orderBy("deduction.type", "ASC")
      .getRawMany();
    
    const typesFromDB = result.map(r => r.type).filter(Boolean);
    
    // Define standard deduction types (with metadata)
    const standardTypes = [
      {
        value: "tax",
        label: "Withholding Tax",
        category: "government",
        description: "Tax deduction based on BIR regulations",
        isStandard: true
      },
      {
        value: "sss",
        label: "SSS Contribution",
        category: "government",
        description: "Social Security System contribution",
        isStandard: true
      },
      {
        value: "philhealth",
        label: "PhilHealth Contribution",
        category: "government",
        description: "Philippine Health Insurance Corporation",
        isStandard: true
      },
      {
        value: "pagibig",
        label: "Pag-IBIG Fund",
        category: "government",
        description: "Home Development Mutual Fund",
        isStandard: true
      },
      {
        value: "loan",
        label: "Loan Payment",
        category: "company",
        description: "Employee loan deductions",
        isStandard: true
      },
      {
        value: "advance",
        label: "Salary Advance",
        category: "company",
        description: "Salary advance repayment",
        isStandard: true
      },
      {
        value: "insurance",
        label: "Insurance Premium",
        category: "benefits",
        description: "Health/life insurance premium",
        isStandard: true
      },
      {
        value: "union_dues",
        label: "Union Dues",
        category: "organization",
        description: "Labor union membership fees",
        isStandard: true
      },
      {
        value: "charity",
        label: "Charity Donation",
        category: "voluntary",
        description: "Voluntary charity contribution",
        isStandard: true
      },
      {
        value: "other",
        label: "Other Deduction",
        category: "miscellaneous",
        description: "Other miscellaneous deductions",
        isStandard: true
      }
    ];
    
    // Combine standard types with custom types from database
    const allTypes = [...standardTypes];
    
    // Add custom types from database that aren't in standard types
    typesFromDB.forEach(dbType => {
      if (!standardTypes.some(st => st.value === dbType)) {
        allTypes.push({
          value: dbType,
          label: dbType.charAt(0).toUpperCase() + dbType.slice(1).replace('_', ' '),
          category: "custom",
          description: "Custom deduction type",
          isStandard: false
        });
      }
    });
    
    // Filter by category if specified
    let filteredTypes = allTypes;
    if (params.category) {
      filteredTypes = allTypes.filter(type => 
        type.category === params.category
      );
    }
    
    return {
      status: true,
      message: "Deduction types retrieved successfully",
      data: filteredTypes,
      meta: {
        total: filteredTypes.length,
        categories: [...new Set(allTypes.map(t => t.category))],
        hasCustomTypes: typesFromDB.some(dbType => 
          !standardTypes.some(st => st.value === dbType)
        )
      }
    };
    
  } catch (error) {
    return {
      status: false,
      message: `Failed to retrieve deduction types: ${error.message}`,
      data: null
    };
  }
};
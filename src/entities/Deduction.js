// ===================== Deduction.js =====================
// src/entities/Deduction.js
const { EntitySchema } = require("typeorm");

const Deduction = new EntitySchema({
  name: "Deduction",
  tableName: "deductions",
  columns: {
    id: {
      primary: true,
      type: "integer",
      generated: true,
      comment: "Unique identifier for deduction",
    },
    payrollRecordId: {
      type: "integer",
      nullable: false,
      comment: "Foreign key reference to payroll record",
    },
    type: {
      type: "varchar",
      length: 100,
      nullable: false,
      comment:
        "Type of deduction (tax, sss, philhealth, pag-ibig, loan, advance, other)",
    },
    code: {
      type: "varchar",
      length: 50,
      nullable: true,
      comment: "Deduction code for categorization",
    },
    description: {
      type: "text",
      nullable: true,
      comment: "Detailed description of deduction",
    },
    amount: {
      type: "decimal",
      precision: 15,
      scale: 2,
      nullable: false,
      default: 0,
      comment: "Deduction amount",
    },
    percentage: {
      type: "decimal",
      precision: 5,
      scale: 2,
      nullable: true,
      comment: "Percentage rate if applicable",
    },
    isRecurring: {
      type: "boolean",
      nullable: false,
      default: false,
      comment: "Whether this deduction repeats for each payroll",
    },
    appliedDate: {
      type: "date",
      nullable: false,
      default: () => "CURRENT_DATE",
      comment: "Date when deduction was applied",
    },
    note: {
      type: "text",
      nullable: true,
      comment: "Additional notes",
    },
    createdAt: {
      type: "datetime",
      createDate: true,
      comment: "Record creation timestamp",
    },
    updatedAt: {
      type: "datetime",
      updateDate: true,
      comment: "Record last update timestamp",
    },
  },
  relations: {
    payrollRecord: {
      type: "many-to-one",
      target: "PayrollRecord",
      joinColumn: {
        name: "payrollRecordId",
        referencedColumnName: "id",
      },
      nullable: false,
      onDelete: "CASCADE",
      inverseSide: "deductions",
    },
  },
  indices: [
    {
      name: "idx_deduction_payroll",
      columns: ["payrollRecordId"],
      unique: false,
    },
    {
      name: "idx_deduction_type",
      columns: ["type"],
      unique: false,
    },
    {
      name: "idx_deduction_recurring",
      columns: ["isRecurring"],
      unique: false,
    },
  ],
});

module.exports = Deduction;

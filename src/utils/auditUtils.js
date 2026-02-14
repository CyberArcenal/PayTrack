// src/utils/auditUtils.js
/**
 * Validate audit log data
 * @param {Object} data
 * @returns {{valid: boolean, errors: string[]}}
 */
function validateAuditData(data) {
  const errors = [];
  if (!data.action) {
    errors.push("action is required");
  }
  // entity is optional, but if present, should be string
  // entityId can be string or number
  // oldData/newData/changes can be anything, will be stringified
  // userId optional
  return { valid: errors.length === 0, errors };
}

module.exports = { validateAuditData };